import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { RestaurantPageOrderEntity } from '@entities/restaurantPageOrder.entity';
import { PageOrderModelInterface } from '@interfaces/pageOrder.interface';

class PageOrderModel implements PageOrderModelInterface {
  fetchByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<RestaurantPageOrderEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository
        .createQueryBuilder(RestaurantPageOrderEntity, 'restaurant_page_order')
        .where('restaurant_page_order.restaurant_id = :restaurantID', { restaurantID })
        .orderBy('restaurant_page_order.list_order', 'ASC')
        .getMany();
    } catch (err) {
      logger.error(`Error while fetching page order for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while fetching page order for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };

  // Full replace of a restaurant's page order in a single transaction: clear the existing rows then
  // insert the new ordered set (list_order = array index). The orderable set is a small fixed
  // universe and the frontend always sends the complete list, so replace is simpler and avoids
  // stale rows that an in-place upsert could leave behind.
  replaceForRestaurant = async (restaurantID: number, orderedKeys: string[], repository?: EntityManager): Promise<RestaurantPageOrderEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.transaction(async tx => {
        await tx.delete(RestaurantPageOrderEntity, { restaurant_id: restaurantID });
        if (orderedKeys.length === 0) {
          return [];
        }
        const rows = orderedKeys.map((page_key, index) =>
          tx.create(RestaurantPageOrderEntity, {
            restaurant_id: restaurantID,
            page_key,
            list_order: index,
          }),
        );
        return await tx.save(RestaurantPageOrderEntity, rows);
      });
    } catch (err) {
      logger.error(`Error while replacing page order for restaurant: ${restaurantID}. - ${err.stack || err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while replacing page order for restaurant: ${restaurantID}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default PageOrderModel;
