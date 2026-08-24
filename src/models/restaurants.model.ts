import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { RestaurantsDBInterface, RestaurantsModelInterface } from '@interfaces/restaurants.interface';
import { logger } from '@utils/logger';
import { ormConnection, rawQuery } from '@utils/dbUtils';
import { EntityManager } from 'typeorm';
import { RestaurantEntity } from '@entities/restaurant.entity';
import { classToPlain } from 'class-transformer';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';

class RestaurantsModel implements RestaurantsModelInterface {
  getRestaurantByID = async (restaurantID: number): Promise<RestaurantsDBInterface> => {
    try {
      const restaurantQuery = `SELECT restaurant_id AS "restaurantID" FROM restaurants WHERE restaurant_id = :restaurantID;`;
      const result = await rawQuery<RestaurantsDBInterface[]>(restaurantQuery, { restaurantID });
      return result[0];
    } catch (err) {
      logger.warn(`Error occurred while fetching restaurant by ID for restaurantID: ${restaurantID} - ` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while fetching restaurant by ID'));
    }
  };

  getRestaurantsByBrandID = async (brandID: string, repository?: EntityManager): Promise<RestaurantEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository.find(RestaurantEntity, {
        where: {
          brand_id: brandID,
          deleted: false,
        },
        order: {
          list_order: 'ASC',
          name: 'ASC',
        },
      });
    } catch (err) {
      logger.error(`Error occurred while fetching restaurants by brand ID: ${brandID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching restaurants by brand ID: ${brandID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  getRestaurantByNameAndAddress = async (
    name: string,
    address1: string,
    city: string,
    governingDistrict: string,
    countryID: number,
    postalCode: string,
    repository?: EntityManager,
  ): Promise<any> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const query = repository
        .getRepository(RestaurantEntity)
        .createQueryBuilder('restaurants')
        .leftJoinAndSelect('restaurants.restaurant_address', 'address')
        .where('address.address1 = :address1 AND address.country_id = :countryID', {
          address1,
          countryID,
        })
        .andWhere('name LIKE :name', { name })
        .andWhere('deleted = :deleted', { deleted: false });

      if (city) {
        query.andWhere('address.city = :city', { city });
      } else {
        query.andWhere('address.city IS NULL');
      }

      if (governingDistrict) {
        query.andWhere('address.governing_district = :governingDistrict', { governingDistrict });
      } else {
        query.andWhere('address.governing_district IS NULL');
      }

      if (postalCode) {
        query.andWhere('address.postal_code = :postalCode', { postalCode });
      } else {
        query.andWhere('address.postal_code IS NULL');
      }

      return await query.getOne();
    } catch (err) {
      logger.error(`Error occurred while fetching restaurant by name ${name} and address ${address1} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching restaurant by name ${name} and address ${address1}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  getRestaurantEntityByID = async (restaurantID: number): Promise<RestaurantEntity> => {
    const ormConn: EntityManager = await ormConnection();
    return await ormConn.findOne(RestaurantEntity, restaurantID, { relations: ['menus'] });
  };

  getRestaurantEntityByIDAndLocationID = async (restaurantID: number, locationID: number, manager?: EntityManager): Promise<RestaurantEntity> => {
    try {
      if (!manager) {
        manager = await ormConnection();
      }
      return await manager.findOne<RestaurantEntity>(RestaurantEntity, {
        where: {
          restaurant_id: restaurantID,
          location_id: locationID,
          deleted: false,
        },
        relations: ['menus'],
      });
    } catch (err) {
      logger.error(`Error occurred while fetching restaurants by restaurantID: ${restaurantID} and locationID: ${locationID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching restaurants by restaurantID: ${restaurantID} and locationID: ${locationID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  getRestaurantEntityWithModifiersByID = async (restaurantID: number, manager?: EntityManager): Promise<RestaurantEntity> => {
    if (!manager) {
      manager = await ormConnection();
    }

    return await manager
      .getRepository(RestaurantEntity)
      .createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.modifierGroups', 'modifierGroups', 'modifierGroups.deletedAt IS NULL')
      .where('restaurant.restaurant_id = :restaurantID', { restaurantID })
      .getOne();
  };

  // Operating hours + the address that carries the timezone -- the two relations needed to answer
  // Otter's `storefront.get_store_hours` event. `getRestaurantEntityByID` only loads `menus`.
  getRestaurantEntityWithHoursAndAddressByID = async (restaurantID: number, manager?: EntityManager): Promise<RestaurantEntity> => {
    if (!manager) {
      manager = await ormConnection();
    }

    return await manager
      .getRepository(RestaurantEntity)
      .createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.hours', 'hours')
      .leftJoinAndSelect('restaurant.restaurant_address', 'restaurant_address')
      .where('restaurant.restaurant_id = :restaurantID', { restaurantID })
      .getOne();
  };

  getRestaurantDetailsEntityByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<RestaurantEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository
        .getRepository(RestaurantEntity)
        .createQueryBuilder('restaurants')
        .where('restaurants.deleted = :deleted', { deleted: false })
        .andWhere('restaurants.restaurant_id = :restaurantID', { restaurantID })
        .leftJoinAndSelect('restaurants.cuisine_id', 'cuisine')
        .leftJoinAndSelect('restaurants.restaurant_address', 'address')
        .leftJoinAndSelect('address.country_id', 'country')
        .leftJoinAndSelect('restaurants.images', 'images', 'images.deleted IS NULL OR images.deleted = false')
        .leftJoinAndSelect('images.restaurant_image_type_id', 'imageType')
        .leftJoinAndSelect('restaurants.menus', 'menu', 'menu.deleted IS NULL OR menu.deleted = false')
        .leftJoinAndSelect('menu.sections', 'menuSections', 'menuSections.deleted IS NULL OR menuSections.deleted = false')
        .leftJoinAndSelect('restaurants.restaurant_menu_layouts', 'restaurantMenuLayouts')
        .leftJoinAndSelect('restaurantMenuLayouts.menu_layout_id', 'menuLayout')
        .leftJoinAndSelect('restaurants.socials', 'socials')
        .leftJoinAndSelect('restaurants.hours', 'hours')
        .leftJoinAndSelect('restaurants.profilePages', 'pages', 'pages.deleted_at IS NULL')
        .leftJoinAndSelect('restaurants.restaurant_profile_albums', 'albums', 'albums.deleted_at IS NULL')
        .leftJoinAndSelect('albums.restaurant_profile_album_media', 'gallery', 'gallery.deleted_at IS NULL')
        .leftJoinAndSelect('gallery.media', 'media')
        .orderBy({
          'restaurants.name': 'ASC',
          'menu.list_order': 'ASC',
          'menuSections.list_order': 'ASC',
          'albums.list_order': 'ASC',
          'gallery.list_order': 'ASC',
        })
        .getOne();
    } catch (err) {
      logger.error(`Error occurred while fetching restaurant by restaurantID: ${restaurantID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching restaurant by restaurantID: ${restaurantID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  getRestaurantsForBackup = async (): Promise<RestaurantEntity[]> => {
    try {
      const repository = await ormConnection();
      return await repository
        .getRepository(RestaurantEntity)
        .createQueryBuilder('restaurants')
        .where('restaurants.deleted = :deleted', { deleted: false })
        .leftJoinAndSelect('restaurants.menus', 'menu', 'menu.deleted IS NULL OR menu.deleted = false')
        .getMany();
    } catch (err) {
      logger.error(`Error occurred while fetching restaurants for backup - ${err?.stack ?? err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while fetching restaurants for backup. Refer to the logs for more detail.`),
      );
    }
  };

  getRestaurantsEntityByManagerID = async (managerID: number, isSuper: boolean, repository?: EntityManager): Promise<RestaurantEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      let query;
      if (isSuper) {
        // if superuser will want to return all restaurants
        query = repository
          .getRepository(RestaurantEntity)
          .createQueryBuilder('restaurants')
          .where('restaurants.deleted = :deleted', { deleted: false });
      } else {
        query = repository
          .getRepository(RestaurantEntity)
          .createQueryBuilder('restaurants')
          .where('restaurants.deleted = :deleted', { deleted: false })
          .innerJoinAndSelect('restaurants.manager_restaurants', 'manager_restaurants', 'manager_restaurants.external_user_id = :managerID', {
            managerID,
          });
      }
      return await query.orderBy({ 'restaurants.name': 'ASC' }).getMany();
    } catch (err) {
      logger.error(`Error occurred while fetching restaurants by manager ID: ${managerID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while fetching restaurant by managerID. Refer to the logs for more detail.`),
      );
    }
  };

  insertRestaurantEntity = async (restaurant: RestaurantEntity, repository?: EntityManager): Promise<RestaurantEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = repository.getCustomRepository(PostgresQueriesRepository);
      const databaseResult = await customRepository.insert('restaurants', [restaurant]);
      return classToPlain(databaseResult.raw[0]) as RestaurantEntity;
    } catch (err) {
      logger.error(`Error occurred while inserting restaurant: ${JSON.stringify(restaurant)} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while inserting restaurant: ${JSON.stringify(restaurant)}. Refer to logs for more info.`,
        ),
      );
    }
  };

  updateRestaurantEntity = async (restaurant: Partial<RestaurantEntity>, restaurantID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await repository.update(RestaurantEntity, restaurantID, restaurant);
    } catch (err) {
      logger.error(`Error occurred while updating restaurant: ${restaurantID} with values: ${JSON.stringify(restaurant)} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while updating restaurant: ${restaurantID} with values: ${JSON.stringify(restaurant)}. Refer to logs for more info.`,
        ),
      );
    }
  };

  updateRestaurantListOrder = async (restaurantID: number, listOrder: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await repository.update(RestaurantEntity, restaurantID, {
        list_order: listOrder,
      });
    } catch (err) {
      logger.error(`Error occurred while updating list order for restaurant ${restaurantID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while updating restaurant list order. Refer to logs for more info.`),
      );
    }
  };
}

export default RestaurantsModel;
