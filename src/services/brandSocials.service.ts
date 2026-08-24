import { BrandSocialsEntity } from '@/entities/brandSocials.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import {
  BrandSocialsDBInterface,
  BrandSocialsInterface,
  BrandSocialsModelInterface,
  BrandSocialsServiceInterface,
} from '@/interfaces/brandSocials.interface';
import { ormConnection } from '@/utils/dbUtils';
import { logger } from '@/utils/logger';
import { EntityManager } from 'typeorm';

class BrandSocialsService implements BrandSocialsServiceInterface {
  private brandSocialsModel: BrandSocialsModelInterface;

  constructor(brandSocialsModel: BrandSocialsModelInterface) {
    this.brandSocialsModel = brandSocialsModel;
  }

  createBrandSocials = async (brandSocials: BrandSocialsInterface, repository?: EntityManager): Promise<BrandSocialsEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return await this.brandSocialsModel.insertBrandSocials(this.buildBrandSocialsInsert(brandSocials), repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while creating brand socials: ${JSON.stringify(brandSocials)}`);

      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while creating brand socials. Refer to logs for more info.`),
      );
    }
  };

  getBrandSocialsByBrandID = async (brandID: string, repository?: EntityManager): Promise<BrandSocialsInterface> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      return this.buildGetBrandSocials(await this.brandSocialsModel.getBrandSocialsByBrandID(brandID, repository));
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while getting brand socials for brandID ${brandID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error occurred while getting brand socials for brandID ${brandID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  updateBrandSocials = async (brandSocials: BrandSocialsInterface, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      await this.brandSocialsModel.updateBrandSocials(this.buildBrandSocialsUpdate(brandSocials), repository);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while updating brand socials for brand ${brandSocials.brandID}`);

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error occurred while updating brand socials for brand ${brandSocials.brandID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  buildGetBrandSocials = (brandSocials: BrandSocialsEntity): BrandSocialsInterface => {
    return {
      brandSocialsID: brandSocials?.brand_socials_id,
      brandID: brandSocials?.brandID,
      facebook: brandSocials?.facebook || '',
      instagram: brandSocials?.instagram || '',
      snapchat: brandSocials?.snapchat || '',
      tiktok: brandSocials?.tiktok || '',
      twitter: brandSocials?.twitter || '',
    };
  };

  buildBrandSocialsUpdate = (brandSocials: BrandSocialsInterface): BrandSocialsDBInterface => {
    const brandSocialsUpdate: BrandSocialsDBInterface = {};

    Object.keys(brandSocials).forEach(social => {
      if (social !== 'brandSocialsID' && social !== 'brandID') {
        brandSocialsUpdate[social] = brandSocials[social]?.length ? brandSocials[social] : null;
      } else if (social === 'brandSocialsID') {
        brandSocialsUpdate.brand_socials_id = brandSocials.brandSocialsID;
      } else if (social === 'brandID') {
        brandSocialsUpdate.brand_id = brandSocials.brandID;
      }
    });

    return brandSocialsUpdate;
  };

  buildBrandSocialsInsert = (brandSocials: BrandSocialsInterface): BrandSocialsDBInterface => {
    return {
      brand_id: brandSocials.brandID,
      facebook: brandSocials.facebook || null,
      instagram: brandSocials.instagram || null,
      snapchat: brandSocials.snapchat || null,
      tiktok: brandSocials.tiktok || null,
      twitter: brandSocials.twitter || null,
    };
  };
}

export default BrandSocialsService;
