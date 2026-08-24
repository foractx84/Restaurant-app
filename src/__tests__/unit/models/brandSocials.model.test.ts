import { EntityManager } from 'typeorm';
import BrandSocialsModel from '@/models/brandSocials.model';
import { BrandSocialsEntity } from '@/entities/brandSocials.entity';
import { ormConnection } from '@/utils/dbUtils';

jest.mock('@/utils/dbUtils', () => ({
  __esModule: true,
  ormConnection: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const brandSocialsModel = new BrandSocialsModel();

describe('BrandSocialsModel', () => {
  const BRAND_ID = '11111111-1111-4111-8111-111111111111';

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getBrandSocialsByBrandID', () => {
    it('should get brand socials using provided repository', async () => {
      const brandSocials = {
        brand_socials_id: 1,
        brandID: BRAND_ID,
        facebook: 'https://facebook.com/test',
        instagram: 'https://instagram.com/test',
      } as BrandSocialsEntity;

      const repository = {
        findOne: jest.fn().mockResolvedValueOnce(brandSocials),
      } as unknown as EntityManager;

      const result = await brandSocialsModel.getBrandSocialsByBrandID(BRAND_ID, repository);

      expect(repository.findOne).toHaveBeenCalledWith(BrandSocialsEntity, {
        brandID: BRAND_ID,
      });

      expect(ormConnection).not.toHaveBeenCalled();
      expect(result).toEqual(brandSocials);
    });

    it('should get orm connection when repository is not provided', async () => {
      const brandSocials = {
        brand_socials_id: 1,
        brandID: BRAND_ID,
      } as BrandSocialsEntity;

      const repository = {
        findOne: jest.fn().mockResolvedValueOnce(brandSocials),
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(repository);

      const result = await brandSocialsModel.getBrandSocialsByBrandID(BRAND_ID);

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(repository.findOne).toHaveBeenCalledWith(BrandSocialsEntity, {
        brandID: BRAND_ID,
      });

      expect(result).toEqual(brandSocials);
    });

    it('should return undefined when brand socials do not exist', async () => {
      const repository = {
        findOne: jest.fn().mockResolvedValueOnce(undefined),
      } as unknown as EntityManager;

      const result = await brandSocialsModel.getBrandSocialsByBrandID(BRAND_ID, repository);

      expect(result).toBeUndefined();
    });

    it('should throw 500 when database lookup fails', async () => {
      const repository = {
        findOne: jest.fn().mockRejectedValueOnce(new Error('database failure')),
      } as unknown as EntityManager;

      await expect(brandSocialsModel.getBrandSocialsByBrandID(BRAND_ID, repository)).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('insertBrandSocials', () => {
    it('should map database fields to entity fields and insert brand socials', async () => {
      const brandSocials = {
        brand_id: BRAND_ID,
        facebook: 'https://facebook.com/test',
        instagram: 'https://instagram.com/test',
        tiktok: 'https://tiktok.com/@test',
        twitter: 'https://twitter.com/test',
        snapchat: 'https://snapchat.com/add/test',
      };

      const brandSocialsEntity = {
        brandID: BRAND_ID,
        facebook: brandSocials.facebook,
        instagram: brandSocials.instagram,
        tiktok: brandSocials.tiktok,
        twitter: brandSocials.twitter,
        snapchat: brandSocials.snapchat,
      } as BrandSocialsEntity;

      const savedEntity = {
        ...brandSocialsEntity,
        brand_socials_id: 1,
      } as BrandSocialsEntity;

      const repository = {
        create: jest.fn().mockReturnValueOnce(brandSocialsEntity),
        save: jest.fn().mockResolvedValueOnce(savedEntity),
      } as unknown as EntityManager;

      const result = await brandSocialsModel.insertBrandSocials(brandSocials, repository);

      expect(repository.create).toHaveBeenCalledWith(BrandSocialsEntity, {
        brandID: BRAND_ID,
        facebook: brandSocials.facebook,
        instagram: brandSocials.instagram,
        tiktok: brandSocials.tiktok,
        twitter: brandSocials.twitter,
        snapchat: brandSocials.snapchat,
      });

      expect(repository.save).toHaveBeenCalledWith(BrandSocialsEntity, brandSocialsEntity);

      expect(ormConnection).not.toHaveBeenCalled();
      expect(result).toEqual(savedEntity);
    });

    it('should get orm connection when repository is not provided', async () => {
      const brandSocials = {
        brand_id: BRAND_ID,
        facebook: 'https://facebook.com/test',
      };

      const brandSocialsEntity = {
        brandID: BRAND_ID,
        facebook: brandSocials.facebook,
      } as BrandSocialsEntity;

      const repository = {
        create: jest.fn().mockReturnValueOnce(brandSocialsEntity),
        save: jest.fn().mockResolvedValueOnce(brandSocialsEntity),
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(repository);

      await brandSocialsModel.insertBrandSocials(brandSocials);

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(repository.create).toHaveBeenCalledWith(
        BrandSocialsEntity,
        expect.objectContaining({
          brandID: BRAND_ID,
          facebook: brandSocials.facebook,
        }),
      );

      expect(repository.save).toHaveBeenCalledWith(BrandSocialsEntity, brandSocialsEntity);
    });

    it('should throw 500 when insert fails', async () => {
      const brandSocials = {
        brand_id: BRAND_ID,
        facebook: 'https://facebook.com/test',
      };

      const brandSocialsEntity = {
        brandID: BRAND_ID,
        facebook: brandSocials.facebook,
      } as BrandSocialsEntity;

      const repository = {
        create: jest.fn().mockReturnValueOnce(brandSocialsEntity),
        save: jest.fn().mockRejectedValueOnce(new Error('database failure')),
      } as unknown as EntityManager;

      await expect(brandSocialsModel.insertBrandSocials(brandSocials, repository)).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('updateBrandSocials', () => {
    it('should update brand socials with mapped entity fields', async () => {
      const brandSocials = {
        brand_socials_id: 10,
        brand_id: BRAND_ID,
        facebook: 'https://facebook.com/updated',
        instagram: 'https://instagram.com/updated',
        tiktok: null,
        twitter: null,
        snapchat: null,
      };

      const repository = {
        update: jest.fn().mockResolvedValueOnce(undefined),
      } as unknown as EntityManager;

      await brandSocialsModel.updateBrandSocials(brandSocials, repository);

      expect(repository.update).toHaveBeenCalledWith(BrandSocialsEntity, 10, {
        brandID: BRAND_ID,
        facebook: 'https://facebook.com/updated',
        instagram: 'https://instagram.com/updated',
        tiktok: null,
        twitter: null,
        snapchat: null,
      });

      expect(ormConnection).not.toHaveBeenCalled();
    });

    it('should update only supplied social fields', async () => {
      const brandSocials = {
        brand_socials_id: 10,
        facebook: 'https://facebook.com/updated',
      };

      const repository = {
        update: jest.fn().mockResolvedValueOnce(undefined),
      } as unknown as EntityManager;

      await brandSocialsModel.updateBrandSocials(brandSocials, repository);

      expect(repository.update).toHaveBeenCalledWith(BrandSocialsEntity, 10, {
        facebook: 'https://facebook.com/updated',
      });
    });

    it('should get orm connection when repository is not provided', async () => {
      const brandSocials = {
        brand_socials_id: 10,
        brand_id: BRAND_ID,
        facebook: 'https://facebook.com/updated',
      };

      const repository = {
        update: jest.fn().mockResolvedValueOnce(undefined),
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(repository);

      await brandSocialsModel.updateBrandSocials(brandSocials);

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(repository.update).toHaveBeenCalledWith(BrandSocialsEntity, 10, {
        brandID: BRAND_ID,
        facebook: 'https://facebook.com/updated',
      });
    });

    it('should throw 500 when update fails', async () => {
      const brandSocials = {
        brand_socials_id: 10,
        brand_id: BRAND_ID,
        facebook: 'https://facebook.com/updated',
      };

      const repository = {
        update: jest.fn().mockRejectedValueOnce(new Error('database failure')),
      } as unknown as EntityManager;

      await expect(brandSocialsModel.updateBrandSocials(brandSocials, repository)).rejects.toMatchObject({
        status: 500,
      });
    });
  });
});
