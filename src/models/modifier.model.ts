import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { EntityManager, IsNull } from 'typeorm';
import { ModifierModelInterface } from '@interfaces/modifier.interface';
import { ModifierEntity } from '@entities/modifier.entity';
import { getCurrentDate } from '@/utils/timeUtils';

class ModifierModel implements ModifierModelInterface {
  fetchModifierByID = async (modifierID: number, entityManager?: EntityManager): Promise<ModifierEntity> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await entityManager.findOne<ModifierEntity>(ModifierEntity, { where: { modifierID, deletedAt: IsNull() } });
    } catch (err) {
      logger.error(`Error occurred while fetching modifier by id: ${modifierID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while fetching modifier by id: ${modifierID}. Refer to logs for more info.`),
      );
    }
  };

  fetchModifierByExternalID = async (externalID: string, entityManager?: EntityManager): Promise<ModifierEntity> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await entityManager.findOne<ModifierEntity>(ModifierEntity, { where: { externalID: externalID, deletedAt: IsNull() } });
    } catch (err) {
      logger.error(`Error occurred while fetching modifier by external id: ${externalID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching modifier by external id: ${externalID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  findModifiersByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<ModifierEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository
        .getRepository<ModifierEntity>(ModifierEntity)
        .createQueryBuilder('modifier')
        .leftJoinAndSelect('modifier.modifierMedia', 'modifierMedia')
        .leftJoinAndSelect('modifierMedia.media', 'media')
        .where('modifier.restaurantID = :restaurantID', { restaurantID })
        .andWhere('modifier.deletedAt IS NULL')
        .orderBy('LOWER(modifier.name)', 'ASC') // First order by name
        .addOrderBy('modifier.price', 'ASC') // Then order by price
        .getMany();
    } catch (err) {
      logger.error(`Error with finding modifiers by restaurantID: '${restaurantID}.  - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error with finding modifiers by restaurantID: '${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  softDeleteModifier = async (modifierID: number, entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      await entityManager.update<ModifierEntity>(ModifierEntity, { modifierID }, { deletedAt: getCurrentDate() });
    } catch (err) {
      logger.error(`Error while soft deleting modifier: '${modifierID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error while soft deleting modifier: '${modifierID}. Refer to logs for more info.`),
      );
    }
  };

  upsertModifier = async (modifier: ModifierEntity, entityManager?: EntityManager): Promise<ModifierEntity> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await entityManager.save(ModifierEntity, modifier);
    } catch (err) {
      logger.error(`Error occurred while upserting modifier: ${JSON.stringify(modifier)} - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while upserting modifier: ${modifier.name}. Refer to logs for more info.`),
      );
    }
  };
}

export default ModifierModel;
