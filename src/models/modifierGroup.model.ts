import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager, IsNull } from 'typeorm';
import { getCurrentDate } from '@utils/timeUtils';
import { ormConnection } from '@utils/dbUtils';
import { ModifierGroupModelInterface } from '@interfaces/modifierGroup.interface';
import { ModifierGroupEntity } from '@entities/modifierGroup.entity';

class ModifierGroupModel implements ModifierGroupModelInterface {
  createModifierGroup = async (modifierGroup: ModifierGroupEntity, entityManager?: EntityManager): Promise<ModifierGroupEntity> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await entityManager.save(ModifierGroupEntity, modifierGroup);
    } catch (err) {
      logger.error(`Error while inserting modifier group: '${modifierGroup?.name || modifierGroup?.label}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while inserting modifier group: '${modifierGroup?.name || modifierGroup?.label}. Refer to logs for more info.`,
        ),
      );
    }
  };

  fetchModifierGroupByID = async (modifierGroupID: number, entityManager?: EntityManager): Promise<ModifierGroupEntity> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }

      return await entityManager.findOne<ModifierGroupEntity>(ModifierGroupEntity, { where: { modifierGroupID, deletedAt: IsNull() } });
    } catch (err) {
      logger.error(`Error occurred while getting modifier group by id ${modifierGroupID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting modifier group by id ${modifierGroupID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  fetchModifierGroupByExternalID = async (externalID: string, entityManager?: EntityManager): Promise<ModifierGroupEntity> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }

      return await entityManager
        .getRepository<ModifierGroupEntity>(ModifierGroupEntity)
        .createQueryBuilder('modifierGroups')
        .leftJoinAndSelect('modifierGroups.modifierToModifierGroupLinks', 'mtmgl')
        .leftJoinAndSelect('mtmgl.modifier', 'modifier', 'modifier.deleted_at IS NULL')
        .where('modifierGroups.external_id = :externalID', { externalID })
        .andWhere('modifierGroups.deleted_at IS NULL')
        .getOne();
    } catch (err) {
      logger.error(`Error occurred while getting modifier group by external id ${externalID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting modifier group external id ${externalID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  fetchModifierGroupByNameAndRestaurantID = async (name: string, restaurantID: number): Promise<ModifierGroupEntity> => {
    try {
      const repository = await ormConnection();
      return await repository.findOne<ModifierGroupEntity>(ModifierGroupEntity, { where: { name, restaurantID, deletedAt: IsNull() } });
    } catch (err) {
      logger.error(`Error occurred while getting modifier group by name ${name} and restaurantID ${restaurantID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting modifier group by name ${name} and restaurantID ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  fetchModifierGroupsByRestaurantID = async (restaurantID: number): Promise<ModifierGroupEntity[]> => {
    try {
      const entityManager = await ormConnection();
      return await entityManager
        .getRepository<ModifierGroupEntity>(ModifierGroupEntity)
        .createQueryBuilder('modifierGroups')
        .leftJoinAndSelect('modifierGroups.modifierToModifierGroupLinks', 'mtmgl')
        .leftJoinAndSelect('mtmgl.modifier', 'modifier', 'modifier.deleted_at IS NULL')
        .leftJoinAndSelect('modifier.modifierMedia', 'mm')
        .leftJoinAndSelect('mm.media', 'media', 'media.deleted_at IS NULL')
        .where('modifierGroups.restaurant_id = :restaurant_id', { restaurant_id: restaurantID })
        .andWhere('modifierGroups.deleted_at IS NULL')
        .getMany();
    } catch (err) {
      logger.error(`Error occurred while fetching modifier groups by restaurantID ${restaurantID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching modifier groups by restaurantID ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  softDeleteModifierGroup = async (modifierGroupID: number, entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      await entityManager.update<ModifierGroupEntity>(ModifierGroupEntity, { modifierGroupID }, { deletedAt: getCurrentDate() });
    } catch (err) {
      logger.error(`Error while soft deleting modifier group: '${modifierGroupID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while soft deleting modifier group: '${modifierGroupID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  upsertModifierGroup = async (modifierGroup: ModifierGroupEntity, repository?: EntityManager): Promise<ModifierGroupEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.save(ModifierGroupEntity, modifierGroup);
    } catch (err) {
      logger.error(`Error while upserting modifier group: '${modifierGroup?.name || modifierGroup?.label}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while upserting modifier group: '${modifierGroup?.name || modifierGroup?.label}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default ModifierGroupModel;
