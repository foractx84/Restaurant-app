import { EntityManager, IsNull, Not } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { PlatformIntegrationModelInterface } from '@interfaces/platformIntegration.interface';
import { PlatformIntegrationEntity } from '@entities/platformIntegration.entity';

class PlatformIntegrationModel implements PlatformIntegrationModelInterface {
  upsertPlatformIntegration = async (
    platformIntegration: PlatformIntegrationEntity,
    repository?: EntityManager,
  ): Promise<PlatformIntegrationEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.save(PlatformIntegrationEntity, platformIntegration);
    } catch (err) {
      logger.error(`Error while upserting platform integration. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error while upserting platform integration. Refer to logs for more info.`),
      );
    }
  };

  getPlatformIntegrationByLocationIDAndPlatform = async (
    locationID: number,
    externalParty: string,
    repository?: EntityManager,
  ): Promise<PlatformIntegrationEntity | null> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const integration = await repository.findOne<PlatformIntegrationEntity>(PlatformIntegrationEntity, {
        where: { locationID, externalParty, deletedAt: IsNull() },
      });
      return integration || null;
    } catch (err) {
      logger.error(`Error while getting platform integration by location ID ${locationID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error while getting platform integration by location ID. Refer to logs for more info.`),
      );
    }
  };

  getPlatformIntegrationByStoreIDAndPlatform = async (
    storeID: string,
    externalParty: string,
    repository?: EntityManager,
  ): Promise<PlatformIntegrationEntity | null> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      // Otter per-store integrations persist the Otter internalStoreId (a UUID) in `otter_location_id`.
      const integration = await repository.findOne<PlatformIntegrationEntity>(PlatformIntegrationEntity, {
        where: { otterLocationID: storeID, externalParty, deletedAt: IsNull() },
      });
      return integration || null;
    } catch (err) {
      logger.error(`Error while getting platform integration by store ID ${storeID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error while getting platform integration by store ID. Refer to logs for more info.`),
      );
    }
  };

  getPlatformIntegrationByRestaurantIDAndPlatform = async (
    restaurantID: number,
    externalParty: string,
    repository?: EntityManager,
  ): Promise<PlatformIntegrationEntity | null> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const integration = await repository.findOne<PlatformIntegrationEntity>(PlatformIntegrationEntity, {
        where: { restaurantID, externalParty, deletedAt: IsNull() },
      });
      return integration || null;
    } catch (err) {
      logger.error(`Error while getting platform integration by restaurant ID ${restaurantID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error while getting platform integration by restaurant ID. Refer to logs for more info.`),
      );
    }
  };

  getAllConnectedPlatformIntegrations = async (externalParty: string, repository?: EntityManager): Promise<PlatformIntegrationEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      // `restaurantID: Not(IsNull())` excludes app-level rows (e.g. Otter's client-credentials token,
      // which is not tied to a restaurant) — only rows representing an actual connected store.
      return await repository.find<PlatformIntegrationEntity>(PlatformIntegrationEntity, {
        where: { externalParty, restaurantID: Not(IsNull()), deletedAt: IsNull() },
      });
    } catch (err) {
      logger.error(`Error while getting all connected platform integrations for ${externalParty}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error while getting all connected platform integrations. Refer to logs for more info.`),
      );
    }
  };
}

export default PlatformIntegrationModel;
