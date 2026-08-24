import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { ModifierGroupToModifierLinkEntity } from '@entities/modifierGroupToModifierLink.entity';
import { ModifierGroupToModifierLinkInterface, ModifierGroupToModifierLinkModelInterface } from '@interfaces/modifierGroupToModifierLink.interface';

class ModifierGroupToModifierLinkModel implements ModifierGroupToModifierLinkModelInterface {
  insertModifierGroupToModifierLinks = async (links: ModifierGroupToModifierLinkInterface[], entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      await entityManager.save(ModifierGroupToModifierLinkEntity, links);
    } catch (err) {
      logger.error(`Error while inserting modifier group to modifier link(s). - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, 'Error while inserting modifier group to modifier link(s). Refer to logs for more info.'),
      );
    }
  };

  deleteModifierGroupsLinkedByModifierID = async (modifierID: number, entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      await entityManager.delete(ModifierGroupToModifierLinkEntity, { modifierID });
    } catch (err) {
      logger.error(`Error occurred while deleting modifier groups linked to modifier: ${modifierID}. - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while deleting modifier groups linked to modifier: ${modifierID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  fetchModifierGroupLinksByModifierID = async (
    modifierID: number,
    entityManager?: EntityManager,
  ): Promise<ModifierGroupToModifierLinkInterface[]> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      return await entityManager.find(ModifierGroupToModifierLinkEntity, { where: { modifierID } });
    } catch (err) {
      logger.error(`Error occurred while fetching modifier groups linked to modifier: ${modifierID}. - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching modifier groups linked to modifier: ${modifierID}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default ModifierGroupToModifierLinkModel;
