import { fetchOtterToken } from '@/api/otter.api';
import TokenStore from '@/api/token-store.api';
import { pool } from '@databases';
import { PlatformIntegrationEntity } from '@entities/platformIntegration.entity';
import { OtterAuthServiceInterface } from '@interfaces/otter.interface';
import { PlatformIntegrationServiceInterface } from '@interfaces/platformIntegration.interface';
import { logger } from '@utils/logger';

const OTTER_PLATFORM = 'otter';
const APP_LEVEL_LOCATION_ID = 0;
/** App-level Otter OAuth rows are not tied to a restaurant; FK requires null (not 0). */
const APP_LEVEL_RESTAURANT_ID: number | null = null;
const EMPTY_REFRESH_TOKEN = '';

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

class OtterAuthService implements OtterAuthServiceInterface {
  private readonly tokenStore: TokenStore;
  private readonly locationID: number;
  private readonly restaurantID: number | null;

  constructor(
    private readonly platformIntegrationService: PlatformIntegrationServiceInterface,
    locationID: number = APP_LEVEL_LOCATION_ID,
    restaurantID: number | null = APP_LEVEL_RESTAURANT_ID,
  ) {
    this.locationID = locationID;
    this.restaurantID = restaurantID;
    this.tokenStore = new TokenStore(platformIntegrationService, pool, locationID, OTTER_PLATFORM);
  }

  acquireAndStoreToken = async (): Promise<string> => {
    const lock = await this.tokenStore.acquireAdvisoryLock();

    try {
      if (!lock.acquired) {
        logger.debug(`No existing advisory lock for Otter app-level token at location ${this.locationID}.`);
        await sleep(2000);
        this.tokenStore.bustCache();
        const freshToken = await this.tokenStore.getAccessToken();
        if (!freshToken) {
          throw new Error(`Otter token unavailable after waiting for lock at location ${this.locationID}.`);
        }
        return freshToken;
      }

      this.tokenStore.bustCache();
      if (!(await this.tokenStore.isExpiredOrStale())) {
        logger.debug(`Otter token has already been updated, returning cached access token.`);
        return (await this.tokenStore.getAccessToken())!;
      }

      const data = await fetchOtterToken();
      const existing: PlatformIntegrationEntity | null = await this.tokenStore.getPlatformIntegration();

      if (existing?.accessToken) {
        await this.tokenStore.set({
          integration: existing,
          accessToken: data.access_token,
          refreshToken: EMPTY_REFRESH_TOKEN,
          expiresIn: data.expires_in,
        });
      } else {
        await this.platformIntegrationService.createPlatformIntegration(
          this.restaurantID,
          data.access_token,
          EMPTY_REFRESH_TOKEN,
          data.expires_in,
          OTTER_PLATFORM,
          this.locationID,
        );
        this.tokenStore.bustCache();
      }

      logger.debug(`Successfully acquired and persisted Otter access token.`);
      return data.access_token;
    } finally {
      await lock.release();
    }
  };

  getValidAccessToken = async (): Promise<string> => {
    if (!(await this.tokenStore.isExpiredOrStale())) {
      const token = await this.tokenStore.getAccessToken();
      if (token) {
        return token;
      }
    }

    return this.acquireAndStoreToken();
  };
}

export default OtterAuthService;
