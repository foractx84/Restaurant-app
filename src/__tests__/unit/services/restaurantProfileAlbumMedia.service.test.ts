import { HttpException, InternalErrorCode, getErrorPayload } from '@exceptions/HttpException';
import { EntityManager } from 'typeorm';
import RestaurantProfileAlbumMediaService from '@/services/restaurantProfileAlbumMedia.service';
import RestaurantProfileAlbumMediaModel from '@/models/restaurantProfileAlbumMedia.model';
import { RestaurantProfileAlbumMediaEntity } from '@/entities/restaurantProfileAlbumMedia.entity';
import {
  validateIDsIncluded,
  validateMediaOrderWithExistingMedia,
  validateMediaOrderWithMaxAllowed,
  validateMediaOrderWithUploads,
  validateMediaToDeleteWithMediaOrder,
  validateMediaTotalWithMaxAllowed,
} from '@/utils/mediaValidationUtils';

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
jest.mock('@/utils/mediaValidationUtils', () => {
  return {
    __esModule: true,
    validateIDsIncluded: jest.fn(),
    validateMediaOrderWithExistingMedia: jest.fn(),
    validateMediaOrderWithMaxAllowed: jest.fn(),
    validateMediaOrderWithUploads: jest.fn(),
    validateMediaToDeleteWithMediaOrder: jest.fn(),
    validateMediaTotalWithMaxAllowed: jest.fn(),
  };
});
jest.mock('@/models/restaurantProfileAlbumMedia.model', () => {
  const mockRestaurantProfileAlbumMediaModel = {
    deleteGalleryImagesByIDs: jest.fn(),
    insertRestaurantProfileAlbumMedia: jest.fn(),
    reorderGalleryImages: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantProfileAlbumMediaModel) };
});

const mockRestaurantProfileAlbumMediaModel = new RestaurantProfileAlbumMediaModel();
const restaurantPrifleAlbumMediaService = new RestaurantProfileAlbumMediaService(mockRestaurantProfileAlbumMediaModel);

describe('RestaurantProfileAlbumMediaService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('deleteGalleryImagesByIDs', () => {
    const galleryImagesToDelete = [1, 2, 3];
    const RESTAURANT_ID = 1;
    it('should successfully soft delete gallery images by IDs', async () => {
      await restaurantPrifleAlbumMediaService.deleteGalleryImagesByIDs(galleryImagesToDelete, RESTAURANT_ID, {} as EntityManager);
      expect(mockRestaurantProfileAlbumMediaModel.deleteGalleryImagesByIDs).toHaveBeenCalledWith(
        galleryImagesToDelete,
        RESTAURANT_ID,
        {} as EntityManager,
      );
    });
    it('should throw a HttpException if any error occurs when soft deleting gallery images', async () => {
      (mockRestaurantProfileAlbumMediaModel.deleteGalleryImagesByIDs as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantPrifleAlbumMediaService.deleteGalleryImagesByIDs(galleryImagesToDelete, RESTAURANT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantProfileAlbumMediaModel.deleteGalleryImagesByIDs).toHaveBeenCalledWith(
        galleryImagesToDelete,
        RESTAURANT_ID,
        {} as EntityManager,
      );
    });
  });
  describe('insertRestaurantProfileAlbumMedia', () => {
    const mockRestaurantProfileAlbumMedia: RestaurantProfileAlbumMediaEntity[] = [
      {
        restaurant_profile_album_media_id: 12,
        restaurant_profile_album_id: 3,
        media_id: 18,
        list_order: 0,
        created_at: '2023-04-14T02:55:46.634Z',
        updated_at: '2023-04-14T02:55:46.634Z',
        deleted_at: null,
      },
      {
        restaurant_profile_album_media_id: 13,
        restaurant_profile_album_id: 3,
        media_id: 18,
        list_order: 1,
        created_at: '2023-04-14T02:55:46.634Z',
        updated_at: '2023-04-14T02:55:46.634Z',
        deleted_at: null,
      },
    ];
    it('should successfully insert restaurant profile albums media (gallery images)', async () => {
      (mockRestaurantProfileAlbumMediaModel.insertRestaurantProfileAlbumMedia as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockRestaurantProfileAlbumMedia,
      );

      const result = await restaurantPrifleAlbumMediaService.insertRestaurantProfileAlbumMedia(mockRestaurantProfileAlbumMedia, {} as EntityManager);
      expect(mockRestaurantProfileAlbumMediaModel.insertRestaurantProfileAlbumMedia).toHaveBeenCalledWith(
        mockRestaurantProfileAlbumMedia,
        {} as EntityManager,
      );
      expect(result).toEqual(mockRestaurantProfileAlbumMedia);
    });
    it('should throw a HttpException if any error occurs when inserting restaurant profile album media (gallery images', async () => {
      (mockRestaurantProfileAlbumMediaModel.insertRestaurantProfileAlbumMedia as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantPrifleAlbumMediaService.insertRestaurantProfileAlbumMedia(mockRestaurantProfileAlbumMedia, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantProfileAlbumMediaModel.insertRestaurantProfileAlbumMedia).toHaveBeenCalledWith(
        mockRestaurantProfileAlbumMedia,
        {} as EntityManager,
      );
    });
  });
  describe('reorderGalleryImages', () => {
    const mockRestaurantProfileAlbumMedia: RestaurantProfileAlbumMediaEntity[] = [
      {
        restaurant_profile_album_media_id: 12,
        restaurant_profile_album_id: 3,
        media_id: 18,
        list_order: 0,
        created_at: '2023-04-14T02:55:46.634Z',
        updated_at: '2023-04-14T02:55:46.634Z',
        deleted_at: null,
      },
      {
        restaurant_profile_album_media_id: 13,
        restaurant_profile_album_id: 3,
        media_id: 18,
        list_order: 1,
        created_at: '2023-04-14T02:55:46.634Z',
        updated_at: '2023-04-14T02:55:46.634Z',
        deleted_at: null,
      },
    ];
    it('should successfully reorder gallery images by IDs', async () => {
      await restaurantPrifleAlbumMediaService.reorderGalleryImages(mockRestaurantProfileAlbumMedia, {} as EntityManager);
      expect(mockRestaurantProfileAlbumMediaModel.reorderGalleryImages).toHaveBeenCalledWith(mockRestaurantProfileAlbumMedia, {} as EntityManager);
    });
    it('should throw a HttpException if any error occurs when reordering gallery images', async () => {
      (mockRestaurantProfileAlbumMediaModel.reorderGalleryImages as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantPrifleAlbumMediaService.reorderGalleryImages(mockRestaurantProfileAlbumMedia, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantProfileAlbumMediaModel.reorderGalleryImages).toHaveBeenCalledWith(mockRestaurantProfileAlbumMedia, {} as EntityManager);
    });
  });
  describe('setupMediaListOrder', () => {
    const albumID = 1;
    const images = ['image1.jpg'];
    const insertedFilesName = 'filename-';
    const mediaInsertedResult = [
      { restaurant_profile_album_media_id: 1, restaurant_profile_album_id: 1, media_id: 1, list_order: 0, media_url: 'image1.jpg' },
    ];
    it('should return an array of updated list orders with ids and filename-N in listOrder array', () => {
      const listOrder = ['filename-0', '1'];
      const result = restaurantPrifleAlbumMediaService.setupMediaListOrder(albumID, images, insertedFilesName, listOrder, mediaInsertedResult);
      expect(result).toEqual([
        {
          restaurant_profile_album_id: 1,
          list_order: 0,
          restaurant_profile_album_media_id: 1,
        },
        {
          restaurant_profile_album_id: 1,
          list_order: 1,
          restaurant_profile_album_media_id: 1,
        },
      ]);
    });
    it('should handle non uploaded images (filename-N not included in the listOrder array, only ids)', () => {
      const listOrder = ['2', '1'];
      const mediaInsertedResultTwoImages = [
        { restaurant_profile_album_media_id: 1, restaurant_profile_album_id: 1, media_id: 1, list_order: 0, media_url: 'image1.jpg' },
        { restaurant_profile_album_media_id: 2, restaurant_profile_album_id: 1, media_id: 1, list_order: 1, media_url: 'image2.jpg' },
      ];
      const result = restaurantPrifleAlbumMediaService.setupMediaListOrder(albumID, [], insertedFilesName, listOrder, mediaInsertedResultTwoImages);
      expect(result).toEqual([
        {
          restaurant_profile_album_id: 1,
          list_order: 0,
          restaurant_profile_album_media_id: 2,
        },
        {
          restaurant_profile_album_id: 1,
          list_order: 1,
          restaurant_profile_album_media_id: 1,
        },
      ]);
    });
    it('should throw an HttpException with a 400 status when an error occurs with the image index', () => {
      const listOrder = ['0', 'filename-5'];

      try {
        restaurantPrifleAlbumMediaService.setupMediaListOrder(albumID, images, insertedFilesName, listOrder, mediaInsertedResult);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw an HttpException with a 500 status when an error occurs other than image index error', () => {
      const listOrder = ['0', 'filename-5'];

      expect(() => restaurantPrifleAlbumMediaService.setupMediaListOrder(albumID, images, insertedFilesName, listOrder, mediaInsertedResult)).toThrow(
        new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while setting up media list order for albumID ${albumID}. Refer to logs for more info.`,
          ),
        ),
      );
    });
    it('should return an empty array when listOrder is empty', () => {
      const listOrder: string[] = [];
      const result = restaurantPrifleAlbumMediaService.setupMediaListOrder(albumID, images, insertedFilesName, listOrder, mediaInsertedResult);
      expect(result).toEqual([]);
    });
  });
  describe('validateGalleryImagesUploaded', () => {
    it('should not throw any exceptions when all inputs are valid', () => {
      const currentGalleryImageIDs: number[] = [1, 2, 3];
      const galleryImages: string[] = ['image1.jpg', 'image2.jpg'];
      const galleryOrder: string[] = ['filename-0', '3', 'filename-1', '2'];
      const galleryImagesToDelete: number[] = [1];
      expect(() =>
        restaurantPrifleAlbumMediaService.validateGalleryImagesUploaded(currentGalleryImageIDs, galleryImages, galleryOrder, galleryImagesToDelete),
      ).not.toThrow();

      expect(validateIDsIncluded as jest.MockedFunction<any>).not.toThrow();
      expect(validateMediaOrderWithUploads as jest.MockedFunction<any>).not.toThrow();
      expect(validateMediaToDeleteWithMediaOrder as jest.MockedFunction<any>).not.toThrow();
      expect(validateMediaOrderWithMaxAllowed as jest.MockedFunction<any>).not.toThrow();
      expect(validateMediaTotalWithMaxAllowed as jest.MockedFunction<any>).not.toThrow();
      expect(validateMediaOrderWithExistingMedia as jest.MockedFunction<any>).not.toThrow();
    });
    it('should not throw any exceptions when all inputs are valid and galleryImagesToDelete is empty', () => {
      const currentGalleryImageIDs: number[] = [1, 2, 3];
      const galleryImages: string[] = ['image1.jpg', 'image2.jpg'];
      const galleryOrder: string[] = ['filename-0', '3', 'filename-1', '2'];
      const galleryImagesToDelete: number[] = [];
      expect(() =>
        restaurantPrifleAlbumMediaService.validateGalleryImagesUploaded(currentGalleryImageIDs, galleryImages, galleryOrder, galleryImagesToDelete),
      ).not.toThrow();

      expect(validateIDsIncluded as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaOrderWithUploads as jest.MockedFunction<any>).not.toThrow();
      expect(validateMediaToDeleteWithMediaOrder as jest.MockedFunction<any>).not.toThrow();
      expect(validateMediaOrderWithMaxAllowed as jest.MockedFunction<any>).not.toThrow();
      expect(validateMediaTotalWithMaxAllowed as jest.MockedFunction<any>).not.toThrow();
      expect(validateMediaOrderWithExistingMedia as jest.MockedFunction<any>).not.toThrow();
    });
    it('should throw an exception when currentGalleryImageIDs dont match with galleryImagesToDelete', () => {
      const currentGalleryImageIDs: number[] = [1, 2, 3];
      const galleryImages: string[] = ['image1.jpg', 'image2.jpg'];
      const galleryOrder: string[] = ['filename-0', '3', 'filename-1', '2', 'filename-2'];
      const galleryImagesToDelete: number[] = [5];

      (validateIDsIncluded as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        restaurantPrifleAlbumMediaService.validateGalleryImagesUploaded(currentGalleryImageIDs, galleryImages, galleryOrder, galleryImagesToDelete);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(validateIDsIncluded as jest.MockedFunction<any>).toThrow();
      expect(validateMediaOrderWithUploads as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaToDeleteWithMediaOrder as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaOrderWithMaxAllowed as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaTotalWithMaxAllowed as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaOrderWithExistingMedia as jest.MockedFunction<any>).not.toHaveBeenCalled();
    });
    it('should throw an exception when galleryOrder contains more images than uploaded images', () => {
      const currentGalleryImageIDs: number[] = [1, 2, 3];
      const galleryImages: string[] = ['image1.jpg', 'image2.jpg'];
      const galleryOrder: string[] = ['filename-0', '3', 'filename-1', '2', 'filename-2'];
      const galleryImagesToDelete: number[] = [];

      (validateMediaOrderWithUploads as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        restaurantPrifleAlbumMediaService.validateGalleryImagesUploaded(currentGalleryImageIDs, galleryImages, galleryOrder, galleryImagesToDelete);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(validateIDsIncluded as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaOrderWithUploads as jest.MockedFunction<any>).toThrow();
      expect(validateMediaToDeleteWithMediaOrder as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaOrderWithMaxAllowed as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaTotalWithMaxAllowed as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaOrderWithExistingMedia as jest.MockedFunction<any>).not.toHaveBeenCalled();
    });
    it('should throw an exception when galleryImagesToDelete contains ids in galleryOrder', () => {
      const currentGalleryImageIDs: number[] = [1, 2];
      const galleryImages: string[] = ['image1.jpg', 'image2.jpg'];
      const galleryOrder: string[] = ['filename-0', '1', 'filename-1', '2'];
      const galleryImagesToDelete: number[] = [2];

      (validateMediaToDeleteWithMediaOrder as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        restaurantPrifleAlbumMediaService.validateGalleryImagesUploaded(currentGalleryImageIDs, galleryImages, galleryOrder, galleryImagesToDelete);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(validateIDsIncluded as jest.MockedFunction<any>).toHaveBeenCalledTimes(1);
      expect(validateMediaOrderWithUploads as jest.MockedFunction<any>).toHaveBeenCalledTimes(1);
      expect(validateMediaToDeleteWithMediaOrder as jest.MockedFunction<any>).toThrow();
      expect(validateMediaOrderWithMaxAllowed as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaTotalWithMaxAllowed as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaOrderWithExistingMedia as jest.MockedFunction<any>).not.toHaveBeenCalled();
    });
    it('should throw an exception when galleryOrder contains more than max number of images', () => {
      const currentGalleryImageIDs = [1, 2, 3];
      const galleryImages: string[] = ['image1.jpeg'];
      const galleryOrder = ['1', '2', '3'];
      const galleryImagesToDelete: number[] = [];

      (validateMediaOrderWithMaxAllowed as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        restaurantPrifleAlbumMediaService.validateGalleryImagesUploaded(currentGalleryImageIDs, galleryImages, galleryOrder, galleryImagesToDelete);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(validateIDsIncluded as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaOrderWithUploads as jest.MockedFunction<any>).toHaveBeenCalledTimes(1);
      expect(validateMediaToDeleteWithMediaOrder as jest.MockedFunction<any>).toHaveBeenCalledTimes(1);
      expect(validateMediaOrderWithMaxAllowed as jest.MockedFunction<any>).toThrow();
      expect(validateMediaTotalWithMaxAllowed as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaOrderWithExistingMedia as jest.MockedFunction<any>).not.toHaveBeenCalled();
    });
    it('should throw an exception when total number of images exceeds the maximum allowed after adding new images and removing images to delete', () => {
      const currentGalleryImageIDs = [1, 2, 3];
      const galleryImages: string[] = ['image1.jpeg'];
      const galleryOrder = ['1', '2', '3'];
      const galleryImagesToDelete: number[] = [];

      (validateMediaTotalWithMaxAllowed as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        restaurantPrifleAlbumMediaService.validateGalleryImagesUploaded(currentGalleryImageIDs, galleryImages, galleryOrder, galleryImagesToDelete);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(validateIDsIncluded as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaOrderWithUploads as jest.MockedFunction<any>).toHaveBeenCalledTimes(1);
      expect(validateMediaToDeleteWithMediaOrder as jest.MockedFunction<any>).toHaveBeenCalledTimes(1);
      expect(validateMediaOrderWithMaxAllowed as jest.MockedFunction<any>).toHaveBeenCalledTimes(1);
      expect(validateMediaTotalWithMaxAllowed as jest.MockedFunction<any>).toThrow();
      expect(validateMediaOrderWithExistingMedia as jest.MockedFunction<any>).not.toHaveBeenCalled();
    });
    it('should throw an exception when gallerOrder doesnt have ids that exist in currentGalleryImageIDs', () => {
      const currentGalleryImageIDs = [1, 2, 3, 4];
      const galleryImages: string[] = ['image1.jpeg'];
      const galleryOrder = ['1', '2', '3'];
      const galleryImagesToDelete: number[] = [];

      (validateMediaOrderWithExistingMedia as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        restaurantPrifleAlbumMediaService.validateGalleryImagesUploaded(currentGalleryImageIDs, galleryImages, galleryOrder, galleryImagesToDelete);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(validateIDsIncluded as jest.MockedFunction<any>).not.toHaveBeenCalled();
      expect(validateMediaOrderWithUploads as jest.MockedFunction<any>).toHaveBeenCalledTimes(1);
      expect(validateMediaToDeleteWithMediaOrder as jest.MockedFunction<any>).toHaveBeenCalledTimes(1);
      expect(validateMediaOrderWithMaxAllowed as jest.MockedFunction<any>).toHaveBeenCalledTimes(1);
      expect(validateMediaTotalWithMaxAllowed as jest.MockedFunction<any>).toHaveBeenCalledTimes(1);
      expect(validateMediaOrderWithExistingMedia as jest.MockedFunction<any>).toThrow();
    });
    it('should throw 500 exception if any general error occurs', () => {
      const currentGalleryImageIDs = [1, 2, 3];
      const galleryImages: string[] = [];
      const galleryOrder = ['filename-1', 'filename-3'];
      const galleryImagesToDelete = [2];

      (validateIDsIncluded as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        restaurantPrifleAlbumMediaService.validateGalleryImagesUploaded(currentGalleryImageIDs, galleryImages, galleryOrder, galleryImagesToDelete);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
