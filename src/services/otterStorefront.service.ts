import { AxiosInstance } from 'axios';
import { createOtterClient, notifyOtterPauseResult, notifyOtterStoreAvailability, notifyOtterStoreHours, notifyOtterUnpauseResult } from '@/api/otter.api';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { OtterAuthServiceInterface } from '@interfaces/otter.interface';
import { OtterWebhookEvent } from '@interfaces/otterIntegration.interface';
import { OtterStorefrontServiceInterface, OtterStorefrontStatus } from '@interfaces/otterStorefrontService.interface';
import { OtterEventResultMetadata } from '@interfaces/otterStorefront.interface';
import { PlatformIntegrationServiceInterface } from '@interfaces/platformIntegration.interface';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import { RestaurantHoursServiceInterface } from '@interfaces/restaurantHours.interface';
import { RestaurantAddressServiceInterface } from '@interfaces/restaurantAddress.interface';
import { OTTER_OPERATION_STATUS, OTTER_STORE_STATE, OTTER_STOREFRONT_EVENT } from '@constants/otterStorefront.constants';
import { buildOtterStoreHoursRequest } from '@utils/otterStoreHours.mapper';
import { logger } from '@utils/logger';

const OTTER_PLATFORM = 'otter';

/** Guards the `otter_location_id` lookup — it is a Postgres `uuid` column and rejects non-UUID input. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Otter caps `additionalInformation`; keep error text short rather than risking a 422 on the ack itself. */
const MAX_ADDITIONAL_INFORMATION_LENGTH = 255;

/**
 * Otter Storefront: the pause/unpause and hours/availability surface required for integration
 * certification.
 *
 * Four certification rows map onto this service:
 * - *Pause / Unpause in Partner* — {@link setAvailabilityFromPartner}, driven by the TapManager UI.
 * - *Pause / Unpause in Otter* — Otter's webhooks, answered by the `/v1/storefront/pause|unpause` callbacks.
 *
 * Otter API Support additionally requires the get-availability and get-hours webhooks to be
 * answered, "otherwise the Storefront functionalities will not work" — those are handled here too.
 *
 * Availability is stored as `restaurants.is_accepting_orders`. It is an Otter-facing flag only: it
 * does NOT gate TapTab's own ordering flow.
 */
class OtterStorefrontService implements OtterStorefrontServiceInterface {
  constructor(
    private readonly platformIntegrationService: PlatformIntegrationServiceInterface,
    private readonly restaurantsService: RestaurantsServiceInterface,
    private readonly restaurantHoursService: RestaurantHoursServiceInterface,
    private readonly restaurantAddressService: RestaurantAddressServiceInterface,
    private readonly otterAuthService: OtterAuthServiceInterface,
  ) {}

  getStorefrontStatus = async (restaurantID: number): Promise<OtterStorefrontStatus> => {
    const otterStoreId = await this.resolveOtterStoreId(restaurantID);
    const isAcceptingOrders = await this.restaurantsService.findRestaurantAcceptingOrders(restaurantID);
    return { restaurantID, isAcceptingOrders, otterStoreId };
  };

  /**
   * Local state is written first, then Otter is notified. If the notify fails the error propagates
   * to the caller with TapTab already in the requested state — a retry re-sends the same value, and
   * the hourly reconciliation path keeps Otter converging. The inverse order would risk telling
   * Otter we paused when our own write then failed.
   */
  setAvailabilityFromPartner = async (restaurantID: number, isAcceptingOrders: boolean): Promise<OtterStorefrontStatus> => {
    const otterStoreId = await this.resolveOtterStoreId(restaurantID);
    await this.restaurantsService.setRestaurantAcceptingOrders(restaurantID, isAcceptingOrders);

    // No X-Event-Id: this change originates with us, not with an Otter event. Sending an id Otter
    // never issued makes it validate the call as an event result and reject the whole request.
    await notifyOtterStoreAvailability(this.buildClient(restaurantID), undefined, {
      storeState: isAcceptingOrders ? OTTER_STORE_STATE.OPEN : OTTER_STORE_STATE.OPERATOR_PAUSED,
      statusChangedAt: new Date().toISOString(),
    });

    logger.info(`Otter storefront ${isAcceptingOrders ? 'unpaused' : 'paused'} from partner for restaurant ${restaurantID} (store ${otterStoreId}).`);
    return { restaurantID, isAcceptingOrders, otterStoreId };
  };

  handleStorefrontEvent = async (event: OtterWebhookEvent): Promise<void> => {
    switch (event.eventType) {
      case OTTER_STOREFRONT_EVENT.PAUSE_STORE:
        await this.handlePauseRequest(event, false);
        return;
      case OTTER_STOREFRONT_EVENT.UNPAUSE_STORE:
        await this.handlePauseRequest(event, true);
        return;
      case OTTER_STOREFRONT_EVENT.GET_AVAILABILITY:
        await this.handleGetAvailability(event);
        return;
      case OTTER_STOREFRONT_EVENT.GET_HOURS:
        await this.handleGetHours(event);
        return;
      default:
        logger.warn(`Received unhandled Otter storefront eventType=${event.eventType} eventId=${event.eventId}; acknowledged only.`);
    }
  };

  /**
   * Otter-initiated pause/unpause. Applies the change locally, then reports the outcome on the
   * matching callback. A local failure still sends `FAILED` rather than leaving Otter waiting on a
   * result that never arrives — Otter's own state depends on hearing back either way.
   */
  private handlePauseRequest = async (event: OtterWebhookEvent, isAcceptingOrders: boolean): Promise<void> => {
    const { restaurantID, otterStoreId } = await this.resolveFromWebhook(event);
    const client = this.buildClient(restaurantID);
    const notify = isAcceptingOrders ? notifyOtterUnpauseResult : notifyOtterPauseResult;
    const action = isAcceptingOrders ? 'unpause' : 'pause';

    try {
      await this.restaurantsService.setRestaurantAcceptingOrders(restaurantID, isAcceptingOrders);
      await notify(client, event.eventId, {
        eventResultMetadata: this.buildResultMetadata(OTTER_OPERATION_STATUS.SUCCEEDED, `Store ${action}d in TapTab.`),
      });
      logger.info(`Otter storefront ${action} applied for restaurant ${restaurantID} (store ${otterStoreId}), event ${event.eventId}.`);
    } catch (err) {
      logger.error(`Otter storefront ${action} failed for restaurant ${restaurantID} (store ${otterStoreId}) - ${err}`);
      await notify(client, event.eventId, {
        eventResultMetadata: this.buildResultMetadata(OTTER_OPERATION_STATUS.FAILED, (err as Error).message),
      });
      throw err;
    }
  };

  /** Answers "is this store currently open?" on the same endpoint used to report partner-initiated changes. */
  private handleGetAvailability = async (event: OtterWebhookEvent): Promise<void> => {
    const { restaurantID, otterStoreId } = await this.resolveFromWebhook(event);
    const isAcceptingOrders = await this.restaurantsService.findRestaurantAcceptingOrders(restaurantID);

    await notifyOtterStoreAvailability(this.buildClient(restaurantID), event.eventId, {
      storeState: isAcceptingOrders ? OTTER_STORE_STATE.OPEN : OTTER_STORE_STATE.OPERATOR_PAUSED,
      statusChangedAt: new Date().toISOString(),
      eventResultMetadata: this.buildResultMetadata(OTTER_OPERATION_STATUS.SUCCEEDED, 'Current store availability reported.'),
    });

    logger.info(
      `Reported Otter storefront availability for restaurant ${restaurantID} (store ${otterStoreId}): ${
        isAcceptingOrders ? OTTER_STORE_STATE.OPEN : OTTER_STORE_STATE.OPERATOR_PAUSED
      }.`,
    );
  };

  /**
   * Answers "what are this store's hours?" from `restaurant_hours`. The timezone Otter requires lives
   * on the restaurant ADDRESS, not the hours rows, so it is fetched alongside them; a missing address
   * is not fatal — the mapper falls back to a default zone rather than failing the whole response.
   */
  private handleGetHours = async (event: OtterWebhookEvent): Promise<void> => {
    const { restaurantID, otterStoreId } = await this.resolveFromWebhook(event);
    const [hours, address] = await Promise.all([
      this.restaurantHoursService.findRestaurantHoursByRestaurantID(restaurantID),
      this.findRestaurantTimezone(restaurantID),
    ]);

    const request = buildOtterStoreHoursRequest(hours, address);
    request.eventResultMetadata = this.buildResultMetadata(OTTER_OPERATION_STATUS.SUCCEEDED, 'Current store hours reported.');

    if (!request.storeHoursConfiguration.deliveryHours?.regularHours.length) {
      logger.warn(`Restaurant ${restaurantID} has no usable hours; reporting an empty schedule to Otter (store ${otterStoreId}).`);
    }

    await notifyOtterStoreHours(this.buildClient(restaurantID), event.eventId, request);
    logger.info(`Reported Otter storefront hours for restaurant ${restaurantID} (store ${otterStoreId}).`);
  };

  private findRestaurantTimezone = async (restaurantID: number): Promise<string | null> => {
    try {
      const address = await this.restaurantAddressService.getRestaurantAddressByRestaurantID(restaurantID);
      return address?.timezone ?? null;
    } catch (err) {
      logger.warn(`Could not read timezone for restaurant ${restaurantID}; falling back to the default zone. - ${err}`);
      return null;
    }
  };

  private buildClient = (restaurantID: number): AxiosInstance =>
    createOtterClient({ authService: this.otterAuthService, storeId: String(restaurantID) });

  private buildResultMetadata = (operationStatus: OtterEventResultMetadata['operationStatus'], additionalInformation: string): OtterEventResultMetadata => ({
    operationStatus,
    additionalInformation: additionalInformation.slice(0, MAX_ADDITIONAL_INFORMATION_LENGTH),
    operationFinishedAt: new Date().toISOString(),
  });

  private resolveOtterStoreId = async (restaurantID: number): Promise<string> => {
    const integration = await this.platformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform(restaurantID, OTTER_PLATFORM);
    if (!integration?.otterLocationID) {
      throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant ${restaurantID} has no connected Otter store.`));
    }
    return integration.otterLocationID;
  };

  /**
   * Maps an inbound webhook's `metadata.storeId` back to our restaurant, accepting either identifier
   * Otter might send.
   *
   * The docs are ambiguous about which one it is: the example payload shows
   * `"storeId": "partner-store-unique-identifier"` — i.e. the id WE registered at connect time,
   * which is `String(restaurantID)` (see `OtterIntegrationService.connectSelectedStore`) — while the
   * menu-sync path assumes Otter's own store UUID. Rather than bet on one, try the UUID lookup and
   * fall back to reading it as our restaurant id.
   *
   * The UUID shape check is load-bearing, not cosmetic: `otter_location_id` is a Postgres `uuid`
   * column, so querying it with a non-UUID string raises `22P02 invalid input syntax` — the query
   * throws rather than returning no rows.
   */
  private resolveFromWebhook = async (event: OtterWebhookEvent): Promise<{ restaurantID: number; otterStoreId: string }> => {
    const storeId = event.metadata?.storeId;
    if (!storeId) {
      throw new HttpException(
        400,
        getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Otter storefront webhook ${event.eventId} carried no storeId.`),
      );
    }

    if (UUID_PATTERN.test(storeId)) {
      const integration = await this.platformIntegrationService.getPlatformIntegrationByStoreIDAndPlatform(storeId, OTTER_PLATFORM);
      if (integration?.restaurantID) {
        return { restaurantID: integration.restaurantID, otterStoreId: storeId };
      }
    }

    const restaurantID = Number(storeId);
    if (Number.isInteger(restaurantID) && restaurantID > 0) {
      const integration = await this.platformIntegrationService.getPlatformIntegrationByRestaurantIDAndPlatform(restaurantID, OTTER_PLATFORM);
      if (integration?.otterLocationID) {
        return { restaurantID, otterStoreId: integration.otterLocationID };
      }
    }

    throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Otter store ${storeId} is not connected to a restaurant.`));
  };
}

export default OtterStorefrontService;
