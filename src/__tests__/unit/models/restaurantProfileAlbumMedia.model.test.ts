import { RestaurantProfileAlbumMediaEntity } from '@/entities/restaurantProfileAlbumMedia.entity';
import RestaurantProfileAlbumMediaModel from '@/models/restaurantProfileAlbumMedia.model';
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
jest.mock('@/utils/util', () => {
  return { __esModule: true, getCurrentDate: jest.fn() };
});

const restaurantProfileAlbumMediaModel = new RestaurantProfileAlbumMediaModel();

describe('RestaurantProfileAlbumMediaModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  const mockRestaurantProfileAlbumMediaEntity: RestaurantProfileAlbumMediaEntity[] = [
    {
      restaurant_profile_album_media_id: 2,
      restaurant_profile_album_id: 1,
      media_id: 1,
      list_order: 0,
    },
    {
      restaurant_profile_album_media_id: 3,
      restaurant_profile_album_id: 1,
      media_id: 2,
      list_order: 1,
    },
  ];
  describe('deleteGalleryImagesByIDs', () => {
    const RESTAURANT_ID = 1;
    const galleryImagesToDelete = [2, 3];
    it('should successfully soft delete gallery image ids of restaurant', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      await restaurantProfileAlbumMediaModel.deleteGalleryImagesByIDs(galleryImagesToDelete, RESTAURANT_ID);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs when soft deleting restaurant gallery images', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw Error;
      });

      try {
        await restaurantProfileAlbumMediaModel.deleteGalleryImagesByIDs(galleryImagesToDelete, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('insertRestaurantProfileAlbumMedia', () => {
    it('should successfully insert restaurant profile album media (gallery images)', async () => {
      const insert = jest.fn().mockResolvedValue({ raw: mockRestaurantProfileAlbumMediaEntity });

      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      const result = await restaurantProfileAlbumMediaModel.insertRestaurantProfileAlbumMedia(mockRestaurantProfileAlbumMediaEntity);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRestaurantProfileAlbumMediaEntity);
    });
    it('should throw 500 HttpException if any error occurs when inserting restaurant profile album media (gallery images)', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw Error;
      });

      try {
        await restaurantProfileAlbumMediaModel.insertRestaurantProfileAlbumMedia(mockRestaurantProfileAlbumMediaEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('reorderGalleryImages', () => {
    it('should successfully reorder restaurant profile album media (gallery iamges)', async () => {
      const save = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });

      await restaurantProfileAlbumMediaModel.reorderGalleryImages(mockRestaurantProfileAlbumMediaEntity);

      expect(save).toHaveBeenCalledTimes(1);
    });
    it('should not update restaurant gallery image order due to empty array being passed in', async () => {
      const save = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });

      await restaurantProfileAlbumMediaModel.reorderGalleryImages([]);

      expect(save).toHaveBeenCalledTimes(0);
    });
    it('should throw 500 HttpException if any error occurs when reordering restaurant profile album media (gallery images) ', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw Error;
      });

      try {
        await restaurantProfileAlbumMediaModel.reorderGalleryImages(mockRestaurantProfileAlbumMediaEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
