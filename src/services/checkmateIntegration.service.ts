import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { CheckmateEvent, CheckmateIntegrationServiceInterface, CheckmateJob } from '@interfaces/checkmateIntegration.interface';
import { CreateRestaurantRequestInterface, CreateRestaurantResponseInterface, RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import { NormalizedMenu, PlatformIntegrationServiceInterface } from '@interfaces/platformIntegration.interface';
import { RestaurantMenuSnapshotServiceInterface } from '@interfaces/restaurantMenuSnapshot.interface';
import { Day } from '@enums/day';
import { v4 as uuidv4 } from 'uuid';
import { MenuDetailsServiceInterface } from '@interfaces/menuDetails.interface';
import { QUEUES } from '@constants/queues.constants';
import { Job, PgBoss } from 'pg-boss';
import { getBoss } from '@queue';
import { normalizeCheckmateMenus, stringifyNormalizedMenus } from '@utils/normalize';
import { generateHash } from '@utils/hashUtils';
import { CheckmateMenu, CheckmateServiceInterface, LocationInfo } from '@interfaces/checkmate.interface';
import CheckmateService from '@services/checkmate.service';
import { MenuSyncProcessor } from '@menu-sync/processor/menu-sync.processor';
import { buildMenuSyncContext } from '@menu-sync/context-factory';
import { createCheckmateClient } from '@/api/checkmate-auth.api';
import TokenStore from '@/api/token-store.api';
import { pool } from '@databases';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';

class CheckmateIntegrationService implements CheckmateIntegrationServiceInterface {
  private checkmateService: CheckmateServiceInterface;
  private platformIntegrationService: PlatformIntegrationServiceInterface;
  private restaurantService: RestaurantsServiceInterface;
  private restaurantMenuSnapshotService: RestaurantMenuSnapshotServiceInterface;
  private menuDetailsService: MenuDetailsServiceInterface;

  constructor(
    platformIntegrationService: PlatformIntegrationServiceInterface,
    restaurantService: RestaurantsServiceInterface,
    restaurantMenuSnapshotService: RestaurantMenuSnapshotServiceInterface,
    menuDetailsService: MenuDetailsServiceInterface,
  ) {
    this.checkmateService = new CheckmateService();
    this.platformIntegrationService = platformIntegrationService;
    this.restaurantService = restaurantService;
    this.restaurantMenuSnapshotService = restaurantMenuSnapshotService;
    this.menuDetailsService = menuDetailsService;
  }

  private get boss(): PgBoss {
    return getBoss();
  }

  private get processor(): MenuSyncProcessor {
    return new MenuSyncProcessor(buildMenuSyncContext());
  }

  /**
   * Handles an incoming Checkmate webhook event by resolving the target
   * restaurant and enqueuing a menu sync job.
   *
   * Looks up the `PlatformIntegration` record for the given `location_id` to
   * resolve the internal `restaurantID`. If found, enqueues a
   * `CHECKMATE_MENU_SYNC` pg-boss job scoped to that location.
   *
   * The job is enqueued with a `singletonKey` of `location-<location_id>` and
   * `singletonNextSlot: true`. This ensures at most one running job and one
   * pending job exist per location at any time — further events arriving while
   * both slots are filled are dropped.
   *
   * @param event - The webhook payload from Checkmate, containing `location_id`.
   * @throws {HttpException} 404 if no `PlatformIntegration` record exists for
   *   the given `location_id` and platform `'checkmate'`.
   * @throws {HttpException} 500 if job enqueuing fails for any other reason.
   *
   * @see {@link Documentation/MENU_SYNC.md#1-webhook-entry-point--post-checkmatewebhook}
   */
  handleCheckmateEvent = async (event: CheckmateEvent) => {
    try {
      const { location_id } = event;

      // Get platform integration by location_id to find restaurant
      const platformIntegration = await this.platformIntegrationService.getPlatformIntegrationByLocationIDAndPlatform(location_id, 'checkmate');

      if (!platformIntegration || !platformIntegration.restaurantID) {
        logger.error(`No platform integration found for Checkmate location_id: ${location_id}`);
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `No restaurant found for Checkmate location_id: ${location_id}`),
        );
      }

      const { restaurantID } = platformIntegration;
      const checkmateJob: CheckmateJob = {
        locationID: location_id,
        restaurantID: restaurantID,
      };
      await this.boss.send(QUEUES.CHECKMATE_MENU_SYNC, checkmateJob, {
        singletonKey: `location-${location_id}`,
        singletonNextSlot: true,
      });

      logger.debug(`Enqueued menu sync job for restaurant { restaurantID: ${restaurantID}, locationID: ${location_id} }`);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while handling checkmate event. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while handling checkmate event. Refer to logs for more detail.`),
        );
      }
    }
  };

  handleOAuthWithAuthCode = async (authCode: string): Promise<void> => {
    try {
      const token = await this.checkmateService.fetchAccessCode(authCode);

      // get location data
      const location = await this.checkmateService.fetchLocationInfo(token.access_token);
      const locationID: number = location.data.id;

      const restaurantRequest = this.mapCheckmateToRestaurant(location.data);

      const restaurant: CreateRestaurantResponseInterface = await this.restaurantService.createRestaurantWithoutManager(restaurantRequest);

      await this.checkmateService.activateLocation(token.access_token);

      // store platform integration pointed at restaurant
      await this.platformIntegrationService.createPlatformIntegration(
        restaurant.restaurantID,
        token.access_token,
        token.refresh_token,
        token.expires_in,
        'checkmate',
        locationID,
      );
      logger.info(`Successfully created new restaurant ${restaurant.restaurantID} with Checkmate integration (location_id: ${locationID})`);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while handling OAuth authorization. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while handling OAuth authorization. Refer to logs for more info.`),
        );
      }
    }
  };

  /**
   * pg-boss worker callback that processes a `CHECKMATE_MENU_SYNC` job.
   *
   * Fetches the current menu from the Checkmate API, normalizes it, and compares
   * it against the latest stored snapshot via SHA-256 hash. Based on the
   * comparison, one of three paths is taken — all database writes share a single
   * transaction:
   *
   * - **No snapshot** — first sync for this restaurant. The full menu hierarchy
   *   is created from scratch via `createMenusDetailsFromNormalized`.
   * - **Hash match** — menu is unchanged. Exits early with no writes.
   * - **Hash mismatch** — menu has changed. Runs the diff pipeline via
   *   `MenuSyncProcessor.process` to compute and execute the minimal set of
   *   change commands.
   *
   * On any write path, a new snapshot (normalized JSON + hash) is persisted
   * within the same transaction. If any operation fails the transaction rolls
   * back in full and no snapshot is written, ensuring the stored snapshot always
   * reflects the actual database state.
   *
   * Configured with `batchSize: 1` — `jobs[0]` is always the sole job processed
   * per invocation.
   *
   * @param jobs - Batch of jobs delivered by pg-boss. Only `jobs[0]` is processed.
   * @returns Resolves when the sync is complete or a no-op hash match is detected.
   * @throws {HttpException} 500 if the Checkmate API fetch, diff pipeline, or
   *   any command execution fails. The pg-boss job will be marked as failed and
   *   retried according to queue configuration.
   *
   * @see {@link Documentation/MENU_SYNC.md#3-job-processor--processcheckmatejob}
   */
  processCheckmateJob = async (jobs: Job<CheckmateJob>[]): Promise<void> => {
    const job = jobs[0];
    const { locationID, restaurantID } = job.data;

    // Fetch menu from Checkmate API (pass location_id which Checkmate knows)
    logger.info(`Processing menu sync job for restaurant { restaurantID ${restaurantID}, locationID: ${locationID} }`);
    logger.debug(`Processing menu sync job: ${JSON.stringify(job.data, undefined, 2)}`);

    const tokenStore: TokenStore = new TokenStore(this.platformIntegrationService, pool, locationID, 'checkmate');
    const checkmateClient = createCheckmateClient({ locationID, tokenStore });
    const checkmateMenuJson: CheckmateMenu[] = await this.checkmateService.fetchMenu(checkmateClient, locationID);

    // Normalize and generate hash of Checkmate menu
    const normalizedMenus: NormalizedMenu[] = normalizeCheckmateMenus(checkmateMenuJson);
    const stringifiedMenus: string = stringifyNormalizedMenus(normalizedMenus);
    const menuHash = generateHash(stringifiedMenus);

    // Get latest menu snapshot for comparison
    const latestSnapshot = await this.restaurantMenuSnapshotService.getLatestMenuSnapshot(restaurantID);

    const repository: EntityManager = await ormConnection();
    await repository.transaction(async (manager: EntityManager) => {
      // hash mismatch or no snapshot — process the diff or do full sync
      if (latestSnapshot == null) {
        // No snapshot exists - initial setup
        logger.debug(`No existing menu hash for restaurant ${restaurantID}. Initializing menus...`);
        await this.menuDetailsService.createMenusDetailsFromNormalized(normalizedMenus, restaurantID, locationID, manager);
      } else if (latestSnapshot.menuHash === menuHash) {
        // No changes detected
        logger.debug(`Menu hash matches for restaurant ${restaurantID}. No update needed.`);
        return;
      } else {
        // Hash differs - menu has changed
        logger.debug(`Menu hash differs for restaurant ${restaurantID}. Processing menu update...`);
        await this.processor.process(latestSnapshot.menuJson, normalizedMenus, restaurantID, locationID, manager);
      }

      await this.restaurantMenuSnapshotService.createMenuSnapshot(restaurantID, normalizedMenus, menuHash, 'checkmate', manager);
    });

    logger.info(`Menu sync complete for restaurant ${restaurantID}`);
  };

  mapCheckmateToRestaurant = (locationInfo: LocationInfo): CreateRestaurantRequestInterface => ({
    name: locationInfo.name,
    phone: locationInfo.phone_number,
    email: `${locationInfo.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '') // remove all whitespace
      .replace(/[^a-zA-Z0-9._%+-@]/g, '')}${uuidv4()}@taptabapp.com`,
    cuisineID: 1,
    website: locationInfo.url,
    address: {
      address1: locationInfo.address,
      city: locationInfo.city,
      governingDistrict: locationInfo.state,
      country: 'United States',
      postalCode: locationInfo.zipcode,
      timezone: locationInfo.time_zone,
    },
    restaurantHours: [{ day: [Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI], start: '10:00', end: '23:00' }],
  });
}

export default CheckmateIntegrationService;
