import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { PlatformIntegrationModelInterface, PlatformIntegrationServiceInterface } from '@interfaces/platformIntegration.interface';
import { PlatformIntegrationEntity } from '@entities/platformIntegration.entity';

class PlatformIntegrationService implements PlatformIntegrationServiceInterface {
  private platformIntegrationModel: PlatformIntegrationModelInterface;

  constructor(platformIntegrationModel: PlatformIntegrationModelInterface) {
    this.platformIntegrationModel = platformIntegrationModel;
  }

  createPlatformIntegration = async (
    restaurantID: number | null,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    platform: string,
    locationID: number | null,
    otterLocationID?: string | null,
  ): Promise<PlatformIntegrationEntity> => {
    try {
      const platformIntegration = new PlatformIntegrationEntity({
        restaurantID,
        accessToken,
        refreshToken,
        expiresIn,
        externalParty: platform,
        locationID,
        otterLocationID,
      });

      return await this.platformIntegrationModel.upsertPlatformIntegration(platformIntegration);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating platform integration. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while creating platform integration. Refer to logs for more info.`),
        );
      }
    }
  };

  updatePlatformIntegration = async (
    integration: PlatformIntegrationEntity,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    platformID?: number,
  ): Promise<PlatformIntegrationEntity> => {
    try {
      // Update the integration entity with new tokens
      integration.accessToken = accessToken;
      integration.refreshToken = refreshToken;
      integration.expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Update platformID if provided
      if (platformID !== undefined) {
        integration.platformID = platformID;
      }

      // Use upsert which will update if platformID exists
      return await this.platformIntegrationModel.upsertPlatformIntegration(integration);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while updating platform integration. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while updating platform integration. Refer to logs for more info.`),
        );
      }
    }
  };

  getPlatformIntegrationByLocationIDAndPlatform = async (locationID: number, platform: string): Promise<PlatformIntegrationEntity | null> => {
    try {
      // Use direct database lookup by location_id
      return await this.platformIntegrationModel.getPlatformIntegrationByLocationIDAndPlatform(locationID, platform);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting platform integration by location ID. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting platform integration by location ID. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getPlatformIntegrationByStoreIDAndPlatform = async (storeID: string, platform: string): Promise<PlatformIntegrationEntity | null> => {
    try {
      return await this.platformIntegrationModel.getPlatformIntegrationByStoreIDAndPlatform(storeID, platform);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting platform integration by store ID. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting platform integration by store ID. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getPlatformIntegrationByRestaurantIDAndPlatform = async (restaurantID: number, platform: string): Promise<PlatformIntegrationEntity | null> => {
    try {
      return await this.platformIntegrationModel.getPlatformIntegrationByRestaurantIDAndPlatform(restaurantID, platform);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting platform integration by restaurant ID. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting platform integration by restaurant ID. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getAllConnectedPlatformIntegrations = async (platform: string): Promise<PlatformIntegrationEntity[]> => {
    try {
      return await this.platformIntegrationModel.getAllConnectedPlatformIntegrations(platform);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting all connected platform integrations. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting all connected platform integrations. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default PlatformIntegrationService;
