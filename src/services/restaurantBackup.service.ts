import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { RestaurantBackupServiceInterface, RestaurantsModelInterface } from '@/interfaces/restaurants.interface';
import { logger } from '@utils/logger';
import { RestaurantEntity } from '@entities/restaurant.entity';
import { MenusServiceInterface } from '@interfaces/menus.interface';
import { FileGenerationType } from '@enums/fileGenerationType';
import { MenuEntity } from '@entities/menus.entity';

class RestaurantBackupService implements RestaurantBackupServiceInterface {
  private menusService: MenusServiceInterface;
  private restaurantsModel: RestaurantsModelInterface;

  constructor(menusService: MenusServiceInterface, restaurantsModel: RestaurantsModelInterface) {
    this.menusService = menusService;
    this.restaurantsModel = restaurantsModel;
  }

  generateRestaurantBackups = async (): Promise<void> => {
    try {
      // get restaurants non deleted that contain menus
      const restaurants: RestaurantEntity[] = await this.restaurantsModel.getRestaurantsForBackup();

      const restaurantsToBackup = restaurants.filter((restaurant: RestaurantEntity) => restaurant?.menus && restaurant?.menus?.length > 0);

      // Generate files for each menu in each restaurant
      for (const restaurant of restaurantsToBackup) {
        const menuPromises = restaurant.menus.map(async (menu: MenuEntity) => {
          const filename = `backup/${restaurant.name.replace(/[^\w]+/g, '_').toLowerCase()}_${restaurant.restaurant_url_id.toLowerCase()}/${
            menu.menu_id
          }`;
          try {
            await this.menusService.generateFile(FileGenerationType.PDF, menu.menu_id, filename);
          } catch (err) {
            logger.error(
              `Couldn't generate PDF Menu ${menu.menu_id} for restaurant name ${restaurant.name} with urlId ${restaurant.restaurant_url_id} - ${
                err?.stack ?? err
              }`,
            );
          }
        });

        // generate for each menu
        await Promise.all(menuPromises);
      }
    } catch (err) {
      logger.error(`Error occurred while generating a backup for restaurants - ${err?.stack ?? err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while generating a backup for restaurants. Refer to the logs for more detail.`,
        ),
      );
    }
  };
}

export default RestaurantBackupService;
