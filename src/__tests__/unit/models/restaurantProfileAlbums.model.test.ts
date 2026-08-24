import { RestaurantProfileAlbumsEntity } from '@/entities/restaurantProfileAlbums.entity';
import RestaurantProfileAlbumsModel from '@/models/restaurantProfileAlbums.model';
import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';

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

const restaurantProfileAlbumsModel = new RestaurantProfileAlbumsModel();

describe('RestaurantProfileAlbumsModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  const mockRestaurantProfileAlbumsEntity: RestaurantProfileAlbumsEntity[] = [
    {
      restaurant_profile_album_id: 1,
      restaurant_profile_album_media: [
        {
          restaurant_profile_album_media_id: 2,
          restaurant_profile_album_id: 1,
          media_id: 1,
          list_order: 0,
        },
      ],
      restaurant_id: 1,
      name: 'defalut',
      description: '',
      list_order: 0,
      is_hidden: false,
    },
  ];
  describe('getRestaurantProfileAlbumsByRestaurantID', () => {
    const RESTAURANT_ID = 1;
    it('should successfully return restaurant profile albums by restaurant id', async () => {
      const getRepository = jest.fn();
      const getMany = jest.fn();
      const orderBy1 = jest.fn(() => ({ getMany }));
      const andWhere1 = jest.fn(() => ({ orderBy: orderBy1 }));
      const where = jest.fn(() => ({ andWhere: andWhere1 }));
      const leftJoinAndSelect = jest.fn(() => ({ where }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);
      (getMany as jest.MockedFunction<any>).mockResolvedValueOnce(mockRestaurantProfileAlbumsEntity);

      const result = await restaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID(RESTAURANT_ID);

      expect(getMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRestaurantProfileAlbumsEntity);
    });
    it('should throw 500 HttpException if any error occurs when fetching restaurant profile albums by restaurant id', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw Error;
      });

      try {
        await restaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('insertRestaurantProfileAlbums', () => {
    const mockRestaurantProfileAlbumsEntity: RestaurantProfileAlbumsEntity[] = [
      {
        restaurant_profile_album_id: 1,
        restaurant_profile_album_media: [
          {
            restaurant_profile_album_media_id: 2,
            restaurant_profile_album_id: 1,
            media_id: 1,
            list_order: 0,
          },
        ],
        restaurant_id: 1,
        name: 'defalut',
        description: '',
        list_order: 0,
        is_hidden: false,
      },
    ];
    it('should successfully insert restaurant profile albums', async () => {
      const insert = jest.fn().mockResolvedValue({ raw: mockRestaurantProfileAlbumsEntity });

      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      const result = await restaurantProfileAlbumsModel.insertRestaurantProfileAlbums(mockRestaurantProfileAlbumsEntity);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRestaurantProfileAlbumsEntity);
    });
    it('should throw 500 HttpException if any error occurs when inserting restaurant profile albums', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw Error;
      });

      try {
        await restaurantProfileAlbumsModel.insertRestaurantProfileAlbums(mockRestaurantProfileAlbumsEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
