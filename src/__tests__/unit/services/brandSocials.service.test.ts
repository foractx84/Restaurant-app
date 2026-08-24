import BrandSocialsService from '@/services/brandSocials.service';
import BrandSocialsModel from '@/models/brandSocials.model';
import { BrandSocialsEntity } from '@/entities/brandSocials.entity';
import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@/exceptions/HttpException';

jest.mock('@/models/brandSocials.model', () => {
  const mockBrandSocialsModel = {
    getBrandSocialsByBrandID: jest.fn(),
    insertBrandSocials: jest.fn(),
    updateBrandSocials: jest.fn(),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockBrandSocialsModel),
  };
});

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

const mockBrandSocialsModel = new BrandSocialsModel();
const brandSocialsService = new BrandSocialsService(mockBrandSocialsModel);

describe('BrandSocialsService', () => {
  const BRAND_ID = '11111111-1111-4111-8111-111111111111';

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createBrandSocials', () => {
    it('should create brand socials using provided repository', async () => {
      const repository = {} as any;

      const request = {
        brandID: BRAND_ID,
        facebook: 'https://facebook.com/test',
        instagram: 'https://instagram.com/test',
        tiktok: 'https://tiktok.com/@test',
        twitter: 'https://twitter.com/test',
        snapchat: 'https://snapchat.com/add/test',
      };

      const savedEntity = {
        brand_socials_id: 1,
        brandID: BRAND_ID,
        facebook: request.facebook,
        instagram: request.instagram,
        tiktok: request.tiktok,
        twitter: request.twitter,
        snapchat: request.snapchat,
      } as BrandSocialsEntity;

      (mockBrandSocialsModel.insertBrandSocials as jest.MockedFunction<any>).mockResolvedValueOnce(savedEntity);

      const result = await brandSocialsService.createBrandSocials(request, repository);

      expect(mockBrandSocialsModel.insertBrandSocials).toHaveBeenCalledWith(
        {
          brand_id: BRAND_ID,
          facebook: request.facebook,
          instagram: request.instagram,
          snapchat: request.snapchat,
          tiktok: request.tiktok,
          twitter: request.twitter,
        },
        repository,
      );

      expect(ormConnection).not.toHaveBeenCalled();
      expect(result).toEqual(savedEntity);
    });

    it('should convert empty social values to null when creating', async () => {
      const repository = {} as any;

      const request = {
        brandID: BRAND_ID,
        facebook: '',
        instagram: '',
        tiktok: '',
        twitter: '',
        snapchat: '',
      };

      (mockBrandSocialsModel.insertBrandSocials as jest.MockedFunction<any>).mockResolvedValueOnce({});

      await brandSocialsService.createBrandSocials(request, repository);

      expect(mockBrandSocialsModel.insertBrandSocials).toHaveBeenCalledWith(
        {
          brand_id: BRAND_ID,
          facebook: null,
          instagram: null,
          snapchat: null,
          tiktok: null,
          twitter: null,
        },
        repository,
      );
    });

    it('should get orm connection when repository is not provided', async () => {
      const repository = {};

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(repository);

      (mockBrandSocialsModel.insertBrandSocials as jest.MockedFunction<any>).mockResolvedValueOnce({});

      await brandSocialsService.createBrandSocials({
        brandID: BRAND_ID,
        facebook: 'https://facebook.com/test',
      });

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(mockBrandSocialsModel.insertBrandSocials).toHaveBeenCalledWith(
        expect.objectContaining({
          brand_id: BRAND_ID,
          facebook: 'https://facebook.com/test',
        }),
        repository,
      );
    });

    it('should rethrow HttpException from model', async () => {
      const httpException = new HttpException(400, []);

      (mockBrandSocialsModel.insertBrandSocials as jest.MockedFunction<any>).mockRejectedValueOnce(httpException);

      await expect(
        brandSocialsService.createBrandSocials(
          {
            brandID: BRAND_ID,
            facebook: 'https://facebook.com/test',
          },
          {} as any,
        ),
      ).rejects.toBe(httpException);
    });

    it('should throw 500 when unexpected create error occurs', async () => {
      (mockBrandSocialsModel.insertBrandSocials as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('unexpected failure'));

      await expect(
        brandSocialsService.createBrandSocials(
          {
            brandID: BRAND_ID,
            facebook: 'https://facebook.com/test',
          },
          {} as any,
        ),
      ).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('getBrandSocialsByBrandID', () => {
    it('should return mapped brand socials', async () => {
      const repository = {} as any;

      const entity = {
        brand_socials_id: 5,
        brandID: BRAND_ID,
        facebook: 'https://facebook.com/test',
        instagram: 'https://instagram.com/test',
        tiktok: 'https://tiktok.com/@test',
        twitter: 'https://twitter.com/test',
        snapchat: 'https://snapchat.com/add/test',
      } as BrandSocialsEntity;

      (mockBrandSocialsModel.getBrandSocialsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce(entity);

      const result = await brandSocialsService.getBrandSocialsByBrandID(BRAND_ID, repository);

      expect(mockBrandSocialsModel.getBrandSocialsByBrandID).toHaveBeenCalledWith(BRAND_ID, repository);

      expect(result).toEqual({
        brandSocialsID: 5,
        brandID: BRAND_ID,
        facebook: 'https://facebook.com/test',
        instagram: 'https://instagram.com/test',
        snapchat: 'https://snapchat.com/add/test',
        tiktok: 'https://tiktok.com/@test',
        twitter: 'https://twitter.com/test',
      });
    });

    it('should return empty strings for missing social values', async () => {
      const repository = {} as any;

      const entity = {
        brand_socials_id: 5,
        brandID: BRAND_ID,
        facebook: null,
        instagram: null,
        tiktok: null,
        twitter: null,
        snapchat: null,
      } as unknown as BrandSocialsEntity;

      (mockBrandSocialsModel.getBrandSocialsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce(entity);

      const result = await brandSocialsService.getBrandSocialsByBrandID(BRAND_ID, repository);

      expect(result).toEqual({
        brandSocialsID: 5,
        brandID: BRAND_ID,
        facebook: '',
        instagram: '',
        snapchat: '',
        tiktok: '',
        twitter: '',
      });
    });

    it('should handle missing brand socials entity', async () => {
      const repository = {} as any;

      (mockBrandSocialsModel.getBrandSocialsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      const result = await brandSocialsService.getBrandSocialsByBrandID(BRAND_ID, repository);

      expect(result).toEqual({
        brandSocialsID: undefined,
        brandID: undefined,
        facebook: '',
        instagram: '',
        snapchat: '',
        tiktok: '',
        twitter: '',
      });
    });

    it('should get orm connection when repository is not provided', async () => {
      const repository = {};

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(repository);

      (mockBrandSocialsModel.getBrandSocialsByBrandID as jest.MockedFunction<any>).mockResolvedValueOnce({
        brand_socials_id: 1,
        brandID: BRAND_ID,
      });

      await brandSocialsService.getBrandSocialsByBrandID(BRAND_ID);

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(mockBrandSocialsModel.getBrandSocialsByBrandID).toHaveBeenCalledWith(BRAND_ID, repository);
    });

    it('should throw 500 when model lookup fails', async () => {
      (mockBrandSocialsModel.getBrandSocialsByBrandID as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('database failure'));

      await expect(brandSocialsService.getBrandSocialsByBrandID(BRAND_ID, {} as any)).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('updateBrandSocials', () => {
    it('should update brand socials using mapped database fields', async () => {
      const repository = {} as any;

      const request = {
        brandSocialsID: 10,
        brandID: BRAND_ID,
        facebook: 'https://facebook.com/updated',
        instagram: 'https://instagram.com/updated',
      };

      (mockBrandSocialsModel.updateBrandSocials as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await brandSocialsService.updateBrandSocials(request, repository);

      expect(mockBrandSocialsModel.updateBrandSocials).toHaveBeenCalledWith(
        {
          brand_socials_id: 10,
          brand_id: BRAND_ID,
          facebook: 'https://facebook.com/updated',
          instagram: 'https://instagram.com/updated',
        },
        repository,
      );
    });

    it('should convert empty social values to null when updating', async () => {
      const repository = {} as any;

      const request = {
        brandSocialsID: 10,
        brandID: BRAND_ID,
        facebook: '',
        instagram: '',
        tiktok: '',
      };

      (mockBrandSocialsModel.updateBrandSocials as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await brandSocialsService.updateBrandSocials(request, repository);

      expect(mockBrandSocialsModel.updateBrandSocials).toHaveBeenCalledWith(
        {
          brand_socials_id: 10,
          brand_id: BRAND_ID,
          facebook: null,
          instagram: null,
          tiktok: null,
        },
        repository,
      );
    });

    it('should get orm connection when repository is not provided', async () => {
      const repository = {};

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(repository);

      (mockBrandSocialsModel.updateBrandSocials as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await brandSocialsService.updateBrandSocials({
        brandSocialsID: 10,
        brandID: BRAND_ID,
        facebook: 'https://facebook.com/updated',
      });

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(mockBrandSocialsModel.updateBrandSocials).toHaveBeenCalledWith(
        expect.objectContaining({
          brand_socials_id: 10,
          brand_id: BRAND_ID,
          facebook: 'https://facebook.com/updated',
        }),
        repository,
      );
    });

    it('should rethrow HttpException from model', async () => {
      const httpException = new HttpException(400, []);

      (mockBrandSocialsModel.updateBrandSocials as jest.MockedFunction<any>).mockRejectedValueOnce(httpException);

      await expect(
        brandSocialsService.updateBrandSocials(
          {
            brandSocialsID: 10,
            brandID: BRAND_ID,
            facebook: 'https://facebook.com/updated',
          },
          {} as any,
        ),
      ).rejects.toBe(httpException);
    });

    it('should throw 500 when unexpected update error occurs', async () => {
      (mockBrandSocialsModel.updateBrandSocials as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('unexpected failure'));

      await expect(
        brandSocialsService.updateBrandSocials(
          {
            brandSocialsID: 10,
            brandID: BRAND_ID,
            facebook: 'https://facebook.com/updated',
          },
          {} as any,
        ),
      ).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('buildGetBrandSocials', () => {
    it('should map entity fields to API fields', () => {
      const entity = {
        brand_socials_id: 3,
        brandID: BRAND_ID,
        facebook: 'facebook',
        instagram: 'instagram',
        snapchat: 'snapchat',
        tiktok: 'tiktok',
        twitter: 'twitter',
      } as BrandSocialsEntity;

      expect(brandSocialsService.buildGetBrandSocials(entity)).toEqual({
        brandSocialsID: 3,
        brandID: BRAND_ID,
        facebook: 'facebook',
        instagram: 'instagram',
        snapchat: 'snapchat',
        tiktok: 'tiktok',
        twitter: 'twitter',
      });
    });
  });

  describe('buildBrandSocialsInsert', () => {
    it('should map API fields to database fields', () => {
      expect(
        brandSocialsService.buildBrandSocialsInsert({
          brandID: BRAND_ID,
          facebook: 'facebook',
          instagram: 'instagram',
          snapchat: 'snapchat',
          tiktok: 'tiktok',
          twitter: 'twitter',
        }),
      ).toEqual({
        brand_id: BRAND_ID,
        facebook: 'facebook',
        instagram: 'instagram',
        snapchat: 'snapchat',
        tiktok: 'tiktok',
        twitter: 'twitter',
      });
    });
  });

  describe('buildBrandSocialsUpdate', () => {
    it('should map ids and social fields correctly', () => {
      expect(
        brandSocialsService.buildBrandSocialsUpdate({
          brandSocialsID: 20,
          brandID: BRAND_ID,
          facebook: 'facebook',
        }),
      ).toEqual({
        brand_socials_id: 20,
        brand_id: BRAND_ID,
        facebook: 'facebook',
      });
    });

    it('should convert empty social value to null', () => {
      expect(
        brandSocialsService.buildBrandSocialsUpdate({
          brandSocialsID: 20,
          brandID: BRAND_ID,
          facebook: '',
        }),
      ).toEqual({
        brand_socials_id: 20,
        brand_id: BRAND_ID,
        facebook: null,
      });
    });
  });
});
