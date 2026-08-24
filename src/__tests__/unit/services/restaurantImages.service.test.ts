import { HttpException } from '@exceptions/HttpException';
import RestaurantImagesService from '@services/restaurantImages.service';
import { ormConnection } from '@utils/dbUtils';
import { RestaurantImageType } from '@/enums/restaurantImageType';
import RestaurantImagesModel from '@/models/restaurantImages.model';
import { EntityManager } from 'typeorm';
import { RestaurantImageEntity } from '@/entities/restaurantImage.entity';
import { MediaEntity } from '@/entities/media.entity';
import MediaLibraryService from '@/services/mediaLibrary.service';
import MediaLibraryModel from '@/models/mediaLibrary.model';
import { RestaurantImageTypeEntity } from '@/entities/restaurantImageType.entity';
import RestaurantImageTypesService from '@/services/restaurantImageTypes.service';
import RestaurantImageTypesModel from '@/models/restaurantImageTypes.model';
import { validateMediaTotalWithMaxAllowed } from '@/utils/mediaValidationUtils';
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
jest.mock('@/models/restaurantImages.model', () => {
  const mockRestaurantImagesModel = {
    findRestaurantImageEntitiesByRestaurantID: jest.fn(),
    softDeleteRestaurantImages: jest.fn(),
    insertImages: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantImagesModel) };
});
jest.mock('@/services/mediaLibrary.service', () => {
  const mockMediaLibraryService = {
    insertMedia: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMediaLibraryService) };
});
jest.mock('@/services/restaurantImageTypes.service', () => {
  const mockRestaurantImageTypesService = {
    getAllRestaurantImageTypes: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantImageTypesService) };
});
jest.mock('@/utils/mediaValidationUtils', () => {
  return {
    __esModule: true,
    validateMediaTotalWithMaxAllowed: jest.fn(),
  };
});
jest.mock('@/configs/config', () => {
  const MOCKED_RESTAURANT_MEDIA = {
    MAX_RESTAURANT_PROFILE_IMAGES_VALUE: 10,
  };

  return {
    __esModule: true,
    RESTAURANT_MEDIA: MOCKED_RESTAURANT_MEDIA,
    default: MOCKED_RESTAURANT_MEDIA,
  };
});

const mockMediaLibraryService = new MediaLibraryService(new MediaLibraryModel());
const mockRestaurantImagesModel = new RestaurantImagesModel();
const mockRestaurantImageTypesService = new RestaurantImageTypesService(new RestaurantImageTypesModel());

const restaurantImagesService = new RestaurantImagesService(mockRestaurantImagesModel, mockMediaLibraryService, mockRestaurantImageTypesService);

describe('restaurantImagesService', () => {
  const RESTAURANT_ID = 1;
  const IMAGE_NAME = 'test_img.png';
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('getRestaurantImagesByRestaurantID', () => {
    const IMAGE_ID = 2;
    it('should successfully get restaurant images by restaurant id', async () => {
      const restaurantImageEntity = {
        restaurant_image_id: IMAGE_ID,
        image_url: IMAGE_NAME,
        restaurant_id: RESTAURANT_ID,
        restaurant_image_type_id: {
          type: RestaurantImageType.PROFILE,
        },
      };
      const EXPECTED = {
        imageID: IMAGE_ID,
        imageURL: IMAGE_NAME,
        restaurantID: RESTAURANT_ID,
        restaurantImageType: RestaurantImageType.PROFILE,
      };

      (mockRestaurantImagesModel.findRestaurantImageEntitiesByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        restaurantImageEntity,
      ]);

      const result = await restaurantImagesService.getRestaurantImagesByRestaurantID(RESTAURANT_ID);

      expect(mockRestaurantImagesModel.findRestaurantImageEntitiesByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(result).toEqual([EXPECTED]);
    });
    it('should throw a HttpException if any error occurs while getting restaurant images by restaurant id', async () => {
      (mockRestaurantImagesModel.findRestaurantImageEntitiesByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantImagesService.getRestaurantImagesByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantImagesModel.findRestaurantImageEntitiesByRestaurantID).toHaveBeenCalledTimes(1);
    });
  });
  describe('deleteImages', () => {
    const IMAGE_ID = 2;
    it('should successfully delete images with repository provided', async () => {
      await restaurantImagesService.deleteImages([IMAGE_ID], RESTAURANT_ID, {} as EntityManager);

      expect(mockRestaurantImagesModel.softDeleteRestaurantImages).toHaveBeenCalled();
    });
    it('should successfully delete images with no repository provided', async () => {
      await restaurantImagesService.deleteImages([IMAGE_ID], RESTAURANT_ID);

      expect(ormConnection).toHaveBeenCalled();
      expect(mockRestaurantImagesModel.softDeleteRestaurantImages).toHaveBeenCalled();
    });
    it('should throw a HttpException if any error occurs while deleting restaurant images', async () => {
      (mockRestaurantImagesModel.softDeleteRestaurantImages as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantImagesService.deleteImages([IMAGE_ID], RESTAURANT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantImagesModel.softDeleteRestaurantImages).toHaveBeenCalledTimes(1);
    });
  });
  describe('insertRestaurantImages', () => {
    const LOGO_IMAGE_ENTITY = {
      restaurant_id: RESTAURANT_ID,
      restaurant_image_type_id: 2,
      image_url: IMAGE_NAME,
    };
    it('should successfully insert images with repository provided', async () => {
      await restaurantImagesService.insertRestaurantImages([LOGO_IMAGE_ENTITY], {} as EntityManager);

      expect(mockRestaurantImagesModel.insertImages).toHaveBeenCalledWith([LOGO_IMAGE_ENTITY], {});
    });
    it('should successfully insert images with no repository provided', async () => {
      await restaurantImagesService.insertRestaurantImages([LOGO_IMAGE_ENTITY]);

      expect(ormConnection).toHaveBeenCalled();
      expect(mockRestaurantImagesModel.insertImages).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while inserting images', async () => {
      (mockRestaurantImagesModel.insertImages as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantImagesService.insertRestaurantImages([LOGO_IMAGE_ENTITY], {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantImagesModel.insertImages).toHaveBeenCalledTimes(1);
    });
  });
  describe('validateRestaurantImagesByType', () => {
    const IMAGE = {
      imageID: 1,
      imageURL: IMAGE_NAME,
      restaurantID: RESTAURANT_ID,
      restaurantImageType: RestaurantImageType.LOGO,
    };
    const logoImage = 'logo.jpeg';
    it('should successfully validate restaurant image by logo type', () => {
      // called without throwing exception indicates the image is value
      restaurantImagesService.validateRestaurantImagesByType(
        [IMAGE],
        [2],
        [RestaurantImageType.LOGO, RestaurantImageType.THUMBNAIL, RestaurantImageType.MENU_COVER],
        { logo: '', thumbnail: '', cover_photo: '' },
      );
    });
    it('should successfully validate restaurant image by type if image type logo exists but is being deleted', () => {
      // called without throwing exception indicates the image is value
      restaurantImagesService.validateRestaurantImagesByType(
        [IMAGE],
        [IMAGE.imageID],
        [RestaurantImageType.LOGO, RestaurantImageType.THUMBNAIL, RestaurantImageType.MENU_COVER],
        { logo: logoImage, thumbnail: '', cover_photo: '' },
      );
    });
    it('should throw 409 Resource Conflict if image being uploaded already exists and is not being deleted', async () => {
      try {
        restaurantImagesService.validateRestaurantImagesByType(
          [IMAGE],
          [],
          [RestaurantImageType.LOGO, RestaurantImageType.THUMBNAIL, RestaurantImageType.MENU_COVER],
          { logo: logoImage, thumbnail: '', cover_photo: '' },
        );
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('validateImagesToDelete', () => {
    it('should successfully validate image id to be deleted exists', () => {
      // called without throwing exception indicates the image is value
      restaurantImagesService.validateImagesToDelete([1], [1]);
    });
    it('should throw 404 Not Found if id for deletion provided but image does not exist', () => {
      try {
        restaurantImagesService.validateImagesToDelete([1], [2]);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('setupInsertingRestaurantImages', () => {
    const mockRestaurantImages: RestaurantImageEntity[] = [
      {
        restaurant_image_id: 1,
        restaurant_id: 1,
        image_url: 'image1.jpeg',
        restaurant_image_type_id: 1,
      },
      {
        restaurant_image_id: 1,
        restaurant_id: 1,
        image_url: 'image2.jpeg',
        restaurant_image_type_id: 2,
      },
    ];
    const mockMediaEntities: MediaEntity[] = [
      new MediaEntity('image1.jpeg', IMAGE_TYPE_ID, RESTAURANT_ID, 'some_image', 1),
      new MediaEntity('image2.jpeg', IMAGE_TYPE_ID, RESTAURANT_ID, null, 2),
    ];
    it('should return an empty array when mediaLibrary is empty', async () => {
      const images: RestaurantImageEntity[] = [];
      const mediaLibrary: MediaEntity[] = [];
      const result = await restaurantImagesService.setupInsertingRestaurantImages(images, mediaLibrary);
      expect(result).toEqual([]);

      expect(mockMediaLibraryService.insertMedia).not.toHaveBeenCalled();
      expect(mockRestaurantImagesModel.insertImages).not.toHaveBeenCalled();
    });
    it('should insert media library and restaurant images and set up foreign keys to media library', async () => {
      (mockMediaLibraryService.insertMedia as jest.Mock).mockResolvedValue(mockMediaEntities);
      (mockRestaurantImagesModel.insertImages as jest.Mock).mockResolvedValue(mockRestaurantImages);

      const result = await restaurantImagesService.setupInsertingRestaurantImages(mockRestaurantImages, mockMediaEntities, {} as EntityManager);
      expect(result).toEqual([mockMediaEntities, mockRestaurantImages]);

      expect(mockMediaLibraryService.insertMedia).toHaveBeenCalledWith(mockMediaEntities, {} as EntityManager);
      expect(mockRestaurantImagesModel.insertImages).toHaveBeenCalledWith(mockRestaurantImages, {} as EntityManager);
    });
    it('should insert gallery images for media library but not restaurant images (empty array restaurant images) ', async () => {
      (mockMediaLibraryService.insertMedia as jest.Mock).mockResolvedValue(mockMediaEntities);
      (mockRestaurantImagesModel.insertImages as jest.Mock).mockResolvedValue([]);

      const result = await restaurantImagesService.setupInsertingRestaurantImages([], mockMediaEntities, {} as EntityManager);
      expect(result).toEqual([mockMediaEntities, []]);

      expect(mockMediaLibraryService.insertMedia).toHaveBeenCalledWith(mockMediaEntities, {} as EntityManager);
      expect(mockRestaurantImagesModel.insertImages).not.toHaveBeenCalled();
    });
    it('should throw a HttpException if any error occurs while inserting media library and restaurant iamges', async () => {
      (mockMediaLibraryService.insertMedia as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantImagesService.setupInsertingRestaurantImages([], mockMediaEntities, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMediaLibraryService.insertMedia).toHaveBeenCalledWith(mockMediaEntities, {} as EntityManager);
      expect(mockRestaurantImagesModel.insertImages).not.toHaveBeenCalled();
    });
  });
  describe('setupRestaurantAndMediaLibraryImages', () => {
    const RESTAURANT_ID = 1;
    const mockRestaurantImages: RestaurantImageEntity[] = [
      {
        restaurant_id: RESTAURANT_ID,
        image_url: 'profile1.jpeg',
        restaurant_image_type_id: 1,
      },
      {
        restaurant_id: RESTAURANT_ID,
        image_url: 'profile2.jpeg',
        restaurant_image_type_id: 1,
      },
      {
        restaurant_id: RESTAURANT_ID,
        image_url: 'logo.jpeg',
        restaurant_image_type_id: 2,
      },
      {
        restaurant_id: RESTAURANT_ID,
        image_url: 'thumbnail.jpeg',
        restaurant_image_type_id: 4,
      },
      {
        restaurant_id: RESTAURANT_ID,
        image_url: 'menuCover.jpeg',
        restaurant_image_type_id: 5,
      },
    ];
    const mediaEntities: MediaEntity[] = [
      new MediaEntity('profile1.jpeg', 1, RESTAURANT_ID),
      new MediaEntity('profile2.jpeg', 1, RESTAURANT_ID),
      new MediaEntity('logo.jpeg', 1, RESTAURANT_ID),
      new MediaEntity('thumbnail.jpeg', 1, RESTAURANT_ID),
      new MediaEntity('menuCover.jpeg', 1, RESTAURANT_ID),
    ];
    const restaurantImageTypeEntity: RestaurantImageTypeEntity[] = [
      {
        restaurant_image_type_id: 1,
        type: RestaurantImageType.PROFILE,
        description: 'profile',
      },
      {
        restaurant_image_type_id: 2,
        type: RestaurantImageType.LOGO,
        description: 'logo',
      },
      {
        restaurant_image_type_id: 4,
        type: RestaurantImageType.THUMBNAIL,
        description: 'thumbnail',
      },
      {
        restaurant_image_type_id: 5,
        type: RestaurantImageType.MENU_COVER,
        description: 'cover_photo',
      },
    ];
    const profileImages = ['profile1.jpeg', 'profile2.jpeg'];
    const logoImage = 'logo.jpeg';
    const thumbnailImage = 'thumbnail.jpeg';
    const menuCoverImage = 'menuCover.jpeg';

    it('should get all restaurant image types and set up profile, logo, thumbnail, and menu cover images for media library and restaurant images tables', async () => {
      (mockRestaurantImageTypesService.getAllRestaurantImageTypes as jest.Mock).mockResolvedValue(restaurantImageTypeEntity);
      const result = await restaurantImagesService.setupRestaurantAndMediaLibraryImages(
        logoImage,
        menuCoverImage,
        profileImages,
        RESTAURANT_ID,
        thumbnailImage,
      );
      expect(result).toEqual([mockRestaurantImages, mediaEntities as MediaEntity[], restaurantImageTypeEntity]);

      expect(mockRestaurantImageTypesService.getAllRestaurantImageTypes).toHaveBeenCalledTimes(1);
    });
    it('should get empty values back for restaurant image types, and have no images uploaded', async () => {
      (mockRestaurantImageTypesService.getAllRestaurantImageTypes as jest.Mock).mockResolvedValue([]);

      const result = await restaurantImagesService.setupRestaurantAndMediaLibraryImages('', '', [], RESTAURANT_ID, '');
      expect(result).toEqual([[], [], []]);

      expect(mockRestaurantImageTypesService.getAllRestaurantImageTypes).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while inserting media library and restaurant iamges', async () => {
      (mockRestaurantImageTypesService.getAllRestaurantImageTypes as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantImagesService.setupRestaurantAndMediaLibraryImages(logoImage, menuCoverImage, profileImages, RESTAURANT_ID, thumbnailImage);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantImageTypesService.getAllRestaurantImageTypes).toHaveBeenCalledTimes(1);
    });
  });
  describe('validateRestaurantImages', () => {
    const RESTAURANT_ID = 1;
    const mockRestaurantImagesOneImage: RestaurantImageEntity[] = [
      {
        restaurant_image_id: 1,
        restaurant_id: RESTAURANT_ID,
        image_url: 'profile0.jpeg',
        restaurant_image_type_id: 1,
      },
    ];
    const mockRestaurantImagesFull: RestaurantImageEntity[] = [
      {
        restaurant_image_id: 1,
        restaurant_id: RESTAURANT_ID,
        image_url: 'profile1.jpeg',
        restaurant_image_type_id: 1,
      },
      {
        restaurant_image_id: 2,
        restaurant_id: RESTAURANT_ID,
        image_url: 'profile2.jpeg',
        restaurant_image_type_id: 1,
      },
      {
        restaurant_image_id: 3,
        restaurant_id: RESTAURANT_ID,
        image_url: 'logo.jpeg',
        restaurant_image_type_id: 2,
      },
      {
        restaurant_image_id: 4,
        restaurant_id: RESTAURANT_ID,
        image_url: 'thumbnail.jpeg',
        restaurant_image_type_id: 4,
      },
      {
        restaurant_image_id: 5,
        restaurant_id: RESTAURANT_ID,
        image_url: 'menuCover.jpeg',
        restaurant_image_type_id: 5,
      },
    ];
    const profileImages = ['profile1.jpeg', 'profile2.jpeg'];
    const logoImage = 'logo.jpeg';
    const thumbnailImage = 'thumbnail.jpeg';
    const menuCoverImage = 'menuCover.jpeg';

    const imagesToDelete = [1];

    it('should pass all validation for restaurant images', async () => {
      (mockRestaurantImagesModel.findRestaurantImageEntitiesByRestaurantID as jest.Mock).mockResolvedValue(mockRestaurantImagesOneImage);
      await restaurantImagesService.validateRestaurantImages(imagesToDelete, logoImage, menuCoverImage, profileImages, RESTAURANT_ID, thumbnailImage);

      expect(mockRestaurantImagesModel.findRestaurantImageEntitiesByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(validateMediaTotalWithMaxAllowed).toHaveBeenCalledWith(0, 1, 2, 10, 'Maximum number of profile images exceeded');
    });
    it('handles empty returned response for existing restaurant images, and also empty values for all uploaded restaurant images', async () => {
      (mockRestaurantImagesModel.findRestaurantImageEntitiesByRestaurantID as jest.Mock).mockResolvedValue([]);
      await restaurantImagesService.validateRestaurantImages([], '', '', [], RESTAURANT_ID, '');

      expect(mockRestaurantImagesModel.findRestaurantImageEntitiesByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(validateMediaTotalWithMaxAllowed).not.toHaveBeenCalled();
    });
    it('should throw a HttpException 404 if images to delete array does not contain an id of existing restaurant images id', async () => {
      (mockRestaurantImagesModel.findRestaurantImageEntitiesByRestaurantID as jest.Mock).mockResolvedValue(mockRestaurantImagesOneImage);

      try {
        await restaurantImagesService.validateRestaurantImages([1000], logoImage, menuCoverImage, profileImages, RESTAURANT_ID, thumbnailImage);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantImagesModel.findRestaurantImageEntitiesByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID);
    });
    it('should throw a HttpException 409 if restaurant image logo / thumbnail / mediaCover exist already', async () => {
      (mockRestaurantImagesModel.findRestaurantImageEntitiesByRestaurantID as jest.Mock).mockResolvedValue(mockRestaurantImagesFull);

      try {
        await restaurantImagesService.validateRestaurantImages([1], logoImage, menuCoverImage, profileImages, RESTAURANT_ID, thumbnailImage);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantImagesModel.findRestaurantImageEntitiesByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(validateMediaTotalWithMaxAllowed).toHaveBeenCalledWith(0, 1, 2, 10, 'Maximum number of profile images exceeded');
    });
    it('should throw a HttpException if any error occurs when validating restaurant images', async () => {
      (mockRestaurantImagesModel.findRestaurantImageEntitiesByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantImagesService.validateRestaurantImages(
          imagesToDelete,
          logoImage,
          menuCoverImage,
          profileImages,
          RESTAURANT_ID,
          thumbnailImage,
        );
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantImagesModel.findRestaurantImageEntitiesByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID);
    });
  });
});
