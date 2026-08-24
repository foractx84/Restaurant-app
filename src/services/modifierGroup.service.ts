import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { ormConnection } from '@/utils/dbUtils';
import { EntityManager } from 'typeorm';
import {
  CreateModifierGroupRequestInterface,
  CreateModifierGroupResponseInterface,
  EditModifierGroupRequestInterface,
  GetModifierGroupResponseInterface,
  LinkModifiersToModifierGroupRequestInterface,
  ModifierGroupModelInterface,
  ModifierGroupServiceInterface,
} from '@/interfaces/modifierGroup.interface';
import { ModifierGroupEntity } from '@/entities/modifierGroup.entity';
import {
  ModifierToModifierGroupLinkInterface,
  ModifierToModifierGroupLinkServiceInterface,
} from '@/interfaces/modifierToModifierGroupLink.interface';

class ModifierGroupService implements ModifierGroupServiceInterface {
  private modifierGroupsModel: ModifierGroupModelInterface;
  private modifierToModifierGroupLinkService: ModifierToModifierGroupLinkServiceInterface;

  constructor(modifierGroupsModel: ModifierGroupModelInterface, modifierToModifierGroupLinkService: ModifierToModifierGroupLinkServiceInterface) {
    this.modifierGroupsModel = modifierGroupsModel;
    this.modifierToModifierGroupLinkService = modifierToModifierGroupLinkService;
  }

  createModifierGroup = async (
    modifierGroupRequest: CreateModifierGroupRequestInterface,
    restaurantID: number,
    platformIntegrationOverride = false,
    manager?: EntityManager,
  ): Promise<CreateModifierGroupResponseInterface> => {
    try {
      // 409 check for modifier group with same name and of same restaurant
      if (modifierGroupRequest.name && !platformIntegrationOverride) {
        await this.validateUniqueGroupName(modifierGroupRequest.name, restaurantID);
      }

      let modifierGroup: ModifierGroupEntity;

      const execution = async (conn: EntityManager) => {
        modifierGroup = await this.modifierGroupsModel.createModifierGroup(
          ModifierGroupEntity.createEntityFromRequest(modifierGroupRequest, restaurantID),
          conn,
        );

        // add modifiers to linking table
        // by default, array should never be empty due to dto validation, but still keeping this check in for error handling
        if (modifierGroup && modifierGroupRequest?.modifierIDs?.length) {
          await this.linkAndClearModifiers(modifierGroupRequest?.modifierIDs, modifierGroup?.modifierGroupID, false, conn);
        }
      };

      if (!!manager) {
        await execution(manager);
      } else {
        const ormConn: EntityManager = await ormConnection();
        await ormConn.transaction(async conn => {
          await execution(conn);
        });
      }

      return { ...modifierGroup?.toResponse() };
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while creating modifier group for restaurantID ${restaurantID}: - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating modifier group for restaurantID ${restaurantID}. Refer to the logs for more detail`,
          ),
        );
      }
    }
  };

  editModifierGroup = async (
    editRequest: EditModifierGroupRequestInterface,
    modifierGroup: ModifierGroupEntity,
    platformIntegrationOverride = false,
    manager?: EntityManager,
  ): Promise<void> => {
    try {
      if (editRequest.name && !platformIntegrationOverride) {
        await this.validateUniqueGroupName(editRequest.name, modifierGroup.restaurantID, modifierGroup.modifierGroupID);
      }

      modifierGroup.updateModifierGroup(editRequest);
      await this.modifierGroupsModel.upsertModifierGroup(modifierGroup, manager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while editing modifier group: ${modifierGroup.modifierGroupID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while editing modifier group: ${modifierGroup.modifierGroupID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  fetchModifierGroupByNameAndRestaurantID = async (name: string, restaurantID: number): Promise<ModifierGroupEntity> => {
    try {
      return await this.modifierGroupsModel.fetchModifierGroupByNameAndRestaurantID(name, restaurantID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting modifier group by name ${name} and restaurantID ${restaurantID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting modifier group by name ${name} and restaurantID ${restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getModifierGroupByExternalID = async (externalID: string, manager?: EntityManager): Promise<ModifierGroupEntity> => {
    try {
      return await this.modifierGroupsModel.fetchModifierGroupByExternalID(externalID, manager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting modifier group by externalID ${externalID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting modifier group by externalID ${externalID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getModifierGroups = async (restaurantID: number): Promise<GetModifierGroupResponseInterface[]> => {
    try {
      const modifierGroups: ModifierGroupEntity[] = await this.modifierGroupsModel.fetchModifierGroupsByRestaurantID(restaurantID);
      return modifierGroups?.map(group => ({
        ...group.toResponse(),
        modifiers: group?.modifierToModifierGroupLinks?.map(link => link?.modifier?.toResponse()) || [],
      }));
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting modifier groups by restaurantID: ${restaurantID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting modifier groups by restaurantID: ${restaurantID}. Refer to the logs for more detail`,
          ),
        );
      }
    }
  };

  linkModifiersToModifierGroup = async (linkRequest: LinkModifiersToModifierGroupRequestInterface, manager?: EntityManager): Promise<void> => {
    try {
      if (manager) {
        await this.linkAndClearModifiers(linkRequest?.modifierIDs, linkRequest?.modifierGroupID, true, manager);
      } else {
        const ormConn: EntityManager = await ormConnection();
        await ormConn.transaction(async entityManager => {
          await this.linkAndClearModifiers(linkRequest?.modifierIDs, linkRequest?.modifierGroupID, true, entityManager);
        });
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while linking modifiers to modifier group: ${linkRequest?.modifierGroupID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while linking modifiers to modifier group: ${linkRequest?.modifierGroupID}. Refer to the logs for more detail`,
          ),
        );
      }
    }
  };

  softDeleteModifierGroup = async (modifierGroup: ModifierGroupEntity, manager?: EntityManager): Promise<void> => {
    try {
      await this.modifierGroupsModel.softDeleteModifierGroup(modifierGroup?.modifierGroupID, manager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while soft deleting modifier group: ${modifierGroup.modifierGroupID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while soft deleting modifier group: ${modifierGroup.modifierGroupID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  linkAndClearModifiers = async (
    modifierIDs: number[],
    modifierGroupID: number,
    removeExistingModifiers: boolean,
    entityManager?: EntityManager,
  ): Promise<void> => {
    if (!entityManager) {
      entityManager = await ormConnection();
    }

    // add modifiers to linking table
    const modifierToModifierGroupLinkEntities: ModifierToModifierGroupLinkInterface[] = modifierIDs.map(modifierID => ({
      modifierGroupID: modifierGroupID,
      modifierID: modifierID,
    }));

    if (removeExistingModifiers) {
      // remove existing modifiers linked to modifier group
      await this.modifierToModifierGroupLinkService.deleteModifiersLinkedByModifierGroupID(modifierGroupID, entityManager);
    }

    // insert linked modifiers
    if (modifierIDs?.length > 0) {
      await this.modifierToModifierGroupLinkService.insertModifierToModifierGroupLinks(modifierToModifierGroupLinkEntities, entityManager);
    }
  };

  validateUniqueGroupName = async (name: string, restaurantID: number, modifierGroupID?: number): Promise<void> => {
    const throwDuplicateConflict = (resID: number) => {
      logger.error(`A modifier group of same name already exists for restaurantID ${resID}`);
      throw new HttpException(
        409,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `A modifier group of same name already exists for restaurantID ${resID}. Refer to the logs for more detail`,
        ),
      );
    };

    // 409 check for modifier group with same name and of same restaurant
    const existingGroupModifier = await this.fetchModifierGroupByNameAndRestaurantID(name, restaurantID);

    if (modifierGroupID && existingGroupModifier && existingGroupModifier.modifierGroupID !== modifierGroupID) {
      // for editing modifierGroup
      throwDuplicateConflict(restaurantID);
    } else if (!modifierGroupID && existingGroupModifier) {
      // for creating modifierGroup
      throwDuplicateConflict(restaurantID);
    }
  };
}

export default ModifierGroupService;
