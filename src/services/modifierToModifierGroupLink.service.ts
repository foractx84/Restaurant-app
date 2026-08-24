import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { ormConnection } from '@/utils/dbUtils';
import { EntityManager } from 'typeorm';
import {
  ModifierToModifierGroupLinkInterface,
  ModifierToModifierGroupLinkModelInterface,
  ModifierToModifierGroupLinkServiceInterface,
} from '@/interfaces/modifierToModifierGroupLink.interface';

class ModifierToModifierGroupLinkService implements ModifierToModifierGroupLinkServiceInterface {
  private modifierToModifierGroupLinkModel: ModifierToModifierGroupLinkModelInterface;

  constructor(modifierToModifierGroupLinkModel: ModifierToModifierGroupLinkModelInterface) {
    this.modifierToModifierGroupLinkModel = modifierToModifierGroupLinkModel;
  }

  deleteModifiersLinkedByModifierGroupID = async (modifierGroupID: number, entityManager?: EntityManager): Promise<void> => {
    try {
      if (!entityManager) {
        entityManager = await ormConnection();
      }
      await this.modifierToModifierGroupLinkModel.deleteModifiersLinkedByModifierGroupID(modifierGroupID, entityManager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while deleting modifiers linked to modifier group: ${modifierGroupID}. - ${err?.stack || err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while deleting modifiers linked to modifier group: ${modifierGroupID}. Refer to logs for more info.`,
          ),
        );
      }
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
      await this.modifierToModifierGroupLinkModel.insertModifierToModifierGroupLinks(modifierToModifierGroupLinks, entityManager);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while linking modifier group to modifier(s): ${JSON.stringify(modifierToModifierGroupLinks)}: - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking modifier group to modifier(s): ${JSON.stringify(
              modifierToModifierGroupLinks,
            )}. Refer to the logs for more detail`,
          ),
        );
      }
    }
  };
}

export default ModifierToModifierGroupLinkService;
