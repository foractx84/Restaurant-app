import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { CareersSettingsEntity } from '@entities/careersSettings.entity';
import { CareersSettingsDBInterface, CareersSettingsModelInterface } from '@interfaces/careersSettings.interface';

class CareersSettingsModel implements CareersSettingsModelInterface {
  fetchByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<CareersSettingsEntity | undefined> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository
        .createQueryBuilder(CareersSettingsEntity, 'careers_settings')
        .where('careers_settings.restaurant_id = :restaurantID', { restaurantID })
        .getOne();
    } catch (err) {
      logger.error(`Error while fetching careers settings for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while fetching careers settings for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  upsertByRestaurantID = async (
    restaurantID: number,
    patch: Partial<CareersSettingsDBInterface>,
    repository?: EntityManager,
  ): Promise<CareersSettingsEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const existing = await this.fetchByRestaurantID(restaurantID, repository);
      if (existing) {
        const merged = repository.create(CareersSettingsEntity, {
          ...existing,
          ...patch,
          restaurant_id: restaurantID,
        });
        return await repository.save(CareersSettingsEntity, merged);
      }
      const created = repository.create(CareersSettingsEntity, {
        section_title: '',
        careers_text: '',
        is_inquiry_form_enabled: false,
        ...patch,
        restaurant_id: restaurantID,
      });
      return await repository.save(CareersSettingsEntity, created);
    } catch (err) {
      logger.error(`Error while upserting careers settings for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while upserting careers settings for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default CareersSettingsModel;
