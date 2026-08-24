import { SoftDeleteModelInterface } from '@interfaces/softDelete.interface';
import { MenuSectionEntity } from '@entities/menuSections.entity';
import { MenuItemEntity } from '@entities/menuItem.entity';
import { EntityManager, In } from 'typeorm';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { MenuEntity } from '@entities/menus.entity';

class SoftDeleteModel implements SoftDeleteModelInterface {
  softDeleteMenuByID = async (menuID: number, repository: EntityManager): Promise<void> => {
    try {
      await repository.update(MenuEntity, menuID, { deleted: true });
    } catch (err) {
      logger.warn(`Error deleting menu with ID: ${menuID}` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error deleting menu '${menuID}'`));
    }
  };

  softDeleteMenuItemByMenuID = async (menuID: number, repository: EntityManager): Promise<void> => {
    try {
      const menuSections = await repository.find(MenuSectionEntity, { where: { menu_id: menuID } });
      const menuSectionsIDs = menuSections.map(section => {
        return section.menu_section_id;
      });
      await repository.update(MenuItemEntity, { menu_section_id: In(menuSectionsIDs) }, { deleted: true });
    } catch (err) {
      logger.warn(`Error deleting menu item with menuID: ${menuID}` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error deleting menu item with menuID '${menuID}'`));
    }
  };

  softDeleteMenuItemByMenuSectionID = async (menuSectionID: number, repository: EntityManager): Promise<void> => {
    try {
      await repository.update(MenuItemEntity, { menu_section_id: menuSectionID }, { deleted: true });
    } catch (err) {
      logger.warn(`Error deleting menu item with menuSectionID: ${menuSectionID}` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error deleting menu item with menuSectionID '${menuSectionID}'`),
      );
    }
  };

  softDeleteMenuSectionByID = async (menuSectionID: number, repository: EntityManager): Promise<void> => {
    try {
      await repository.update(MenuSectionEntity, menuSectionID, { deleted: true });
    } catch (err) {
      logger.warn(`Error deleting menu section: ${menuSectionID}` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error deleting menu section '${menuSectionID}'`));
    }
  };

  softDeleteMenuSectionByMenuID = async (menuID: number, repository: EntityManager): Promise<void> => {
    try {
      await repository.update(MenuSectionEntity, { menu_id: menuID }, { deleted: true });
    } catch (err) {
      logger.warn(`Error deleting menu section with menuID: ${menuID}` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error deleting menu section with menuID '${menuID}'`));
    }
  };
}

export default SoftDeleteModel;
