import {
  CreateModifierRequestInterface,
  ModifierResponse,
  EditModifierRequestInterface,
  ModifierModelInterface,
  ModifierServiceInterface,
} from '@interfaces/modifier.interface';
import { ModifierEntity } from '@/entities/modifier.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';

class ModifierService implements ModifierServiceInterface {
  private modifierModel: ModifierModelInterface;

  constructor(modifierModel: ModifierModelInterface) {
    this.modifierModel = modifierModel;
  }

  createModifier = async (
    modifierRequest: CreateModifierRequestInterface,
    restaurantID: number,
    manager?: EntityManager,
  ): Promise<ModifierResponse> => {
    try {
      const modifier: ModifierEntity = await this.modifierModel.upsertModifier(
        ModifierEntity.createEntityFromRequest(modifierRequest, restaurantID),
        manager,
      );
      return modifier?.toResponse();
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating modifier: ${modifierRequest.name}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating modifier: ${modifierRequest.name}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  editModifier = async (editModifierRequest: EditModifierRequestInterface, modifier: ModifierEntity, manager?: EntityManager): Promise<void> => {
    try {
      modifier.updateModifier(editModifierRequest);
      await this.modifierModel.upsertModifier(modifier, manager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while editing modifier: ${modifier.modifierID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while editing modifier: ${modifier.modifierID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getModifiers = async (restaurantID: number): Promise<ModifierResponse[]> => {
    try {
      const modifiers: ModifierEntity[] = await this.modifierModel.findModifiersByRestaurantID(restaurantID);
      return modifiers?.map(modifier => modifier.toResponse()) ?? [];
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while fetching modifiers by restaurant id: ${restaurantID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while fetching modifiers by restaurant id: ${restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getModifierByExternalID = async (externalID: string, manager?: EntityManager): Promise<ModifierEntity> => {
    try {
      return await this.modifierModel.fetchModifierByExternalID(externalID, manager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while fetching modifier by external id: ${externalID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while fetching modifier by external id: ${externalID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  softDeleteModifier = async (modifier: ModifierEntity, manager?: EntityManager): Promise<void> => {
    try {
      await this.modifierModel.softDeleteModifier(modifier?.modifierID, manager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while soft deleting modifier: ${modifier.modifierID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while soft deleting modifier: ${modifier.modifierID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  softDeleteModifierByExternalID = async (externalID: string, manager?: EntityManager): Promise<void> => {
    let modifierID: number;
    try {
      // get modifier by external id.
      const modifier: ModifierEntity = await this.getModifierByExternalID(externalID, manager);

      // if modifier does not exist then throw error
      if (!modifier) {
        throw new Error(`Modifier { externalID: ${externalID} } does not exist. Will need to look into this issue if prevalent.`);
      }

      modifierID = modifier?.modifierID;

      // soft delete modifier
      await this.softDeleteModifier(modifier, manager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while soft deleting modifier: { modifierID: ${modifierID}, externalID: ${externalID} } - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while soft deleting modifier: { modifierID: ${modifierID}, externalID: ${externalID} }. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default ModifierService;
