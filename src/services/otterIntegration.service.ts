import { v4 as uuidv4 } from 'uuid';
import { Job, PgBoss } from 'pg-boss';
import { EntityManager } from 'typeorm';
import { AxiosInstance } from 'axios';
import { createOtterClient, exchangeOtterAuthCode, fetchOtterMenu, getOtterMenuJobStatus, getOtterStore, upsertOtterMenu } from '@/api/otter.api';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import {
  OtterMenuPushResult,
  OtterOAuthCallbackResult,
  OtterOAuthConnectResult,
  OtterIntegrationServiceInterface,
  OtterMenuSyncJob,
  OtterWebhookEvent,
} from '@interfaces/otterIntegration.interface';
import { OtterAuthServiceInterface, OtterOrganizationServiceInterface, OtterOrgStore, OtterTokenResponse } from '@interfaces/otter.interface';
import { PlatformIntegrationServiceInterface } from '@interfaces/platformIntegration.interface';
import { CreateRestaurantResponseInterface, RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import { RestaurantMenuSnapshotServiceInterface } from '@interfaces/restaurantMenuSnapshot.interface';
import { MenuDetailsServiceInterface } from '@interfaces/menuDetails.interface';
import { MenusModelsInterface, MenusServiceInterface } from '@interfaces/menus.interface';
import { MenuHoursServiceInterface } from '@interfaces/menuHours.interface';
import { ModifierGroupModelInterface } from '@interfaces/modifierGroup.interface';
import { mapOtterOrgStoreToRestaurant, validateOtterOrgStore } from '@utils/otterStore.mapper';
import { isOtterMenuUpdateEvent } from '@utils/otterWebhookEvent.util';
import { normalizeOtterMenus, stringifyNormalizedMenus } from '@utils/normalize';
import { buildOtterMenusUpsertRequest, OtterMenuPushInput, OtterModifierGroupSelectionRules } from '@utils/denormalizeOtterMenu';
import { generateHash } from '@utils/hashUtils';
import { acquireAdvisoryLock } from '@utils/advisoryLock';
import { ormConnection } from '@utils/dbUtils';
import { pool } from '@databases';
import { getBoss } from '@queue';
import { QUEUES } from '@constants/queues.constants';
import { EXTERNAL_PARTY } from '@constants/externalParty.constants';
import { MenuSyncProcessor } from '@menu-sync/processor/menu-sync.processor';
import { buildMenuSyncContext } from '@menu-sync/context-factory';
import { logger } from '@utils/logger';

const MENU_PUSH_JOB_POLL_ATTEMPTS = 5;
const MENU_PUSH_JOB_POLL_INTERVAL_MS = 1000;

const OTTER_PLATFORM = 'otter';
const EMPTY_TOKEN = '';

/**
 * Otter organization onboarding (authorization-code + store connection), the menu-sync engine
 * (fetch → normalize → diff → apply → snapshot), and the webhook ingress that triggers it.
 *
 * @see https://developer-guides.tryotter.com/docs/organization-integrations-onboarding-flow/
 * @see Documentation/OTTER_MENU_SYNC.md
 */
class OtterIntegrationService implements OtterIntegrationServiceInterface {
  constructor(
    private readonly platformIntegrationService: PlatformIntegrationServiceInterface,
    private readonly restaurantService: RestaurantsServiceInterface,
    private readonly otterOrganizationService: OtterOrganizationServiceInterface,
    private readonly otterAuthService: OtterAuthServiceInterface,
    private readonly restaurantMenuSnapshotService: RestaurantMenuSnapshotServiceInterface,
    private readonly menuDetailsService: MenuDetailsServiceInterface,
    private readonly menusService: MenusServiceInterface,
    private readonly menusModel: MenusModelsInterface,
    private readonly menuHoursService: MenuHoursServiceInterface,
    private readonly modifierGroupModel: ModifierGroupModelInterface,
  ) {}

  private get boss(): PgBoss {
    return getBoss();
  }

  private get processor(): MenuSyncProcessor {
    return new MenuSyncProcessor(buildMenuSyncContext());
  }

  /**
   * Webhook ingress. Routes `menus.*` event types (see `isOtterMenuUpdateEvent`) into the menu-sync
   * flow; everything else — order events (`orders.*`), infra/meta events (`ping`,
   * `callback.error.write`), and the legacy `stores.upsert` account-pairing event (organization
   * onboarding is driven by OAuth now, not `stores.upsert`) — is acknowledged and ignored. A missing or
   * non-string `eventType`, or any other malformed shape, is logged and ignored rather than thrown, so
   * a bad payload can't crash the request; the caller (`OtterIntegrationController.initWebhook`) always
   * responds 200 to Otter regardless.
   *
   * Within menu-update events, any event carrying a known, connected store id enqueues a sync — the
   * snapshot hash comparison in `processOtterMenuSyncJob` makes a redundant sync a cheap no-op, so this
   * stays deliberately permissive about *which* `menus.*` event fired. Events for an unknown/unconnected
   * store, or with no `storeId` at all, are logged and ignored.
   */
  handleOtterWebhook = async (event: OtterWebhookEvent): Promise<void> => {
    const eventType = event?.eventType;
    const eventId = event?.eventId ?? 'unknown';

    if (!eventType) {
      logger.warn(`Received Otter webhook with no eventType (eventId=${eventId}); acknowledged only.`);
      return;
    }

    if (!isOtterMenuUpdateEvent(event)) {
      logger.debug(`Received Otter webhook eventType=${eventType} eventId=${eventId}; not a menu-update event, acknowledged only.`);
      return;
    }

    const storeId = event.metadata?.storeId;
    if (!storeId) {
      logger.debug(`Received Otter menu-update webhook eventType=${eventType} eventId=${eventId} with no storeId; acknowledged only.`);
      return;
    }

    const integration = await this.platformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform(storeId, OTTER_PLATFORM);
    if (!integration?.restaurantID) {
      logger.debug(`Received Otter menu-update webhook eventType=${eventType} for unconnected store ${storeId}; acknowledged only.`);
      return;
    }

    await this.enqueueMenuSync(integration.restaurantID, storeId, eventId);
    logger.info(`Enqueued Otter menu sync for restaurant ${integration.restaurantID} (store ${storeId}) from webhook eventType=${eventType}.`);
  };

  private enqueueMenuSync = async (restaurantID: number, otterStoreId: string, eventId: string): Promise<void> => {
    const job: OtterMenuSyncJob = { eventId, restaurantID, otterStoreId };
    await this.boss.send(QUEUES.OTTER_MENU_SYNC, job, {
      singletonKey: `store-${otterStoreId}`,
      singletonNextSlot: true,
    });
  };

  triggerManualMenuSync = async (restaurantID: number): Promise<{ enqueued: boolean }> => {
    const integration = await this.platformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform(restaurantID, OTTER_PLATFORM);
    if (!integration?.otterLocationID) {
      throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant ${restaurantID} has no connected Otter store.`));
    }

    await this.enqueueMenuSync(restaurantID, integration.otterLocationID, uuidv4());
    logger.info(`Enqueued Otter menu sync for restaurant ${restaurantID} (store ${integration.otterLocationID}) via manual trigger.`);
    return { enqueued: true };
  };

  /**
   * Scheduled fallback (`QUEUES.OTTER_MENU_SYNC_SCAN`, hourly — see `server.ts`). Enumerates every
   * connected Otter store and enqueues a sync for each, exactly like the manual trigger does for one
   * restaurant. `enqueueMenuSync`'s singleton key already dedupes against a sync already pending/running
   * for the same store (e.g. one just enqueued by a webhook), so this is safe to run unconditionally.
   * One store's lookup/enqueue failure is logged and skipped rather than aborting the whole scan.
   */
  processOtterMenuSyncScan = async (): Promise<void> => {
    const integrations = await this.platformIntegrationService.getAllConnectedPlatformIntegrations(OTTER_PLATFORM);
    logger.info(`Otter scheduled sync scan: found ${integrations.length} connected store(s).`);

    for (const integration of integrations) {
      if (!integration.restaurantID || !integration.otterLocationID) {
        continue;
      }

      try {
        await this.enqueueMenuSync(integration.restaurantID, integration.otterLocationID, uuidv4());
      } catch (err) {
        logger.error(`Otter scheduled sync scan: failed to enqueue sync for restaurant ${integration.restaurantID}. - ${err}`);
      }
    }
  };

  /**
   * Fetches the store's current menu, diffs it against the last `'otter'` snapshot, applies changes,
   * and writes the new snapshot — mirrors `CheckmateIntegrationService.processCheckmateJob`. Guarded
   * by an advisory lock keyed on the Otter store id: pg-boss's `singletonKey` dedup isn't atomic (two
   * events arriving close together can both pass the check before either job starts), so a second
   * overlapping run for the same store bails out immediately (a no-op, not an error) rather than
   * racing the first.
   *
   * Extracted from `processOtterMenuSyncJob` (its pg-boss-shaped wrapper below) so `pushMenuToOtter`
   * can also call it directly — synchronously, before building the push payload — to guarantee
   * TapTab's local copy of availability is fresh at push time. See `pushMenuToOtter`'s own comment.
   */
  syncOtterMenuForRestaurant = async (restaurantID: number, otterStoreId: string): Promise<void> => {
    logger.info(`Processing Otter menu sync job for restaurant ${restaurantID} (store ${otterStoreId}).`);

    const lock = await acquireAdvisoryLock(pool, `otter-menu-sync:${otterStoreId}`);
    if (!lock.acquired) {
      logger.info(`Otter menu sync already in progress for store ${otterStoreId}; skipping this run.`);
      return;
    }

    try {
      const otterClient = createOtterClient({ authService: this.otterAuthService, storeId: otterStoreId });
      const otterMenus = await fetchOtterMenu(otterClient);

      const normalizedMenus = normalizeOtterMenus(otterMenus);
      const stringifiedMenus = stringifyNormalizedMenus(normalizedMenus);
      const menuHash = generateHash(stringifiedMenus);

      const latestSnapshot = await this.restaurantMenuSnapshotService.getLatestMenuSnapshot(restaurantID, EXTERNAL_PARTY.OTTER);

      const repository: EntityManager = await ormConnection();
      await repository.transaction(async (manager: EntityManager) => {
        if (latestSnapshot == null) {
          logger.debug(`No existing Otter menu snapshot for restaurant ${restaurantID}. Initializing menus...`);
          await this.menuDetailsService.createMenusDetailsFromNormalized(normalizedMenus, restaurantID, null, manager);
        } else if (latestSnapshot.menuHash === menuHash) {
          logger.debug(`Otter menu hash matches for restaurant ${restaurantID}. No update needed.`);
          return;
        } else {
          logger.debug(`Otter menu hash differs for restaurant ${restaurantID}. Processing menu update...`);
          await this.processor.process(latestSnapshot.menuJson, normalizedMenus, restaurantID, null, manager);
        }

        await this.restaurantMenuSnapshotService.createMenuSnapshot(restaurantID, normalizedMenus, menuHash, EXTERNAL_PARTY.OTTER, manager);
      });

      logger.info(`Otter menu sync complete for restaurant ${restaurantID}`);
    } finally {
      await lock.release();
    }
  };

  processOtterMenuSyncJob = async (jobs: Job<OtterMenuSyncJob>[]): Promise<void> => {
    const job = jobs[0];
    const { restaurantID, otterStoreId } = job.data;
    await this.syncOtterMenuForRestaurant(restaurantID, otterStoreId);
  };

  /**
   * Pushes the restaurant's complete current menu to Otter (full-replacement semantics — anything
   * omitted is deleted on Otter's side, so this always gathers the whole menu, never a diff).
   * `POST /v1/menus` returns immediately with a `PENDING` job; this does a short bounded poll to
   * catch the common fast-resolving case, matching the "aggressive timeout, no complex retry queue"
   * philosophy used elsewhere in this codebase — a job that's still `PENDING` after polling isn't
   * retried, since repeating the same complete payload later is safe (Otter's upsert is idempotent
   * in effect).
   *
   * Availability (`is_hidden`) is pull-authoritative — Otter owns it (see `normalizeOtterMenus`'s
   * `otterItemIsHidden`). TapTab's local copy is normally kept fresh by the webhook + hourly
   * `OTTER_MENU_SYNC_SCAN` fallback, but push is triggered by an unrelated manager edit (price,
   * description, ...) and could otherwise fire in the narrow gap right after a very recent
   * Otter-side 86, re-sending stale availability back to Otter and undoing it. Forcing a synchronous
   * `syncOtterMenuForRestaurant` immediately before gathering the push payload closes that gap by
   * reusing the same tested pull-sync path rather than inventing push-specific reconciliation logic.
   * If the resync itself fails (e.g. Otter unreachable), the push aborts rather than risk sending
   * stale data — the error propagates to the caller same as any other pushMenuToOtter failure.
   */
  pushMenuToOtter = async (restaurantID: number): Promise<OtterMenuPushResult> => {
    const integration = await this.platformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform(restaurantID, OTTER_PLATFORM);
    if (!integration?.otterLocationID) {
      throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant ${restaurantID} has no connected Otter store.`));
    }

    await this.syncOtterMenuForRestaurant(restaurantID, integration.otterLocationID);

    const menuEntities = await this.menusModel.getMenusEntitiesByRestaurantID(restaurantID);
    const menuInputs: OtterMenuPushInput[] = await Promise.all(
      menuEntities.map(async menuEntity => {
        const [menu, hours] = await Promise.all([
          // includeHidden: true -- Otter's upsert is a full-replacement keyed by id. Omitting a
          // hidden-but-existing modifier/group from the push payload tells Otter to DELETE it, not
          // mark it unavailable. Hidden entities must be included (with the correct saleStatus) here.
          this.menusService.getMenuDetails(menuEntity.menu_id, true),
          this.menuHoursService.getMenuHoursByMenuID(menuEntity.menu_id),
        ]);
        return { menu, hours };
      }),
    );

    const modifierGroups = await this.modifierGroupModel.fetchModifierGroupsByRestaurantID(restaurantID);
    const selectionRulesByID: Record<number, OtterModifierGroupSelectionRules> = {};
    for (const group of modifierGroups) {
      if (group.modifierGroupID == null) {
        continue;
      }
      selectionRulesByID[group.modifierGroupID] = {
        minimumSelections: group.minimumSelections,
        maximumSelections: group.maximumSelections,
        maxPerModifierSelectionQuantity: group.maxPerModifierSelectionQuantity,
      };
    }

    const request = buildOtterMenusUpsertRequest(menuInputs, selectionRulesByID);

    const otterClient = createOtterClient({ authService: this.otterAuthService, storeId: integration.otterLocationID });
    const job = await upsertOtterMenu(otterClient, request);
    logger.info(`Otter menu push started for restaurant ${restaurantID} (store ${integration.otterLocationID}), job ${job.jobReference.id}.`);

    const status = await this.pollMenuPushJobStatus(otterClient, job.jobReference.id);
    logger.info(`Otter menu push for restaurant ${restaurantID} job ${job.jobReference.id} finished with status ${status}.`);

    return { jobId: job.jobReference.id, status };
  };

  private pollMenuPushJobStatus = async (client: AxiosInstance, jobId: string): Promise<OtterMenuPushResult['status']> => {
    let status: OtterMenuPushResult['status'] = 'PENDING';
    for (let attempt = 0; attempt < MENU_PUSH_JOB_POLL_ATTEMPTS && status === 'PENDING'; attempt++) {
      await sleep(MENU_PUSH_JOB_POLL_INTERVAL_MS);
      const job = await getOtterMenuJobStatus(client, jobId);
      status = job.jobReference.status;
    }
    return status;
  };

  handleOAuthWithAuthCode = async (authCode: string, brandId?: string, otterStoreId?: string): Promise<OtterOAuthCallbackResult> => {
    try {
      const token = await exchangeOtterAuthCode(authCode);

      if (brandId && otterStoreId) {
        const connection = await this.connectSelectedStore(token, brandId, otterStoreId);
        return { connected: true, connection };
      }

      const selectableStores = await this.otterOrganizationService.listSelectableStores(token.access_token);
      if (selectableStores.length === 0) {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.inputValueNotInDB, 'No Otter stores found for the authorized user'));
      }

      if (selectableStores.length === 1) {
        const only = selectableStores[0];
        const connection = await this.connectSelectedStore(token, only.brandId, only.store.id, only.store);
        return { connected: true, connection };
      }

      logger.info(`Otter OAuth returned ${selectableStores.length} stores; client must select brandId + storeId`);
      return { connected: false, selectableStores };
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Otter OAuth callback failed: ${err}`);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, 'Failed to complete Otter OAuth onboarding'));
    }
  };

  connectStoreWithAuthCode = async (authCode: string, brandId: string, otterStoreId: string): Promise<OtterOAuthConnectResult> => {
    try {
      const token = await exchangeOtterAuthCode(authCode);
      return await this.connectSelectedStore(token, brandId, otterStoreId);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      logger.error(`Otter connect-store failed: ${err}`);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, 'Failed to connect Otter store'));
    }
  };

  private connectSelectedStore = async (
    token: OtterTokenResponse,
    brandId: string,
    otterStoreId: string,
    storeHint?: OtterOrgStore,
  ): Promise<OtterOAuthConnectResult> => {
    const existing = await this.platformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform(otterStoreId, OTTER_PLATFORM);
    if (existing?.restaurantID) {
      const restaurant = await this.findRestaurant(existing.restaurantID);
      if (restaurant) {
        await this.otterOrganizationService.connectStore(token.access_token, brandId, otterStoreId, String(existing.restaurantID));
        return {
          restaurantID: existing.restaurantID,
          otterStoreId,
          brandId,
          storeName: restaurant.name ?? storeHint?.name ?? otterStoreId,
        };
      }
    }

    const store = storeHint ?? (await getOtterStore(token.access_token, brandId, otterStoreId));
    const validationError = validateOtterOrgStore(store);
    if (validationError) {
      throw new HttpException(
        400,
        getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Otter store validation failed: ${validationError}`),
      );
    }

    const restaurantRequest = mapOtterOrgStoreToRestaurant(store);
    const duplicate = await this.restaurantService.findRestaurantEntityByNameAndAddress(
      restaurantRequest.name,
      restaurantRequest.address.address1,
      restaurantRequest.address.city ?? '',
      restaurantRequest.address.governingDistrict ?? '',
      restaurantRequest.address.country,
      restaurantRequest.address.postalCode ?? '',
    );
    if (duplicate) {
      throw new HttpException(
        409,
        getErrorPayload(InternalErrorCode.resourceConflict, 'A TapTab restaurant with this name and address already exists'),
      );
    }

    const restaurant: CreateRestaurantResponseInterface = await this.restaurantService.createRestaurantWithoutManager(restaurantRequest);
    const partnerStoreId = String(restaurant.restaurantID);

    await this.otterOrganizationService.connectStore(token.access_token, brandId, otterStoreId, partnerStoreId);

    const refreshToken = token.refresh_token ?? EMPTY_TOKEN;
    await this.platformIntegrationService.createPlatformIntegration(
      restaurant.restaurantID,
      token.access_token,
      refreshToken,
      token.expires_in,
      OTTER_PLATFORM,
      null,
      otterStoreId,
    );

    logger.info(`Connected Otter store ${otterStoreId} as restaurant ${restaurant.restaurantID}`);
    return {
      restaurantID: restaurant.restaurantID,
      otterStoreId,
      brandId,
      storeName: store.name,
    };
  };

  private findRestaurant = async (restaurantID: number) => {
    try {
      return await this.restaurantService.findRestaurantEntityByID(restaurantID);
    } catch {
      return null;
    }
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default OtterIntegrationService;
