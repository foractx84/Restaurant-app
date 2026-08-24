import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { BrandEntity } from '@entities/brand.entity';

class BrandsModel {
  getBrandsByRestaurantGroupID = async (restaurantGroupID: string, repository?: EntityManager): Promise<BrandEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository.find(BrandEntity, {
        where: {
          restaurantGroupID,
        },
        order: {
          name: 'ASC',
        },
      });
    } catch (err) {
      logger.warn(`Error occurred while getting brands for restaurant group ${restaurantGroupID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting brands for restaurant group. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  getBrandByID = async (brandID: string, repository?: EntityManager): Promise<BrandEntity | undefined> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository.findOne(
        BrandEntity,
        {
          id: brandID,
        },
        {
          relations: ['cuisine', 'socials'],
        },
      );
    } catch (err) {
      logger.warn(`Error occurred while getting brand by id: ${brandID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while getting brand by id: ${brandID}. Refer to the logs for more detail.`),
      );
    }
  };

  createBrand = async (brand: BrandEntity, repository?: EntityManager): Promise<BrandEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository.save(BrandEntity, brand);
    } catch (err) {
      logger.warn(`Error occurred while creating brand - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while creating brand. Refer to the logs for more detail.`),
      );
    }
  };

  updateBrand = async (brandID: string, patch: Partial<BrandEntity>, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await repository.update(BrandEntity, brandID, patch);
    } catch (err) {
      logger.warn(`Error occurred while updating brand ${brandID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error occurred while updating brand ${brandID}. Refer to the logs for more detail.`),
      );
    }
  };
}

export default BrandsModel;
