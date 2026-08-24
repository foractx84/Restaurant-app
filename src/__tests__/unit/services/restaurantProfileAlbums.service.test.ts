import { HttpException } from '@exceptions/HttpException';
import RestaurantProfileAlbumsService from '@/services/restaurantProfileAlbums.service';
import { RestaurantProfileAlbumMediaModelInterface } from '@/interfaces/restaurantProfileAlbumMedia.interface';
import { EntityManager } from 'typeorm';
import RestaurantProfileAlbumMediaService from '@/services/restaurantProfileAlbumMedia.service';
import RestaurantProfileAlbumsModel from '@/models/restaurantProfileAlbums.model';
import { RestaurantProfileAlbumsEntity } from '@/entities/restaurantProfileAlbums.entity';
import { RestaurantProfileAlbumMediaEntity } from '@/entities/restaurantProfileAlbumMedia.entity';
import { MediaEntity } from '@/entities/media.entity';
import { IMAGE_TYPE_ID } from '@/constants/media.constants';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
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
jest.mock('@/services/restaurantProfileAlbumMedia.service', () => {
  const mockRestaurantProfileAlbumMediaModel = {
    deleteGalleryImagesByIDs: jest.fn(),
    insertRestaurantProfileAlbumMedia: jest.fn(),
    setupMediaListOrder: jest.fn(),
    reorderGalleryImages: jest.fn(),
    validateGalleryImagesUploaded: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantProfileAlbumMediaModel) };
});
jest.mock('@/models/restaurantProfileAlbums.model', () => {
  const mockRestaurantProfileAlbumsModel = {
    getRestaurantProfileAlbumsByRestaurantID: jest.fn(),
    insertRestaurantProfileAlbums: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantProfileAlbumsModel) };
});

const mockRestaurantProfileAlbumMediaService = new RestaurantProfileAlbumMediaService({} as RestaurantProfileAlbumMediaModelInterface);
const mockRestaurantProfileAlbumsModel = new RestaurantProfileAlbumsModel();
const restaurantProfileAlbumsService = new RestaurantProfileAlbumsService(mockRestaurantProfileAlbumsModel, mockRestaurantProfileAlbumMediaService);

describe('RestaurantProfileAlbums', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('deleteGalleryImagesByIDsForAlbum', () => {
    const galleryImagesToDelete = [1, 2, 3];
    const RESTAURANT_ID = 1;
    it('should successfully delete gallery images by IDs', async () => {
      await restaurantProfileAlbumsService.deleteGalleryImagesByIDsForAlbum(galleryImagesToDelete, RESTAURANT_ID, {} as EntityManager);
      expect(mockRestaurantProfileAlbumMediaService.deleteGalleryImagesByIDs).toHaveBeenCalledWith(
        galleryImagesToDelete,
        RESTAURANT_ID,
        {} as EntityManager,
      );
    });
    it('should throw a HttpException if any error occurs', async () => {
      (mockRestaurantProfileAlbumMediaService.deleteGalleryImagesByIDs as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantProfileAlbumsService.deleteGalleryImagesByIDsForAlbum(galleryImagesToDelete, RESTAURANT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantProfileAlbumMediaService.deleteGalleryImagesByIDs).toHaveBeenCalledWith(
        galleryImagesToDelete,
        RESTAURANT_ID,
        {} as EntityManager,
      );
    });
  });
  describe('getRestaurantProfileAlbumsByRestaurantID', () => {
    const RESTAURANT_ID = 1;
    const mockRestaurantProfileAlbum: RestaurantProfileAlbumsEntity[] = [
      {
        restaurant_profile_album_id: 3,
        restaurant_id: 1,
        name: 'default',
        description: 'default gallery album used to display a single album in restaurant profile',
        list_order: 0,
        created_at: '2023-04-14T02:55:46.634Z',
        updated_at: '2023-04-14T02:55:46.634Z',
        deleted_at: null,
        is_hidden: false,
        restaurant_profile_album_media: [
          {
            restaurant_profile_album_media_id: 12,
            restaurant_profile_album_id: 3,
            media_id: 18,
            list_order: 0,
            created_at: '2023-04-14T02:55:46.634Z',
            updated_at: '2023-04-14T02:55:46.634Z',
            deleted_at: null,
          },
        ],
      },
    ];
    it('should successfully get restaurant profile albums by IDs', async () => {
      (mockRestaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockRestaurantProfileAlbum,
      );

      const result = await restaurantProfileAlbumsService.getRestaurantProfileAlbumsByRestaurantID(RESTAURANT_ID, {} as EntityManager);
      expect(mockRestaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, {} as EntityManager);
      expect(result).toEqual(mockRestaurantProfileAlbum);
    });
    it('should throw a HttpException if any error occurs', async () => {
      (mockRestaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantProfileAlbumsService.getRestaurantProfileAlbumsByRestaurantID(RESTAURANT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, {} as EntityManager);
    });
  });
  describe('insertRestaurantProfileAlbums', () => {
    const mockRestaurantProfileAlbum: RestaurantProfileAlbumsEntity[] = [
      {
        restaurant_profile_album_id: 3,
        restaurant_id: 1,
        name: 'default',
        description: 'default gallery album used to display a single album in restaurant profile',
        list_order: 0,
        created_at: '2023-04-14T02:55:46.634Z',
        updated_at: '2023-04-14T02:55:46.634Z',
        deleted_at: null,
        is_hidden: false,
        restaurant_profile_album_media: [
          {
            restaurant_profile_album_media_id: 12,
            restaurant_profile_album_id: 3,
            media_id: 18,
            list_order: 0,
            created_at: '2023-04-14T02:55:46.634Z',
            updated_at: '2023-04-14T02:55:46.634Z',
            deleted_at: null,
          },
        ],
      },
    ];
    it('should successfully insert restaurant profile albums by entity', async () => {
      (mockRestaurantProfileAlbumsModel.insertRestaurantProfileAlbums as jest.MockedFunction<any>).mockResolvedValueOnce(mockRestaurantProfileAlbum);

      const result = await restaurantProfileAlbumsService.insertRestaurantProfileAlbums(mockRestaurantProfileAlbum, {} as EntityManager);
      expect(mockRestaurantProfileAlbumsModel.insertRestaurantProfileAlbums).toHaveBeenCalledWith(mockRestaurantProfileAlbum, {} as EntityManager);
      expect(result).toEqual(mockRestaurantProfileAlbum);
    });
    it('should throw a HttpException if any error occurs while inserting restaurant profile albums by entity', async () => {
      (mockRestaurantProfileAlbumsModel.insertRestaurantProfileAlbums as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantProfileAlbumsService.insertRestaurantProfileAlbums(mockRestaurantProfileAlbum, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantProfileAlbumsModel.insertRestaurantProfileAlbums).toHaveBeenCalledWith(mockRestaurantProfileAlbum, {} as EntityManager);
    });
  });
  describe('setupGalleryImagesListOrder', () => {
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
        media_id: 19,
        list_order: 1,
        created_at: '2023-04-14T02:55:46.634Z',
        updated_at: '2023-04-14T02:55:46.634Z',
        deleted_at: null,
      },
    ];
    it('should handle empty galleryOrder without errors', async () => {
      await restaurantProfileAlbumsService.setupGalleryImagesListOrder(1, ['image1.jpeg', 'image2.jpeg'], [], []);
      expect(mockRestaurantProfileAlbumMediaService.setupMediaListOrder).not.toHaveBeenCalled();
      expect(mockRestaurantProfileAlbumMediaService.reorderGalleryImages).not.toHaveBeenCalled();
    });
    it('should reorder gallery images when galleryOrder array is not empty', async () => {
      (mockRestaurantProfileAlbumMediaService.setupMediaListOrder as jest.MockedFunction<any>).mockReturnValue(mockRestaurantProfileAlbumMedia);

      await restaurantProfileAlbumsService.setupGalleryImagesListOrder(
        1,
        ['image1.jpg', 'image2.jpg', 'image3.jpg'],
        ['1', 'filename-0', '0'],
        mockRestaurantProfileAlbumMedia,
        {} as EntityManager,
      );

      expect(mockRestaurantProfileAlbumMediaService.setupMediaListOrder).toHaveBeenCalledWith(
        1,
        ['image1.jpg', 'image2.jpg', 'image3.jpg'],
        'filename-',
        ['1', 'filename-0', '0'],
        mockRestaurantProfileAlbumMedia,
      );
      expect(mockRestaurantProfileAlbumMediaService.reorderGalleryImages).toHaveBeenCalledWith(mockRestaurantProfileAlbumMedia, {} as EntityManager);
    });
    it('should throw HttpException when an error occurs', async () => {
      (mockRestaurantProfileAlbumMediaService.setupMediaListOrder as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantProfileAlbumsService.setupGalleryImagesListOrder(
          1,
          ['image1.jpg', 'image2.jpg', 'image3.jpg'],
          ['1', 'filename-0', '0'],
          mockRestaurantProfileAlbumMedia,
          {} as EntityManager,
        );
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantProfileAlbumMediaService.setupMediaListOrder).toHaveBeenCalledWith(
        1,
        ['image1.jpg', 'image2.jpg', 'image3.jpg'],
        'filename-',
        ['1', 'filename-0', '0'],
        mockRestaurantProfileAlbumMedia,
      );
    });
  });
  describe('setupInsertingAlbumAndGalleryImages', () => {
    const RESTAURANT_ID = 1;
    const insertedMedia: MediaEntity[] = [
      new MediaEntity('image1', IMAGE_TYPE_ID, RESTAURANT_ID, 'some_image', 1),
      new MediaEntity('image2', IMAGE_TYPE_ID, RESTAURANT_ID, null, 2),
    ];
    const galleryImages = ['image1', 'image2'];
    const emptyAlbums: RestaurantProfileAlbumsEntity[] = [];
    const insertedAlbums: RestaurantProfileAlbumsEntity[] = [{ restaurant_profile_album_id: 1, name: 'default', restaurant_id: RESTAURANT_ID }];
    const mockRestaurantProfileAlbum: RestaurantProfileAlbumsEntity[] = [
      {
        restaurant_profile_album_id: 1,
        restaurant_id: 1,
        name: 'default',
        description: 'default gallery album used to display a single album in restaurant profile',
        list_order: 0,
        created_at: '2023-04-14T02:55:46.634Z',
        updated_at: '2023-04-14T02:55:46.634Z',
        deleted_at: null,
        is_hidden: false,
        restaurant_profile_album_media: [],
      },
    ];
    const insertedRestaurantProfileAlbumMedia: RestaurantProfileAlbumMediaEntity[] = [
      {
        restaurant_profile_album_media_id: 12,
        restaurant_profile_album_id: 1,
        media_id: 1,
        list_order: 0,
        created_at: '2023-04-14T02:55:46.634Z',
        updated_at: '2023-04-14T02:55:46.634Z',
        deleted_at: null,
      },
      {
        restaurant_profile_album_media_id: 13,
        restaurant_profile_album_id: 1,
        media_id: 2,
        list_order: 1,
        created_at: '2023-04-14T02:55:46.634Z',
        updated_at: '2023-04-14T02:55:46.634Z',
        deleted_at: null,
      },
    ];
    const galleryImageEntities = [
      {
        restaurant_profile_album_id: 1,
        media_id: 1,
      },
      {
        restaurant_profile_album_id: 1,
        media_id: 2,
      },
    ];
    it('should insert a default album if none exist and continue with inserting restaurant profile media', async () => {
      (mockRestaurantProfileAlbumsModel.insertRestaurantProfileAlbums as jest.MockedFunction<any>).mockResolvedValueOnce(mockRestaurantProfileAlbum);
      (mockRestaurantProfileAlbumMediaService.insertRestaurantProfileAlbumMedia as jest.MockedFunction<any>).mockResolvedValueOnce(
        insertedRestaurantProfileAlbumMedia,
      );

      await restaurantProfileAlbumsService.setupInsertingAlbumAndGalleryImages(
        galleryImages,
        emptyAlbums,
        insertedMedia,
        RESTAURANT_ID,
        insertedRestaurantProfileAlbumMedia,
        {} as EntityManager,
      );
      // Assert
      expect(mockRestaurantProfileAlbumMediaService.insertRestaurantProfileAlbumMedia).toHaveBeenCalledWith(
        galleryImageEntities,
        {} as EntityManager,
      );
      expect(insertedAlbums.length).toBe(1);
      expect(insertedAlbums[0].name).toBe('default');
      expect(insertedAlbums[0].restaurant_id).toBe(RESTAURANT_ID);
    });
    it('should not insert a default album if one already exists and continue inserting restaurant profile album media', async () => {
      (mockRestaurantProfileAlbumMediaService.insertRestaurantProfileAlbumMedia as jest.MockedFunction<any>).mockResolvedValueOnce(
        insertedRestaurantProfileAlbumMedia,
      );

      await restaurantProfileAlbumsService.setupInsertingAlbumAndGalleryImages(
        galleryImages,
        insertedAlbums,
        insertedMedia,
        RESTAURANT_ID,
        insertedRestaurantProfileAlbumMedia,
        {} as EntityManager,
      );
      // Assert
      expect(mockRestaurantProfileAlbumMediaService.insertRestaurantProfileAlbumMedia).toHaveBeenCalledWith(
        galleryImageEntities,
        {} as EntityManager,
      );
      expect(insertedAlbums.length).toBe(1);
      expect(insertedAlbums[0].name).toBe('default');
      expect(insertedAlbums[0].restaurant_id).toBe(RESTAURANT_ID);
    });
    it('should handle error and throw HttpException', async () => {
      (mockRestaurantProfileAlbumMediaService.deleteGalleryImagesByIDs as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantProfileAlbumsService.setupInsertingAlbumAndGalleryImages(
          galleryImages,
          insertedAlbums,
          insertedMedia,
          RESTAURANT_ID,
          insertedRestaurantProfileAlbumMedia,
          {} as EntityManager,
        );
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('validateGalleryImageUploadAndFetchRestaurantAlbums', () => {
    const RESTAURANT_ID = 1;
    const mockRestaurantProfileAlbum: RestaurantProfileAlbumsEntity[] = [
      {
        restaurant_profile_album_id: 3,
        restaurant_id: 1,
        name: 'default',
        description: 'default gallery album used to display a single album in restaurant profile',
        list_order: 0,
        created_at: '2023-04-14T02:55:46.634Z',
        updated_at: '2023-04-14T02:55:46.634Z',
        deleted_at: null,
        is_hidden: false,
        restaurant_profile_album_media: [
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
            media_id: 19,
            list_order: 1,
            created_at: '2023-04-14T02:55:46.634Z',
            updated_at: '2023-04-14T02:55:46.634Z',
            deleted_at: null,
          },
        ],
      },
    ];
    it('should validate and return existing current restaurant albums', async () => {
      (mockRestaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockRestaurantProfileAlbum,
      );

      const result = await restaurantProfileAlbumsService.validateGalleryImageUploadAndFetchRestaurantAlbums(
        ['image1.jpg', 'image2.jpg', 'image3.jpg'],
        [1],
        ['1', 'filename-0'],
        RESTAURANT_ID,
      );

      expect(mockRestaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, undefined);

      expect(mockRestaurantProfileAlbumMediaService.validateGalleryImagesUploaded).toHaveBeenCalledTimes(1);

      expect(result).toEqual(mockRestaurantProfileAlbum);
    });
    it('should validate and return empty array (no existing current restaurant albums)', async () => {
      (mockRestaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      const result = await restaurantProfileAlbumsService.validateGalleryImageUploadAndFetchRestaurantAlbums(
        ['image1.jpg', 'image2.jpg', 'image3.jpg'],
        [1],
        ['1', 'filename-0'],
        RESTAURANT_ID,
      );

      expect(mockRestaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, undefined);

      expect(mockRestaurantProfileAlbumMediaService.validateGalleryImagesUploaded).toHaveBeenCalledTimes(1);

      expect(result).toEqual([]);
    });
    it('should throw HttpException when validation fails', async () => {
      (mockRestaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockRestaurantProfileAlbum,
      );

      (mockRestaurantProfileAlbumMediaService.validateGalleryImagesUploaded as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantProfileAlbumsService.validateGalleryImageUploadAndFetchRestaurantAlbums(
          ['image1.jpg', 'image2.jpg', 'image3.jpg'],
          [1],
          ['1', 'filename-0'],
          RESTAURANT_ID,
        );
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, undefined);

      expect(mockRestaurantProfileAlbumMediaService.validateGalleryImagesUploaded).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException when any error occurs', async () => {
      (mockRestaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantProfileAlbumsService.validateGalleryImageUploadAndFetchRestaurantAlbums(
          ['image1.jpg', 'image2.jpg', 'image3.jpg'],
          [1],
          ['1', 'filename-0'],
          RESTAURANT_ID,
        );
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantProfileAlbumsModel.getRestaurantProfileAlbumsByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, undefined);

      expect(mockRestaurantProfileAlbumMediaService.validateGalleryImagesUploaded).not.toHaveBeenCalled();
    });
  });
  describe('validateGalleryImagesUploadedForAlbum', () => {
    it('should validate and existing gallery images uploaded for albume', async () => {
      restaurantProfileAlbumsService.validateGalleryImagesUploadedForAlbum([1], ['image1.jpg', 'image2.jpg', 'image3.jpg'], [1], ['1', 'filename-0']);

      expect(mockRestaurantProfileAlbumMediaService.validateGalleryImagesUploaded).toHaveBeenCalledWith(
        [1],
        ['image1.jpg', 'image2.jpg', 'image3.jpg'],
        ['1', 'filename-0'],
        [1],
      );
    });
    it('should throw HttpException when any error occurs', async () => {
      (mockRestaurantProfileAlbumMediaService.validateGalleryImagesUploaded as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        restaurantProfileAlbumsService.validateGalleryImagesUploadedForAlbum(
          [1],
          ['image1.jpg', 'image2.jpg', 'image3.jpg'],
          [1],
          ['1', 'filename-0'],
        );
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantProfileAlbumMediaService.validateGalleryImagesUploaded).toHaveBeenCalledWith(
        [1],
        ['image1.jpg', 'image2.jpg', 'image3.jpg'],
        ['1', 'filename-0'],
        [1],
      );
    });
  });
});
