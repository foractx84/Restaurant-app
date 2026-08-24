import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import {
  MenuSectionsDBInterface,
  MenuSectionsModelInterface,
  MenuSectionsServiceInterface,
  GetMenuSectionsForMenuDetailsDBInterface,
  GetMenuSectionsForMenuDetailsInterface,
  CreateMenuSectionsInterface,
  MenuSections,
} from '@interfaces/menuSections.interface';
import { MenuSectionEntity } from '@/entities/menuSections.entity';
import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import { ormConnection } from '@/utils/dbUtils';
import { EntityManager } from 'typeorm';

class MenuSectionsService implements MenuSectionsServiceInterface {
  private menuSectionModel: MenuSectionsModelInterface;

  constructor(menuSectionModel: MenuSectionsModelInterface) {
    this.menuSectionModel = menuSectionModel;
  }

  editMenuSection = async (
    menuID: number,
    menuSectionID: number,
    menuSectionName: string,
    message?: string,
    manager?: EntityManager,
  ): Promise<void> => {
    try {
      await this.menuSectionModel.updateMenuSectionName(menuSectionID, menuSectionName, message, manager);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while editing menu section ${menuSectionID}: - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while editing menu section ${menuSectionID}. Refer to the logs for more detail`,
          ),
        );
      }
    }
  };

  getMenuSectionEntityByID = async (menuSectionID: number): Promise<MenuSectionEntity> => {
    try {
      return await this.menuSectionModel.findMenuSectionEntityByID(menuSectionID);
    } catch (err) {
      logger.warn(`Error occurred while getting menu section by ID: ${menuSectionID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting menu section by ID: ${menuSectionID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  getMenuSectionByExternalID = async (externalID: string, manager?: EntityManager): Promise<MenuSectionEntity> => {
    try {
      return await this.menuSectionModel.getMenuSectionByExternalID(externalID, manager);
    } catch (err) {
      logger.warn(`Error occurred while getting menu section by external id: ${externalID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting menu section by external id: ${externalID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  insertMenuSections = async (
    menuSections: MenuSections[],
    menuID: number,
    repository?: PostgresQueriesRepository,
  ): Promise<MenuSectionsDBInterface[]> => {
    try {
      if (!repository) {
        const ormConn: EntityManager = await ormConnection();
        repository = ormConn.getCustomRepository(PostgresQueriesRepository);
      }
      const menuSectionEntities: MenuSectionEntity[] = [];
      menuSections.map(section => {
        const menuSectionsEntity = new MenuSectionEntity();
        menuSectionsEntity.name = section.name;
        menuSectionsEntity.message = section.message;
        menuSectionsEntity.menu_id = menuID;
        if (section?.externalID) {
          menuSectionsEntity.external_id = section?.externalID ?? null;
        }
        menuSectionEntities.push(menuSectionsEntity);
      });

      return await this.menuSectionModel.insertAllMenuSections(menuSectionEntities, repository);
    } catch (err) {
      logger.warn(`Error occurred while creating menu sections for menu: ${menuID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while creating menu sections for menu: ${menuID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  getMenuSectionsForMenuDetails = async (menuID: number): Promise<GetMenuSectionsForMenuDetailsInterface[]> => {
    try {
      const getMenuSectionsResults: GetMenuSectionsForMenuDetailsDBInterface[] = await this.menuSectionModel.getMenuSectionsByMenuID(menuID);

      return this.buildGetMenuSectionsForMenuDetailsResponse(getMenuSectionsResults) as GetMenuSectionsForMenuDetailsInterface[];
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while getting menu sections for menu details of menuID ${menuID}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting menu sections for menu details of menuID ${menuID}`),
        );
      }
    }
  };

  buildGetMenuSectionsForMenuDetailsResponse = (
    menuSections: GetMenuSectionsForMenuDetailsDBInterface[],
  ): GetMenuSectionsForMenuDetailsInterface[] => {
    const menuSectionResponse = [];
    for (const menuSection of menuSections) {
      const response: any = {};
      response.menuSectionID = menuSection.menu_section_id;
      response.sectionName = menuSection.section_name;
      response.message = menuSection.message || '';
      response.isHidden = menuSection.is_hidden || false;
      response.externalID = menuSection.external_id;
      menuSectionResponse.push(response);
    }

    return menuSectionResponse as GetMenuSectionsForMenuDetailsInterface[];
  };

  createMenuSections = async (menuSections: MenuSections[], menuID: number, manager?: EntityManager): Promise<CreateMenuSectionsInterface> => {
    try {
      const menuSectionEntities: MenuSectionEntity[] = [];
      menuSections.map(section => {
        const menuSectionsEntity = new MenuSectionEntity();
        menuSectionsEntity.name = section.name;
        menuSectionsEntity.message = section.message;
        menuSectionsEntity.menu_id = menuID;

        if (section?.externalID) {
          menuSectionsEntity.external_id = section?.externalID ?? null;
        }
        menuSectionEntities.push(menuSectionsEntity);
      });

      const menuSectionResult: MenuSectionEntity[] = await this.menuSectionModel.insertMenuSections(menuSectionEntities, manager);

      const camelizeMenuSections = this.buildMenuSectionResponse(menuSectionResult);

      return {
        menuID: menuID,
        menuSections: [...camelizeMenuSections],
      } as CreateMenuSectionsInterface;
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.warn(`Error occurred while creating menu sections for menu: ${menuID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating menu sections for menu: ${menuID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  deleteMenuSection = async (menuSectionID: number): Promise<void> => {
    try {
      // do not need to check if menu section id exists as middleware handles this
      await this.menuSectionModel.deleteMenuSection(menuSectionID);
    } catch (err) {
      logger.warn(`Error occurred while deleting menu sections: ${menuSectionID} - ` + err);
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of (i.e came from deleteMenuSection function)
        throw err;
      } else {
        throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, 'Error occurred while deleting menu section'));
      }
    }
  };

  reorderMenuSections = async (menuID: number, menuSectionsOrder: number[], manager?: EntityManager): Promise<void> => {
    try {
      // get already existing menu sections per menu
      const existingMenuSections: number[] = (await this.menuSectionModel.getMenuSectionsByMenuID(menuID, manager)).map(
        section => section.menu_section_id,
      );

      // body request menu section ids and database menu section ids must be equal length
      if (menuSectionsOrder?.length !== existingMenuSections?.length) {
        logger.error(`Menu sections are not same amount in body request versus database`);
        throw new HttpException(
          400,
          getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Menu sections are not same amount in body request vs database`),
        );
      }

      // make into set for O(1) time complexity for .has()
      const setMenuSectionsOrder = new Set(menuSectionsOrder);
      const setExistingMenuSections = new Set(existingMenuSections);

      // check for any duplicates (DTO handles this but just in case)
      if (menuSectionsOrder?.length !== setMenuSectionsOrder?.size || existingMenuSections?.length !== setExistingMenuSections?.size) {
        logger.error(`Menu sections has duplicates in body request or database`);
        throw new HttpException(
          400,
          getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Menu sections have duplicaes in body request or database`),
        );
      }

      // O(n)?  Promise.all runs map promises async, and .has() is only O(1), should be fast
      // check if missing menu sections in body request compared to database
      // logic also covers if extra menu sections in body request compared to database since arrays are same length
      await Promise.all(
        existingMenuSections?.map(section => {
          if (!setMenuSectionsOrder?.has(section)) {
            logger.error(`A menu section(s) in body request does not exist`);
            throw new HttpException(
              400,
              getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `A menu section(s) in body request does not exist`),
            );
          }
        }),
      );

      const buildUpdateArray = [];
      for (let index = 0; index < menuSectionsOrder.length; index++) {
        buildUpdateArray.push({ menu_section_id: menuSectionsOrder[index], list_order: index });
      }

      // update list order for menu sections, 1 database call via array updating multiple rows list order
      if (buildUpdateArray.length > 0) {
        if (manager) {
          await this.menuSectionModel.updateMenuSectionsListOrder(buildUpdateArray, manager);
        } else {
          const repository: EntityManager = await ormConnection();
          await repository.transaction(async conn => {
            await this.menuSectionModel.updateMenuSectionsListOrder(buildUpdateArray, conn);
          });
        }
      }
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while reordering menu sections for menu: ${menuID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while reordering menu sections for menu: ${menuID}`),
        );
      }
    }
  };

  hideMenuSection = async (menuSectionID: number, hide: boolean): Promise<void> => {
    try {
      await this.menuSectionModel.hideMenuSection(menuSectionID, hide);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while hiding menu section ${menuSectionID} -` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while hiding menu section ${menuSectionID}. Refer to logs for more info.`),
        );
      }
    }
  };

  buildMenuSectionResponse = (menuSections: MenuSectionsDBInterface[]): MenuSections[] => {
    const menuSectionResponse = [];
    for (const menuSection of menuSections) {
      const response: any = {};
      response.menuSectionID = menuSection.menu_section_id;
      response.name = menuSection.name;
      response.message = menuSection.message || '';

      if (menuSection.external_id) {
        response.externalID = menuSection.external_id || null;
      }
      menuSectionResponse.push(response);
    }

    return menuSectionResponse as MenuSections[];
  };
}

export default MenuSectionsService;
