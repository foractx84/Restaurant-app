import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { ModifierPriceOverrideEntity } from '@entities/modifierPriceOverride.entity';
import { ModifierPriceOverrideModelInterface } from '@interfaces/modifierPriceOverride.interface';

class ModifierPriceOverrideModel implements ModifierPriceOverrideModelInterface {
  createModifierPriceOverride = async (
    override: ModifierPriceOverrideEntity,
    entityManager?: EntityManager,
  ): Promise<ModifierPriceOverrideEntity> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await entityManager.save(ModifierPriceOverrideEntity, override);
    } catch (err) {
      logger.error(`Error while creating modifier price override for modifier: ${override.modifierID}. - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while creating modifier price override for modifier: ${override.modifierID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  fetchModifierPriceOverridesByModifierID = async (modifierID: number, entityManager?: EntityManager): Promise<ModifierPriceOverrideEntity[]> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await entityManager.find(ModifierPriceOverrideEntity, { where: { modifierID } });
    } catch (err) {
      logger.error(`Error occurred while fetching price overrides for modifier: ${modifierID}. - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching price overrides for modifier: ${modifierID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  softDeleteModifierPriceOverridesByModifierID = async (modifierID: number, entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      await entityManager.update(ModifierPriceOverrideEntity, { modifierID }, { deletedAt: new Date() });
    } catch (err) {
      logger.error(`Error occurred while soft deleting price overrides for modifier: ${modifierID}. - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while soft deleting price overrides for modifier: ${modifierID}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default ModifierPriceOverrideModel;
