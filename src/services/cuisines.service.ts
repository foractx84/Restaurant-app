import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import { CuisineInterface, CuisinesModelInterface, CuisinesServiceInterface } from '@interfaces/cuisines.interface';
import { CuisineEntity } from '@/entities/cuisine.entity';

class CuisinesService implements CuisinesServiceInterface {
  private cuisinesModel: CuisinesModelInterface;

  constructor(cuisinesModel: CuisinesModelInterface) {
    this.cuisinesModel = cuisinesModel;
  }

  getAllCuisines = async (): Promise<CuisineInterface[]> => {
    try {
      return this.buildCuisines(await this.cuisinesModel.getAllCuisines());
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting cuisines - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting cuisines. Refer to the logs for more detail.`),
        );
      }
    }
  };

  /**
   * Retrieves cuisine by ID and validates it exists
   * @param cuisineID id of cuisine
   * @throws 404 No Content if cuisine does not exist for provided id
   */
  checkIfCuisineExists = async (cuisineID: number): Promise<CuisineEntity> => {
    try {
      const cuisineExists = await this.cuisinesModel.getCuisineByID(cuisineID);
      if (!cuisineExists) {
        logger.error(`Cuisine ${cuisineID} does not exist.`);
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Cuisine ${cuisineID} does not exist.`));
      }
      return cuisineExists;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred getting cuisine by id ${cuisineID}.` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred getting cuisine by id: ${cuisineID}. Refer to logs for more info.`),
        );
      }
    }
  };

  buildCuisines = (cuisines: CuisineEntity[]): CuisineInterface[] => {
    return cuisines.map(cuisine => {
      return {
        cuisineID: cuisine.cuisine_id,
        name: cuisine.name,
      } as CuisineInterface;
    });
  };
}

export default CuisinesService;
