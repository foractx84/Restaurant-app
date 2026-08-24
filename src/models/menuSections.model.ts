import {
  MenuSectionsModelInterface,
  MenuSectionsDBInterface,
  GetMenuSectionsForMenuDetailsDBInterface,
  ReorderMenuSectionsQueryInterface,
} from '@interfaces/menuSections.interface';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { EntityManager, FindManyOptions, InsertResult } from 'typeorm';
import { MenuSectionEntity } from '@entities/menuSections.entity';
import { ormConnection } from '@utils/dbUtils';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';

class MenuSectionsModel implements MenuSectionsModelInterface {
  findMenuSectionEntityByID = async (menuSectionID: number): Promise<MenuSectionEntity> => {
    const ormConn: EntityManager = await ormConnection();
    return await ormConn.findOne<MenuSectionEntity>(MenuSectionEntity, menuSectionID, { relations: ['menu_id'] });
  };

  insertAllMenuSections = async (menuSections: MenuSectionEntity[], repository: PostgresQueriesRepository): Promise<MenuSectionsDBInterface[]> => {
    const menuSectionsResults: InsertResult = await repository.insert('menu_sections', menuSections);
    return menuSectionsResults.raw;
  };

  insertMenuSections = async (menuSections: MenuSectionEntity[], manager?: EntityManager): Promise<MenuSectionEntity[]> => {
    try {
      if (!manager) {
        manager = await ormConnection();
      }
      return await manager.save(MenuSectionEntity, menuSections);
    } catch (err) {
      logger.error(`Error occurred while inserting menu sections: ${JSON.stringify(menuSections)} - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while inserting menu sections. Refer to logs for more info.'),
      );
    }
  };

  getMenuSectionsByMenuID = async (menuID: number, manager?: EntityManager): Promise<GetMenuSectionsForMenuDetailsDBInterface[]> => {
    try {
      if (!manager) {
        manager = await ormConnection();
      }

      const options: FindManyOptions<MenuSectionEntity> = {
        where: { menu_id: menuID, deleted: false },
        order: { list_order: 'ASC' },
      };
      const menuSectionsResults: MenuSectionEntity[] = await manager.find<MenuSectionEntity>(MenuSectionEntity, options);

      return menuSectionsResults.map(section => {
        return {
          menu_section_id: section.menu_section_id,
          section_name: section.name,
          message: section.message,
          is_hidden: section.is_hidden,
          external_id: section.external_id,
        };
      });
    } catch (err) {
      logger.error(`Error occurred while fetching menu section by menu id: ${menuID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching menu section by menu id: ${menuID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  getMenuSectionByExternalID = async (externalID: string, manager?: EntityManager): Promise<MenuSectionEntity> => {
    try {
      if (!manager) {
        manager = await ormConnection();
      }

      return await manager.findOne<MenuSectionEntity>(MenuSectionEntity, {
        where: { external_id: externalID, deleted: false },
        relations: ['menu_items'],
      });
    } catch (err) {
      logger.error(`Error occurred while fetching menu section by externalID: ${externalID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching menu section by externalID: ${externalID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  deleteMenuSection = async (menuSectionID: number): Promise<void> => {
    try {
      const ormConn: EntityManager = await ormConnection();
      await ormConn.delete(MenuSectionEntity, { menu_section_id: menuSectionID });
    } catch (err) {
      logger.error(`Error with delete menu section '${menuSectionID}`);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error with deleting menu section '${menuSectionID}`));
    }
  };

  findMenuSectionByIDAndRestaurantID = async (menuSectionID: number, restaurantID: number): Promise<MenuSectionEntity> => {
    const ormConn: EntityManager = await ormConnection();
    return await ormConn
      .getRepository<MenuSectionEntity>(MenuSectionEntity)
      .createQueryBuilder('sections')
      .leftJoinAndSelect('sections.menu_id', 'menu')
      .leftJoinAndSelect('menu.restaurant_id', 'restaurant')
      .where('restaurant.restaurant_id = :restaurant_id', { restaurant_id: restaurantID })
      .andWhere('sections.menu_section_id = :menu_section_id', { menu_section_id: menuSectionID })
      .andWhere('sections.deleted = false')
      .getOne();
  };

  hideMenuSection = async (menuSectionID: number, hide: boolean, respository?: EntityManager): Promise<void> => {
    try {
      if (!respository) {
        respository = await ormConnection();
      }
      await respository.update<MenuSectionEntity>(MenuSectionEntity, menuSectionID, { is_hidden: hide });
    } catch (err) {
      logger.warn(`Error updating menu section ${menuSectionID} hide status -` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error updating menu section ${menuSectionID} hide status`));
    }
  };

  updateMenuSectionsListOrder = async (sections: ReorderMenuSectionsQueryInterface[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.save(MenuSectionEntity, sections);
    } catch (err) {
      logger.error(`Error with updating menu sections list order '${JSON.stringify(sections)}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error with updating menu sections list order '${JSON.stringify(sections)}`),
      );
    }
  };

  updateMenuSectionName = async (menuSectionID: number, name: string, message?: string, repository?: EntityManager): Promise<void> => {
    if (!repository) {
      repository = await ormConnection();
    }

    const updateFields = {
      name: name,
    };
    if (message !== undefined) {
      updateFields['message'] = message;
    }
    await repository.update(MenuSectionEntity, menuSectionID, { ...updateFields });
  };
}

export default MenuSectionsModel;
