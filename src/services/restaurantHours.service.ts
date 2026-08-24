import { RestaurantHoursEntity } from '@/entities/restaurantHours.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { CreateHoursInterface } from '@/interfaces/militaryHours.interface';
import { RestaurantHoursDBInterface, RestaurantHoursModelInterface, RestaurantHoursServiceInterface } from '@/interfaces/restaurantHours.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class RestaurantHoursService implements RestaurantHoursServiceInterface {
  private restaurantHoursModel: RestaurantHoursModelInterface;

  constructor(restaurantHoursModel: RestaurantHoursModelInterface) {
    this.restaurantHoursModel = restaurantHoursModel;
  }

  createRestaurantHours = async (
    restaurantHours: CreateHoursInterface[],
    restaurantID: number,
    repository?: EntityManager,
  ): Promise<RestaurantHoursEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await this.restaurantHoursModel.insertRestaurantHours(this.buildRestaurantHoursInsert(restaurantHours, restaurantID), repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating restaurant hours for restaurant: ${JSON.stringify(restaurantHours)} - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating restaurant hours for restaurant: ${JSON.stringify(restaurantHours)}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  removeRestaurantHours = async (restaurantID: number, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await this.restaurantHoursModel.deleteRestaurantHours(restaurantID, repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while removing restaurant hours for restaurantID ${JSON.stringify(restaurantID)} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while removing restaurant hours for restaurantID ${JSON.stringify(restaurantID)}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  buildCreateRestaurantHoursResponse = (restaurantHoursEntities: RestaurantHoursEntity[]): CreateHoursInterface[] => {
    const resultMap: Map<string, CreateHoursInterface> = new Map();
    restaurantHoursEntities.forEach(({ start, end, day }) => {
      const key = `${start}-${end}`;
      if (!resultMap.has(key)) {
        resultMap.set(key, {
          day: [day],
          start,
          end,
        });
      } else {
        resultMap.get(key)?.day.push(day);
      }
    });
    const result: CreateHoursInterface[] = Array.from(resultMap.values());
    // Sort days alphabetically within each entry
    result.forEach(entry => {
      entry.day.sort((a, b) => a.localeCompare(b));
    });
    return result;
  };

  buildRestaurantHoursInsert = (restaurantHours: CreateHoursInterface[], restaurantID: number): RestaurantHoursDBInterface[] => {
    return restaurantHours
      ?.map(hours => {
        return hours?.day?.map(day => ({
          restaurant_id: restaurantID,
          day,
          start: hours?.start,
          end: hours?.end,
        }));
      })
      .reduce((acc, curr) => [...acc, ...curr], []); // need to flatten result
  };
}

export default RestaurantHoursService;
