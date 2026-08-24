import { HttpException } from '@exceptions/HttpException';
import { RestaurantImageType } from '@/enums/restaurantImageType';
import RestaurantImageTypesModel from '@/models/restaurantImageTypes.model';
import RestaurantImageTypesService from '@/services/restaurantImageTypes.service';
import { RestaurantImageTypeEntity } from '@/entities/restaurantImageType.entity';

jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/restaurantImageTypes.model', () => {
  const mockRestaurantImageTypesModel = {
    getAllRestaurantImageTypes: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantImageTypesModel) };
});
const mockRestaurantImageTypesModel = new RestaurantImageTypesModel();

const restaurantImageTypesService = new RestaurantImageTypesService(mockRestaurantImageTypesModel);

describe('restaurantImageTypesService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  const restaurantImageTypeEntity: RestaurantImageTypeEntity[] = [
    {
      restaurant_image_type_id: 1,
      type: RestaurantImageType.PROFILE,
      description: 'profile',
    },
    {
      restaurant_image_type_id: 1,
      type: RestaurantImageType.LOGO,
      description: 'logo',
    },
    {
      restaurant_image_type_id: 1,
      type: RestaurantImageType.THUMBNAIL,
      description: 'thumbnail',
    },
    {
      restaurant_image_type_id: 1,
      type: RestaurantImageType.MENU_COVER,
      description: 'menu_cover',
    },
  ];
  describe('getRestaurantImagesByRestaurantID', () => {
    it('should successfully get ALL restaurant images types', async () => {
      (mockRestaurantImageTypesModel.getAllRestaurantImageTypes as jest.MockedFunction<any>).mockResolvedValueOnce(restaurantImageTypeEntity);

      const result = await restaurantImageTypesService.getAllRestaurantImageTypes();

      expect(mockRestaurantImageTypesModel.getAllRestaurantImageTypes).toHaveBeenCalledWith();
      expect(result).toEqual(restaurantImageTypeEntity);
    });
    it('should throw a HttpException if any error occurs while getting restaurant images by restaurant id', async () => {
      (mockRestaurantImageTypesModel.getAllRestaurantImageTypes as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantImageTypesService.getAllRestaurantImageTypes();
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantImageTypesModel.getAllRestaurantImageTypes).toHaveBeenCalledTimes(1);
    });
  });
});
