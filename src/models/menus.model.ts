import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import {
  MenusModelsInterface,
  MenusDBInterface,
  Menus,
  CreateMenusDBInterface,
  EditMenuRequestInterface,
  ReorderMenusQueryInterface,
} from '@interfaces/menus.interface';
import { logger } from '@utils/logger';
import { ormConnection } from '@utils/dbUtils';
import { EntityManager } from 'typeorm';
import { MenuEntity } from '@entities/menus.entity';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { MenuSectionsDBInterface, MenuSectionsServiceInterface } from '@interfaces/menuSections.interface';
import { MenuHoursDBInterface, MenuHoursServiceInterface } from '@interfaces/menuHours.interface';
import { MenuDisclaimerServiceInterface, MenuDisclaimerDBInterface, InsertedDisclaimersEditMenusInterface } from '@interfaces/disclaimers.interface';
import { SoftDeleteServiceInterface } from '@interfaces/softDelete.interface';

class MenusModel implements MenusModelsInterface {
  private menuHoursService: MenuHoursServiceInterface;
  private menuSectionsService: MenuSectionsServiceInterface;
  private menuDisclaimersService: MenuDisclaimerServiceInterface;
  private softDeleteService: SoftDeleteServiceInterface;

  constructor(
    menuHoursService: MenuHoursServiceInterface,
    menuSectionsService: MenuSectionsServiceInterface,
    menuDisclaimersService: MenuDisclaimerServiceInterface,
    softDeleteService: SoftDeleteServiceInterface,
  ) {
    this.menuHoursService = menuHoursService;
    this.menuSectionsService = menuSectionsService;
    this.menuDisclaimersService = menuDisclaimersService;
    this.softDeleteService = softDeleteService;
  }

  hideMenu = async (menuID: number, hide: boolean, respository?: EntityManager): Promise<void> => {
    try {
      if (!respository) {
        respository = await ormConnection();
      }
      await respository.update(MenuEntity, menuID, { is_hidden: hide });
    } catch (err) {
      logger.warn(`Error updating menu ${menuID} hide status -` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error updating menu ${menuID} hide status`));
    }
  };

  insertMenu = async (menu: Menus, restaurantID: number, repository: PostgresQueriesRepository): Promise<MenusDBInterface> => {
    try {
      const menuEntity = new MenuEntity();
      menuEntity.name = menu.name;
      menuEntity.is_prix_fixe = menu.isPrixFixe;
      menuEntity.is_hidden = menu.isHidden || false;
      menuEntity.restaurant_id = restaurantID;
      menuEntity.sections = [];
      menuEntity.hours = [];
      menuEntity.external_id = menu.externalID ?? null;

      const menuResult = await repository.insert('menus', [menuEntity]);
      return menuResult.raw[0];
    } catch (err) {
      logger.warn(`Error occurred while creating menu for restaurantID: ${restaurantID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while creating menu for restaurantID: ${restaurantID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  insertMenuTransaction = async (menu: Menus, restaurantID: number, manager?: EntityManager): Promise<CreateMenusDBInterface> => {
    let temp_result: any = {};

    const execution = async (conn: EntityManager, request: Menus, rID: number): Promise<void> => {
      const menuRepository: PostgresQueriesRepository = await conn.getCustomRepository(PostgresQueriesRepository);
      const menuResult: MenusDBInterface = await this.insertMenu(request, rID, menuRepository);

      const menuID = menuResult.menu_id;

      let menuHoursResult: MenuHoursDBInterface[] = [];
      if (request.menuHours?.length > 0) {
        menuHoursResult = await this.menuHoursService.insertMenuHours(request.menuHours, menuID, menuRepository);
      }

      let menuSectionsResult: MenuSectionsDBInterface[] = [];
      if (request.menuSections) {
        menuSectionsResult = await this.menuSectionsService.insertMenuSections(request.menuSections, menuID, menuRepository);
      }

      let menuDisclaimerResult: MenuDisclaimerDBInterface[] = [];
      if (request?.disclaimers) {
        menuDisclaimerResult = await this.menuDisclaimersService.insertMenuDisclaimers(request.disclaimers, menuID, menuRepository);
      }

      temp_result = menuResult;
      temp_result.menuSections = menuSectionsResult;
      temp_result.menuHours = menuHoursResult;
      temp_result.disclaimers = menuDisclaimerResult;
    };

    if (!!manager) {
      await execution(manager, menu, restaurantID);
    } else {
      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        await execution(conn, menu, restaurantID);
      });
    }

    return temp_result as CreateMenusDBInterface;
  };

  getMenuByMenuID = async (menuID: number): Promise<MenuEntity> => {
    try {
      const ormConn: EntityManager = await ormConnection();
      const menuResults: MenuEntity = await ormConn.findOne(MenuEntity, { menu_id: menuID, deleted: false });
      return menuResults;
    } catch (err) {
      logger.warn(`Error with getting menu by menu id '${menuID}`);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error with getting menu by menu id '${menuID}`));
    }
  };

  getMenuByExternalID = async (externalID: string, manager?: EntityManager): Promise<MenuEntity> => {
    try {
      if (!manager) {
        manager = await ormConnection();
      }

      return await manager.findOne<MenuEntity>(MenuEntity, {
        where: { external_id: externalID, deleted: false },
        relations: ['disclaimers', 'hours', 'sections'],
      });
    } catch (err) {
      logger.warn(`Error with getting menu by externalID: ${externalID} - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error with getting menu by externalIDd ${externalID}. Refer to logs for more detail.`),
      );
    }
  };

  getMenuByMenuIDAndRestaurantID = async (menuID: number, restaurantID: number): Promise<MenusDBInterface> => {
    try {
      const ormConn: EntityManager = await ormConnection();
      return ormConn.findOne(MenuEntity, { menu_id: menuID, restaurant_id: restaurantID, deleted: false });
    } catch (e) {
      logger.warn(`Get Menu Error for menuID: ${menuID} - ` + e);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error with selecting menuID ${menuID} of restaurantID: ${restaurantID}`),
      );
    }
  };

  getMenusEntitiesByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<MenuEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return repository.find(MenuEntity, { restaurant_id: restaurantID, deleted: false });
    } catch (e) {
      logger.warn(`Could not get menus by restaurantID: ${restaurantID} - ` + e);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Could not get menus by restaurantID: ${restaurantID}`));
    }
  };

  deleteMenu = async (menuID: number, restaurantID: number): Promise<void> => {
    try {
      const ormConn: EntityManager = await ormConnection();
      await ormConn.delete(MenuEntity, { menu_id: menuID, restaurant_id: restaurantID });
    } catch (e) {
      logger.warn(`Delete Menu Error for menuID: ${menuID} - ` + e);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error with deleting menuID ${menuID}`));
    }
  };

  editMenu = async (menuRequest: EditMenuRequestInterface, manager?: EntityManager): Promise<InsertedDisclaimersEditMenusInterface> => {
    try {
      let insertedDisclaimers = {};

      const execution = async (conn: EntityManager, request: EditMenuRequestInterface): Promise<void> => {
        const { menuID, name, menuHours, disclaimers, isPrixFixe } = request;
        const menuRepository: PostgresQueriesRepository = conn.getCustomRepository(PostgresQueriesRepository);

        // either create, and/or delete menu disclaimer
        insertedDisclaimers = await this.menuDisclaimersService.editMenuDisclaimers(disclaimers, menuID, conn);

        // delete all menu hours and insert new menu hours
        await this.menuHoursService.hardDeleteMenuHoursByMenuID(menuID, conn);
        await this.menuHoursService.insertMenuHours(menuHours, menuID, menuRepository);

        // update menu name
        if (name) {
          await this.updateMenuNameAndPrixFixeByMenuID(menuID, name, isPrixFixe, conn);
        }
      };

      if (!!manager) {
        await execution(manager, menuRequest);
      } else {
        const ormConn: EntityManager = await ormConnection();
        await ormConn.transaction(async conn => {
          await execution(conn, menuRequest);
        });
      }
      return insertedDisclaimers as InsertedDisclaimersEditMenusInterface;
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.warn(`Error occurred while editing menu: - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, 'Error occurred while editing menu. Refer to the logs for more detail'),
        );
      }
    }
  };

  updateMenuNameAndPrixFixeByMenuID = async (menuID: number, name: string, isPrixFixe: boolean, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.update(MenuEntity, menuID, { name: name, is_prix_fixe: isPrixFixe });
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.warn(`Error occurred while updating menu name ${name} by menuID ${menuID} : - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while updating menu name ${name} by menuID ${menuID}. Refer to the logs for more detail`,
          ),
        );
      }
    }
  };

  updateMenusListOrder = async (menus: ReorderMenusQueryInterface[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.save(MenuEntity, menus);
    } catch (err) {
      logger.error(`Error with updating menu list order '${JSON.stringify(menus)}`);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error with updating menu list order ${JSON.stringify(menus)}`));
    }
  };
}

export default MenusModel;
