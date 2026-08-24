import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import { BrandEntity } from '@entities/brand.entity';
import { RestaurantEntity } from '@entities/restaurant.entity';
import { ormConnection } from '@utils/dbUtils';
import BrandsModel from '@models/brands.model';
import RestaurantsModel from '@models/restaurants.model';
import RestaurantGroupsService from '@services/restaurantGroups.service';
import { CreateBrandDto, EditBrandDto } from '@dtos/brand.dto';
import { BrandSocialsServiceInterface } from '@interfaces/brandSocials.interface';

class BrandsService {
  private brandsModel: BrandsModel;
  private restaurantGroupsService: RestaurantGroupsService;
  private restaurantsModel: RestaurantsModel;
  private brandSocialsService: BrandSocialsServiceInterface;

  constructor(
    brandsModel: BrandsModel,
    restaurantGroupsService: RestaurantGroupsService,
    restaurantsModel: RestaurantsModel,
    brandSocialsService: BrandSocialsServiceInterface,
  ) {
    this.brandsModel = brandsModel;
    this.restaurantGroupsService = restaurantGroupsService;
    this.restaurantsModel = restaurantsModel;
    this.brandSocialsService = brandSocialsService;
  }

  getBrandsByRestaurantGroupID = async (restaurantGroupID: string): Promise<BrandEntity[]> => {
    try {
      await this.restaurantGroupsService.getRestaurantGroupByID(restaurantGroupID);

      return await this.brandsModel.getBrandsByRestaurantGroupID(restaurantGroupID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while getting brands for restaurant group ${restaurantGroupID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error occurred while getting brands for restaurant group. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  getBrandByID = async (brandID: string): Promise<BrandEntity> => {
    try {
      const brand = await this.brandsModel.getBrandByID(brandID);

      if (!brand) {
        logger.error(`Brand ${brandID} does not exist.`);

        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Brand ${brandID} does not exist.`));
      }

      return brand;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while getting brand by id ${brandID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting brand by id: ${brandID}. Refer to logs for more info.`),
      );
    }
  };

  createBrand = async (restaurantGroupID: string, brandRequest: CreateBrandDto): Promise<BrandEntity> => {
    try {
      await this.restaurantGroupsService.getRestaurantGroupByID(restaurantGroupID);

      const repository = await ormConnection();

      return await repository.transaction(async manager => {
        const brand = new BrandEntity(restaurantGroupID, brandRequest.name);

        brand.description = brandRequest.description;
        brand.website = brandRequest.website;
        brand.primaryTagline = brandRequest.primaryTagline;
        brand.secondaryTagline = brandRequest.secondaryTagline;
        brand.reservationUrl = brandRequest.reservationUrl;
        brand.orderingUrl = brandRequest.orderingUrl;
        brand.cuisineID = brandRequest.cuisineID;

        const createdBrand = await this.brandsModel.createBrand(brand, manager);

        if (brandRequest.socials && Object.values(brandRequest.socials).some(value => value?.trim()?.length)) {
          await this.brandSocialsService.createBrandSocials(
            {
              brandID: createdBrand.id,
              ...brandRequest.socials,
            },
            manager,
          );
        }

        return createdBrand;
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while creating brand - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while creating brand. Refer to the logs for more detail.`),
      );
    }
  };

  updateBrand = async (brandID: string, brandRequest: EditBrandDto): Promise<void> => {
    try {
      await this.getBrandByID(brandID);

      const repository = await ormConnection();

      await repository.transaction(async manager => {
        const patch: Partial<BrandEntity> = {};

        if (typeof brandRequest.name === 'string') {
          patch.name = brandRequest.name;
        }

        if (typeof brandRequest.description === 'string') {
          patch.description = brandRequest.description;
        }

        if (typeof brandRequest.website === 'string') {
          patch.website = brandRequest.website;
        }

        if (typeof brandRequest.primaryTagline === 'string') {
          patch.primaryTagline = brandRequest.primaryTagline;
        }

        if (typeof brandRequest.secondaryTagline === 'string') {
          patch.secondaryTagline = brandRequest.secondaryTagline;
        }

        if (typeof brandRequest.reservationUrl === 'string') {
          patch.reservationUrl = brandRequest.reservationUrl;
        }

        if (typeof brandRequest.orderingUrl === 'string') {
          patch.orderingUrl = brandRequest.orderingUrl;
        }

        if (typeof brandRequest.cuisineID === 'number') {
          patch.cuisineID = brandRequest.cuisineID;
        }

        if (Object.keys(patch).length) {
          await this.brandsModel.updateBrand(brandID, patch, manager);
        }

        if (brandRequest.socials) {
          const existingSocials = await this.brandSocialsService.getBrandSocialsByBrandID(brandID, manager);

          if (existingSocials?.brandSocialsID) {
            await this.brandSocialsService.updateBrandSocials(
              {
                ...brandRequest.socials,
                brandID,
                brandSocialsID: existingSocials.brandSocialsID,
              },
              manager,
            );
          } else if (Object.values(brandRequest.socials).some(value => value?.trim()?.length)) {
            await this.brandSocialsService.createBrandSocials(
              {
                brandID,
                ...brandRequest.socials,
              },
              manager,
            );
          }
        }
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while updating brand ${brandID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while updating brand ${brandID}. Refer to the logs for more detail.`),
      );
    }
  };

  updateBrandLogo = async (brandID: string, logoUrl: string): Promise<string | undefined> => {
    try {
      const brand = await this.getBrandByID(brandID);

      const previousLogoUrl = brand.logoUrl;

      await this.brandsModel.updateBrand(brandID, {
        logoUrl,
      });

      return previousLogoUrl;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while updating logo for brand ${brandID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error occurred while updating logo for brand ${brandID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  getRestaurantsByBrandID = async (brandID: string): Promise<RestaurantEntity[]> => {
    try {
      await this.getBrandByID(brandID);

      return await this.restaurantsModel.getRestaurantsByBrandID(brandID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while getting restaurants for brand ${brandID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting restaurants for brand. Refer to the logs for more detail.`),
      );
    }
  };

  assignRestaurantToBrand = async (restaurantID: number, brandID: string): Promise<void> => {
    try {
      // Make sure the Brand exists.
      await this.getBrandByID(brandID);

      // Make sure the Restaurant exists.
      const restaurant = await this.restaurantsModel.getRestaurantEntityByID(restaurantID);

      if (!restaurant) {
        logger.error(`Restaurant ${restaurantID} does not exist.`);

        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant ${restaurantID} does not exist.`));
      }

      // Assign the Restaurant/Location to the Brand.
      await this.restaurantsModel.updateRestaurantEntity(
        {
          brand_id: brandID,
        },
        restaurantID,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while assigning restaurant ${restaurantID} to brand ${brandID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while assigning restaurant to brand. Refer to the logs for more detail.`),
      );
    }
  };
  updateRestaurantOrder = async (brandID: string, restaurantIDs: number[]): Promise<void> => {
    try {
      const repository = await ormConnection();

      await repository.transaction(async manager => {
        await this.getBrandByID(brandID);

        const restaurants = await this.restaurantsModel.getRestaurantsByBrandID(brandID, manager);

        if (restaurantIDs.length !== restaurants.length) {
          throw new HttpException(
            400,
            getErrorPayload(
              InternalErrorCode.inputValueNotInDB,
              `All restaurants for brand ${brandID} must be included when updating restaurant order.`,
            ),
          );
        }

        const brandRestaurantIDs = new Set(restaurants.map(restaurant => restaurant.restaurant_id));

        for (const restaurantID of restaurantIDs) {
          if (!brandRestaurantIDs.has(restaurantID)) {
            throw new HttpException(
              400,
              getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant ${restaurantID} does not belong to brand ${brandID}.`),
            );
          }
        }

        for (let index = 0; index < restaurantIDs.length; index++) {
          await this.restaurantsModel.updateRestaurantListOrder(restaurantIDs[index], index, manager);
        }
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while updating restaurant order for brand ${brandID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while updating restaurant order. Refer to the logs for more detail.`),
      );
    }
  };
}

export default BrandsService;
