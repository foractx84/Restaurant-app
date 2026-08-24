import {
  DietaryRestrictionsModelInterface,
  DietaryRestrictionsServiceInterface,
  DietaryRestrictionsInterface,
} from '@interfaces/dietaryRestrictions.interface';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import { DietaryRestrictionEntity } from '@/entities/dietaryRestriction.entity';

class DietaryRestrictionsService implements DietaryRestrictionsServiceInterface {
  private dietaryRestrictionsModel: DietaryRestrictionsModelInterface;

  constructor(dietaryRestrictionsModel: DietaryRestrictionsModelInterface) {
    this.dietaryRestrictionsModel = dietaryRestrictionsModel;
  }

  validateDietaryRestrictions = async (restrictionIDs: number[]): Promise<void> => {
    if (restrictionIDs?.length > 0) {
      const restrictions = await this.dietaryRestrictionsModel.findDietaryRestrictionsByIDs(restrictionIDs);

      const existingIDs = restrictions.map(restriction => restriction.restriction_id);

      for (const id of restrictionIDs) {
        if (!existingIDs.includes(id)) {
          throw new HttpException(
            400,
            getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Provided restriction with id ${id} does not exist.`),
          );
        }
      }
    }
  };

  getAllRestrictions = async (): Promise<DietaryRestrictionsInterface[]> => {
    try {
      return this.buildGetAllRestrictionsResponse(await this.dietaryRestrictionsModel.getAllRestrictions());
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while getting dietary restrictions - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting dietary restrictions. Refer to the logs for more detail.`),
        );
      }
    }
  };

  buildGetAllRestrictionsResponse = (dietaryRestrictions: DietaryRestrictionEntity[]): DietaryRestrictionsInterface[] => {
    return dietaryRestrictions.map(entity => {
      return {
        restrictionID: entity.restriction_id,
        name: entity.name,
      };
    });
  };
}

export default DietaryRestrictionsService;
