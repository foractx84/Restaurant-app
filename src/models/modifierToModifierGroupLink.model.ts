import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { ModifierToModifierGroupLinkEntity } from '@entities/modifierToModiferGroupLink.entity';
import { ModifierToModifierGroupLinkInterface, ModifierToModifierGroupLinkModelInterface } from '@interfaces/modifierToModifierGroupLink.interface';

class ModifierToModifierGroupLinkModel implements ModifierToModifierGroupLinkModelInterface {
  deleteModifiersLinkedByModifierGroupID = async (modifierGroupID: number, entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }

      await entityManager.delete(ModifierToModifierGroupLinkEntity, { modifierGroupID });
    } catch (err) {
      logger.error(`Error occurred while deleting modifiers linked to modifier group: ${modifierGroupID}. - ${err?.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          'Error occurred while deleting modifiers linked to modifier group: ${modifierGroupID}. Refer to logs for more info.',
        ),
      );
    }
  };

  insertModifierToModifierGroupLinks = async (
    modifierToModifierGroupLinks: ModifierToModifierGroupLinkInterface[],
    entityManager?: EntityManager,
  ): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      await entityManager.save(ModifierToModifierGroupLinkEntity, modifierToModifierGroupLinks);
    } catch (err) {
      logger.error(
        `Error while inserting modifier group link with modifier(s): '${modifierToModifierGroupLinks.map(
          link => link.modifierToModifierGroupLinkID,
        )}. - ${err?.stack || err}`,
      );
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while inserting modifier group link with modifier(s): '${modifierToModifierGroupLinks.map(
            link => link.modifierToModifierGroupLinkID,
          )}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default ModifierToModifierGroupLinkModel;
