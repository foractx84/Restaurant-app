import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { MenuItemEntity } from '@entities/menuItem.entity';
import { DrinkItemModelInterface } from '@interfaces/drinkItem.interface';

class DrinkItemModel implements DrinkItemModelInterface {
  getDrinkItemsByIDsAndRestaurantID = async (drinkItemIDs: number[], restaurantID: number, repository?: EntityManager): Promise<MenuItemEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository
        .getRepository(MenuItemEntity)
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.menu_section_id', 'section')
        .leftJoinAndSelect('section.menu_id', 'menu')
        .leftJoinAndSelect('menu.restaurant_id', 'restaurant')
        .where('restaurant.restaurant_id = :restaurantID', { restaurantID })
        .andWhere('item.deleted = false')
        .andWhere("item.category = 'drink'")
        .andWhere('item.menu_item_id IN (:...ids)', { ids: drinkItemIDs })
        .getMany();
    } catch (err) {
      logger.warn(`Error fetching drinks items: ${drinkItemIDs.toString()} by restaurant: ${restaurantID} -` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error fetching drinks items: ${drinkItemIDs.toString()} by restaurant: ${restaurantID}`),
      );
    }
  };

  getDrinkItemsByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<MenuItemEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository
        .getRepository(MenuItemEntity)
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.menu_section_id', 'section')
        .leftJoinAndSelect('section.menu_id', 'menu')
        .leftJoinAndSelect('menu.restaurant_id', 'restaurant')
        .where('restaurant.restaurant_id = :restaurantID', { restaurantID })
        .andWhere('item.deleted = false')
        .andWhere("item.category = 'drink'")
        .orderBy({
          'item.name': 'ASC',
        })
        .getMany();
    } catch (err) {
      logger.warn(`Error getting drinks items by restaurant id: '${restaurantID}' -` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error getting drinks items by restaurant id: '${restaurantID}`));
    }
  };
}

export default DrinkItemModel;
