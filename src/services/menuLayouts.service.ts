import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { MenuLayoutServiceInterface, MenuLayoutModelInterface, MenuLayoutInterface } from '@interfaces/menuLayout.interface';
import { RestaurantMenuLayoutEntity } from '@/entities/restaurantMenuLayout.entity';
import { MenuLayoutEntity } from '@/entities/menuLayout.entity';

class MenuLayoutsService implements MenuLayoutServiceInterface {
  private menuLayoutModel: MenuLayoutModelInterface;

  constructor(menuLayoutModel: MenuLayoutModelInterface) {
    this.menuLayoutModel = menuLayoutModel;
  }

  getAllMenuLayouts = async (): Promise<MenuLayoutInterface[]> => {
    try {
      return this.buildGetAllMenuLayoutsResponse(await this.menuLayoutModel.getAllMenuLayouts());
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while getting all menu layouts - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting all menu layouts. Refer to the logs for more detail.`),
        );
      }
    }
  };

  updateRestaurantMenuLayout = async (layoutID: number, restaurantID: number): Promise<void> => {
    try {
      // call getAllMenuLayouts to check if layoutID is valid
      const allMenuLayouts: MenuLayoutInterface[] = await this.getAllMenuLayouts();

      if (!allMenuLayouts?.map(layout => layout.layoutID).includes(layoutID)) {
        logger.error(`404 No Content: "Provided menu layoutID ${layoutID} doesnt exist."`);
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `404 No Content: "Provided menu layoutID ${layoutID} doesnt exist."`),
        );
      }

      const currentRestaurantMenuLayout: RestaurantMenuLayoutEntity = await this.menuLayoutModel.getMenuLayoutByRestaurantID(restaurantID);
      const currentMenuLayoutID: number = currentRestaurantMenuLayout.menu_layout_id;
      //avoid unnecesary writes to db if same id as before
      if (layoutID === currentMenuLayoutID) return;

      await this.menuLayoutModel.updateMenuLayoutOfRestaurant(layoutID, restaurantID);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while updating restaurant menu layout ${layoutID} for restaurantID ${restaurantID}: - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while updating restaurant menu layout ${layoutID} for restaurantID ${restaurantID}. Refer to the logs for more detail`,
          ),
        );
      }
    }
  };

  buildGetAllMenuLayoutsResponse = (layouts: MenuLayoutEntity[]): MenuLayoutInterface[] => {
    return layouts.map(entity => {
      return {
        layoutID: entity.menu_layout_id,
        name: entity.layout,
      };
    });
  };
}

export default MenuLayoutsService;
