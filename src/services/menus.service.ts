import {
  MenusModelsInterface,
  CreateMenusDBInterface,
  CreateOneMenuInterface,
  CreateMenusRequestInterface,
  GetMenuDetailsResponseInterface,
  CreateAllMenusInterface,
  MenusDBInterface,
  MenusInterface,
  MenusServiceInterface,
  GetMenuByMenuIDInterface,
  EditMenuRequestInterface,
  GetMenuDetailsGenerateFileInterface,
} from '@interfaces/menus.interface';
import { MenuEntity } from '@/entities/menus.entity';
import { GetMenuItemsByMenuSectionInterface, MenuItemServiceInterface } from '@/interfaces/menuItem.interface';
import GetMenuDetailsResponse from '@/domain/GetMenuDetailsResponse';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import {
  MenuSections,
  MenuSectionsDBInterface,
  GetMenuSectionsForMenuDetailsInterface,
  MenuSectionsServiceInterface,
} from '@interfaces/menuSections.interface';
import { MenuHours, MenuHoursDBInterface, MenuHoursServiceInterface } from '@interfaces/menuHours.interface';
import CreateOneMenuResponse from '@/domain/CreateOneMenuResponse';
import { logger } from '@utils/logger';
import {
  CreateMenuDisclaimersResponseInterface,
  InsertedDisclaimersEditMenusInterface,
  MenuDisclaimerDBInterface,
  MenuDisclaimerInterface,
  MenuDisclaimerServiceInterface,
} from '@/interfaces/disclaimers.interface';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@/utils/dbUtils';
import { MenuDisclaimer } from '@/enums/menuDisclaimer';
import { buildFileURL, createMenuDoc_docx, generatePDFBuffer_PDF_Kit, uploadFileToGoogleCloud } from '@/utils/fileUtils';
import { getCurrentDate } from '@/utils/timeUtils';
import { FileGenerationType } from '@/enums/fileGenerationType';

class MenusService implements MenusServiceInterface {
  private menuModel: MenusModelsInterface;
  private menuHoursService: MenuHoursServiceInterface;
  private menuSectionsService: MenuSectionsServiceInterface;
  private menuItemsService: MenuItemServiceInterface;
  private menuDisclaimersService: MenuDisclaimerServiceInterface;

  constructor(
    menuModel: MenusModelsInterface,
    menuHoursService: MenuHoursServiceInterface,
    menuSectionsService: MenuSectionsServiceInterface,
    menuItemsService: MenuItemServiceInterface,
    menuDisclaimersService: MenuDisclaimerServiceInterface,
  ) {
    this.menuModel = menuModel;
    this.menuHoursService = menuHoursService;
    this.menuSectionsService = menuSectionsService;
    this.menuItemsService = menuItemsService;
    this.menuDisclaimersService = menuDisclaimersService;
  }

  createMenus = async (menuRequest: CreateMenusRequestInterface, restaurantID: number, manager?: EntityManager): Promise<CreateAllMenusInterface> => {
    try {
      const menusResponse: CreateOneMenuInterface[] = [];

      const { menus } = menuRequest;
      for (const menu of menus) {
        const menuInsertResponse: CreateMenusDBInterface = await this.menuModel.insertMenuTransaction(menu, restaurantID, manager);
        menusResponse.push(this.buildCreateMenuResponse(menuInsertResponse));
      }

      // Make sure newly created menus are sorted by their list order
      const sortedMenus = menusResponse?.sort((a, b) => (a.listOrder > b.listOrder ? 1 : -1)) || [];
      return { menus: sortedMenus };
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while creating menu: - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, 'Error occurred while creating menu. Refer to the logs for more detail'),
        );
      }
    }
  };

  getMenuByMenuID = async (menuID: number): Promise<GetMenuByMenuIDInterface> => {
    try {
      const menu: MenuEntity = await this.menuModel.getMenuByMenuID(menuID);
      if (Object.keys(menu).length > 0) {
        return this.buildGetMenuByMenuIDResponse(menu);
      } else {
        return {} as GetMenuByMenuIDInterface;
      }
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error while getting menu by menu id ${menuID}: - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error while getting menu by menu id ${menuID}. Refer to the logs for more detail`),
        );
      }
    }
  };

  getMenuByExternalID = async (externalID: string, manager?: EntityManager): Promise<MenuEntity> => {
    try {
      return await this.menuModel.getMenuByExternalID(externalID, manager);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error while getting menu by external id ${externalID}: - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error while getting menu by external id ${externalID}. Refer to the logs for more detail`),
        );
      }
    }
  };

  getMenuDetails = async (menuID: number, includeHidden = false): Promise<GetMenuDetailsResponseInterface> => {
    try {
      const menu: GetMenuByMenuIDInterface = await this.getMenuByMenuID(menuID);
      if (Object.keys(menu).length === 0) {
        logger.error(`Menu ${menuID} does not exist in database`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Menu ${menuID} does not exist in database`));
      }
      const isPrixFixe = menu.isPrixFixe;

      // get menu hours for associated menu
      const menuHoursByMenuIDResult: MenuHours[] = await this.menuHoursService.getMenuHoursByMenuID(menuID);

      // get disclaimers for associated menu
      const menuDisclaimersByMenuIDResult: MenuDisclaimerInterface[] = await this.menuDisclaimersService.getAllMenuDisclaimersByMenuID(menuID);

      // get menu sections for associated menu
      const menuSections: GetMenuSectionsForMenuDetailsInterface[] = await this.menuSectionsService.getMenuSectionsForMenuDetails(menuID);

      await Promise.all(
        menuSections.map(async section => {
          section.items = (await this.menuItemsService.getMenuItemsByMenuSection(
            section.menuSectionID,
            isPrixFixe,
            includeHidden,
          )) as GetMenuItemsByMenuSectionInterface[];
        }),
      );

      return this.buildGetMenuDetailsResponse(
        menu,
        menuDisclaimersByMenuIDResult,
        menuSections,
        menuHoursByMenuIDResult,
      ) as GetMenuDetailsResponseInterface;
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while getting menu ${menuID} - ${err}`);
        throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting menu ${menuID}`));
      }
    }
  };

  generateFile = async (fileFormat: FileGenerationType, menuID: number, fileName?: string): Promise<GetMenuDetailsGenerateFileInterface> => {
    try {
      const menu: GetMenuByMenuIDInterface = await this.getMenuByMenuID(menuID);
      if (!menu || Object.keys(menu).length === 0) {
        logger.error(`Menu ${menuID} does not exist in database`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Menu ${menuID} does not exist in database`));
      }

      // get disclaimers for associated menu
      const menuDisclaimersByMenuIDResult: MenuDisclaimerInterface[] = await this.menuDisclaimersService.getAllMenuDisclaimersByMenuID(menuID);

      // get menu sections for associated menu
      const menuSections: GetMenuSectionsForMenuDetailsInterface[] = await this.menuSectionsService.getMenuSectionsForMenuDetails(menuID);

      if (!menuSections || Object.keys(menuSections).length === 0) {
        logger.error(`Menu ${menuID} does not have any (un-hidden) menu sections`);
        throw new HttpException(
          422,
          getErrorPayload(InternalErrorCode.unprocessableContent, `Menu ${menuID} does not have any (un-hidden) menu sections.`),
        );
      }

      await Promise.all(
        menuSections.map(async section => {
          section.items = (await this.menuItemsService.getMenuItemsByMenuSection(
            section.menuSectionID,
            false,
          )) as GetMenuItemsByMenuSectionInterface[];
        }),
      );

      const hasItems = menuSections.some(section => section.items.length > 0);
      if (!hasItems) {
        logger.error(`Menu ${menuID} does not have any menu items for their sections.`);
        throw new HttpException(
          422,
          getErrorPayload(InternalErrorCode.unprocessableContent, `Menu ${menuID} does not have any menu items for their sections.`),
        );
      }

      let filename = '';
      if (fileFormat === FileGenerationType.PDF) {
        // pdf generation
        const pdfBuffer = await generatePDFBuffer_PDF_Kit(menuDisclaimersByMenuIDResult, menuSections, menu?.isPrixFixe || false);

        if (fileName) {
          filename = `${fileName}.pdf`;
        } else {
          filename = `${menu.menuName.replace(/\s+/g, '_')}-${getCurrentDate().replace(/\s+/g, '_')}Z.pdf`;
        }

        await uploadFileToGoogleCloud(pdfBuffer, filename);
      } else {
        // word docx generation
        const wordBuffer = await createMenuDoc_docx(menuDisclaimersByMenuIDResult, menuSections, menu?.isPrixFixe || false);

        if (fileName) {
          filename = `${fileName}.docx`;
        } else {
          filename = `${menu.menuName.replace(/\s+/g, '_')}-${getCurrentDate().replace(/\s+/g, '_')}.docx`;
        }

        await uploadFileToGoogleCloud(wordBuffer, filename);
      }

      return { fileURL: buildFileURL(filename) };
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.warn(`Error occurred while fetching / generating ${fileFormat} of a menu: ${menuID} - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while fetching / generating ${fileFormat} of a menu: ${menuID}. Refer to logs for more detail.`,
          ),
        );
      }
    }
  };

  deleteMenu = async (menuID: number, restaurantID: number): Promise<void> => {
    try {
      const getMenu: MenusDBInterface = await this.menuModel.getMenuByMenuIDAndRestaurantID(menuID, restaurantID);
      if (!getMenu?.menu_id) {
        logger.warn(`Menu ${menuID} does not exist in database`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Menu ${menuID} does not exist in database`));
      }
      await this.menuModel.deleteMenu(menuID, restaurantID);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.warn(`Error occurred while deleting menu: - ` + err);
        throw new HttpException(500, getErrorPayload(InternalErrorCode.runtimeError, 'Error occurred while deleting menus'));
      }
    }
  };

  getMenuByMenuIDAndRestaurantID = async (menuID: number, restaurantID: number): Promise<MenusInterface> => {
    try {
      return this.buildMenusResponse(await this.menuModel.getMenuByMenuIDAndRestaurantID(menuID, restaurantID));
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.warn(`Error occurred while getting menu by menuID ${menuID} and restaurantID ${restaurantID}: - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting menu by menuID ${menuID} and restaurantID ${restaurantID}`),
        );
      }
    }
  };

  editMenu = async (menuRequest: EditMenuRequestInterface, manager?: EntityManager): Promise<InsertedDisclaimersEditMenusInterface> => {
    try {
      return await this.menuModel.editMenu(menuRequest, manager);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.warn(`Error occurred while editing menu: - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, 'Error occurred while editing menu. Refer to the logs for more detail'),
        );
      }
    }
  };

  hideMenu = async (menuID: number, hide: boolean): Promise<void> => {
    try {
      await this.menuModel.hideMenu(menuID, hide);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while hiding menu ${menuID} -` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while hiding menu ${menuID}. Refer to logs for more info.`),
        );
      }
    }
  };

  reorderMenus = async (restaurantID: number, menusOrder: number[], manager?: EntityManager): Promise<void> => {
    try {
      // get already existing menus per restaurant
      const existingMenus: number[] = (await this.menuModel.getMenusEntitiesByRestaurantID(restaurantID, manager)).map(menu => menu.menu_id);

      // body request menu ids and database menu ids must be equal length
      if (menusOrder?.length !== existingMenus?.length) {
        logger.error(`Menus are not same amount in body request versus database`);
        throw new HttpException(
          400,
          getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Menus are not same amount in body request vs database`),
        );
      }

      // make into set for O(1) time complexity for .has()
      const setMenusOrder = new Set(menusOrder);
      const setExistingMenus = new Set(existingMenus);

      // check for any duplicates (DTO handles this but just in case)
      if (menusOrder?.length !== setMenusOrder?.size || existingMenus?.length !== setExistingMenus?.size) {
        logger.error(`Menus has duplicates in body request or database`);
        throw new HttpException(
          400,
          getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Menus have duplicates in body request or database`),
        );
      }

      // O(n)?  Promise.all runs map promises async, and .has() is only O(1), should be fast
      // check if missing menu in body request compared to database
      // logic also covers if extra menu in body request compared to database since arrays are same length
      await Promise.all(
        existingMenus?.map(menu => {
          if (!setMenusOrder?.has(menu)) {
            logger.error(`A menu(s) in body request does not exist`);
            throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `A menu(s) in body request does not exist`));
          }
        }),
      );

      const buildUpdateArray = [];
      for (let index = 0; index < menusOrder.length; index++) {
        buildUpdateArray.push({ menu_id: menusOrder[index], list_order: index });
      }

      // update list order for menus, 1 database call via array updating multiple rows list order
      if (buildUpdateArray.length > 0) {
        if (manager) {
          await this.menuModel.updateMenusListOrder(buildUpdateArray, manager);
        } else {
          const repository: EntityManager = await ormConnection();
          await repository.transaction(async conn => {
            await this.menuModel.updateMenusListOrder(buildUpdateArray, conn);
          });
        }
      }
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while reordering menus for restaurantID: ${restaurantID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while reordering menus for restaurantID: ${restaurantID}`),
        );
      }
    }
  };

  buildCreateMenuResponse = (createMenu: CreateMenusDBInterface): CreateOneMenuInterface => {
    const createMenuResponse = new CreateOneMenuResponse();
    createMenuResponse.menuID = createMenu.menu_id;
    createMenuResponse.name = createMenu.name;
    createMenuResponse.isPrixFixe = createMenu.is_prix_fixe;
    createMenuResponse.isHidden = createMenu.is_hidden;
    createMenuResponse.restaurantID = createMenu.restaurant_id;
    createMenuResponse.menuSections = this.buildMenuSectionResponse(createMenu.menuSections);
    createMenuResponse.menuHours = this.buildMenuHoursResponse(createMenu.menuHours ?? []);
    createMenuResponse.disclaimers = this.buildCreateDisclaimerResponse(createMenu.disclaimers ?? []);

    if (createMenu.external_id) {
      createMenuResponse.externalID = createMenu.external_id;
    }
    return createMenuResponse;
  };

  buildCreateDisclaimerResponse = (menuDisclaimers: MenuDisclaimerDBInterface[]): CreateMenuDisclaimersResponseInterface[] => {
    if (!menuDisclaimers || menuDisclaimers?.length === 0) return [];

    const menuDisclaimerResponse = [];
    const mapPositions = {
      [1]: MenuDisclaimer.top,
      [2]: MenuDisclaimer.bottom,
    };

    // Make sure newly created menu sections are sorted by their list order
    for (const disclaimer of menuDisclaimers) {
      menuDisclaimerResponse.push({
        message: disclaimer.message,
        messageID: disclaimer.message_id,
        position: mapPositions[disclaimer.message_type_id],
      });
    }

    return menuDisclaimerResponse as CreateMenuDisclaimersResponseInterface[];
  };

  buildMenuSectionResponse = (menuSections: MenuSectionsDBInterface[]): MenuSections[] => {
    if (!menuSections || menuSections?.length === 0) return [];

    const menuSectionResponse = [];
    // Make sure newly created menu sections are sorted by their list order
    const sortedMenuSections = menuSections?.sort((a, b) => (a.list_order > b.list_order ? 1 : -1));
    for (const menuSection of sortedMenuSections) {
      const response: any = {};
      response.menuSectionID = menuSection.menu_section_id;
      response.name = menuSection.name;
      response.message = menuSection.message || '';

      if (menuSection.external_id) {
        response.externalID = menuSection.external_id ?? null;
      }
      menuSectionResponse.push(response);
    }

    return menuSectionResponse as MenuSections[];
  };

  buildMenuHoursResponse = (menuHours: MenuHoursDBInterface[]): MenuHours[] => {
    if (!menuHours || menuHours?.length === 0) return [];

    const menuHoursResponse = [];
    for (const menuHour of menuHours) {
      const response: any = {};
      response.id = menuHour.id;
      response.day = menuHour.day;
      response.start = menuHour.start;
      response.end = menuHour.end;
      menuHoursResponse.push(response);
    }

    return menuHoursResponse as MenuHours[];
  };

  buildGetMenuByMenuIDResponse = (menu: MenuEntity): GetMenuByMenuIDInterface => ({
    menuID: menu.menu_id,
    menuName: menu.name,
    restaurantID: menu.restaurant_id,
    isPrixFixe: menu.is_prix_fixe,
    isHidden: menu.is_hidden,
    externalID: menu.external_id,
  });

  buildGetMenuDetailsResponse = (
    getMenuByMenuID: GetMenuByMenuIDInterface,
    menuDisclaimersByMenuIDResult: MenuDisclaimerInterface[],
    menuSections: GetMenuSectionsForMenuDetailsInterface[],
    menuHours: MenuHours[],
  ): GetMenuDetailsResponse => {
    const getMenuDetailsResponse = new GetMenuDetailsResponse();
    getMenuDetailsResponse.menuID = getMenuByMenuID.menuID;
    getMenuDetailsResponse.menuName = getMenuByMenuID.menuName;
    getMenuDetailsResponse.restaurantID = getMenuByMenuID.restaurantID;
    getMenuDetailsResponse.isPrixFixe = getMenuByMenuID.isPrixFixe;
    getMenuDetailsResponse.isHidden = getMenuByMenuID.isHidden;
    getMenuDetailsResponse.externalID = getMenuByMenuID.externalID;
    getMenuDetailsResponse.messages = menuDisclaimersByMenuIDResult;
    getMenuDetailsResponse.menuSections = menuSections;
    getMenuDetailsResponse.menuHours = menuHours;
    return getMenuDetailsResponse as GetMenuDetailsResponse;
  };

  buildMenusResponse = (menu: MenusDBInterface): MenusInterface => {
    return {
      menuID: menu.menu_id,
      name: menu.name,
      restaurantID: menu.restaurant_id,
      listOrder: menu.list_order,
      createdAt: menu.created_at,
      updatedAt: menu.updated_at,
    };
  };
}

export default MenusService;
