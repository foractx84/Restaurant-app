import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import RestaurantImageTypesModel from '@/models/restaurantImageTypes.model';
import { RestaurantImageTypeEntity } from '@/entities/restaurantImageType.entity';
import { RestaurantImageType } from '@/enums/restaurantImageType';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const restaurantImageTypesModel = new RestaurantImageTypesModel();

describe('RestaurantImageTypesModel', () => {
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
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  describe('getAllRestaurantImageTypes', () => {
    it('should successfully return ALL restaurant image types in database', async () => {
      const find = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });
      (find as jest.MockedFunction<any>).mockResolvedValueOnce(restaurantImageTypeEntity);

      const result = await restaurantImageTypesModel.getAllRestaurantImageTypes();

      expect(find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(restaurantImageTypeEntity);
    });
    it('should throw 500 HttpException if any error occurs when fetching restaurant images by restaurant id', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw Error;
      });

      try {
        await restaurantImageTypesModel.getAllRestaurantImageTypes();
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
