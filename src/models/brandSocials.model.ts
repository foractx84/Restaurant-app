import { BrandSocialsEntity } from '@entities/brandSocials.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { BrandSocialsDBInterface, BrandSocialsModelInterface } from '@interfaces/brandSocials.interface';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';

class BrandSocialsModel implements BrandSocialsModelInterface {
  getBrandSocialsByBrandID = async (brandID: string, repository?: EntityManager): Promise<BrandSocialsEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await repository.findOne(BrandSocialsEntity, {
        brandID,
      });
    } catch (err) {
      logger.error(`Error occurred while getting brand socials for brandID ${brandID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting brand socials for brandID ${brandID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  insertBrandSocials = async (brandSocials: BrandSocialsDBInterface, repository?: EntityManager): Promise<BrandSocialsEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const brandSocialsEntity = repository.create(BrandSocialsEntity, {
        brandID: brandSocials.brand_id,
        facebook: brandSocials.facebook,
        instagram: brandSocials.instagram,
        tiktok: brandSocials.tiktok,
        twitter: brandSocials.twitter,
        snapchat: brandSocials.snapchat,
      });

      return await repository.save(BrandSocialsEntity, brandSocialsEntity);
    } catch (err) {
      logger.error(`Error occurred while saving brand social links for brand socials ${JSON.stringify(brandSocials)} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while saving brand social links for brand socials ${JSON.stringify(brandSocials)}. Refer to logs for more info.`,
        ),
      );
    }
  };

  updateBrandSocials = async (brandSocials: BrandSocialsDBInterface, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const patch: Partial<BrandSocialsEntity> = {};

      if (brandSocials.brand_id) {
        patch.brandID = brandSocials.brand_id;
      }

      if (brandSocials.facebook !== undefined) {
        patch.facebook = brandSocials.facebook;
      }

      if (brandSocials.instagram !== undefined) {
        patch.instagram = brandSocials.instagram;
      }

      if (brandSocials.tiktok !== undefined) {
        patch.tiktok = brandSocials.tiktok;
      }

      if (brandSocials.twitter !== undefined) {
        patch.twitter = brandSocials.twitter;
      }

      if (brandSocials.snapchat !== undefined) {
        patch.snapchat = brandSocials.snapchat;
      }

      await repository.update(BrandSocialsEntity, brandSocials.brand_socials_id, patch);
    } catch (err) {
      logger.error(`Error occurred while updating brand social links for brand socials ${JSON.stringify(brandSocials)} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while updating brand social links for brand socials ${JSON.stringify(brandSocials)}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default BrandSocialsModel;
