import { HttpException } from '@exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import { EntityManager } from 'typeorm';
import AnnouncementImagesModel from '@/models/announcementImages.model';
import AnnouncementImagesService from '@services/announcementImages.service';
import { MediaEntity } from '@entities/media.entity';
import { AnnouncementImageEntity } from '@entities/announcementImage.entity';

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
jest.mock('@/models/announcementImages.model', () => {
  const mockRestaurantImagesModel = {
    findAnnouncementImageEntitiesByAnnouncementID: jest.fn(),
    softDeleteAnnouncementImages: jest.fn(),
    insertImage: jest.fn(),
    insertAnnouncementMedia: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantImagesModel) };
});
jest.mock('@/configs/config', () => {
  const MOCKED_APP_CONFIG = {
    SERVER: 'localhost',
    IMAGE_BUCKET: 'dummy',
    IMAGE_HOSTING_URL: 'https://dummy_image.jpeg',
  };

  return {
    __esModule: true,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
  };
});

const mockAnnouncementImagesModel = new AnnouncementImagesModel();
const announcementImagesService = new AnnouncementImagesService(mockAnnouncementImagesModel);

describe('announcementImagesService', () => {
  const ANNOUNCEMENT_ID = 1;
  const RESTAURANT_ID = 123;
  const IMAGE_NAME = 'test_img.png';
  const IMAGE_ID = 2;
  const ANNOUNCEMENT_IMAGE_ENTITY = {
    announcement_image_id: IMAGE_ID,
    announcement_id: ANNOUNCEMENT_ID,
    image_url: IMAGE_NAME,
  };
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('deleteImages', () => {
    const IMAGE_ID = 2;
    it('should successfully delete images with repository provided', async () => {
      await announcementImagesService.deleteImages([IMAGE_ID], ANNOUNCEMENT_ID, {} as EntityManager);

      expect(mockAnnouncementImagesModel.softDeleteAnnouncementImages).toHaveBeenCalled();
    });
    it('should successfully delete images with no repository provided', async () => {
      await announcementImagesService.deleteImages([IMAGE_ID], ANNOUNCEMENT_ID);

      expect(ormConnection).toHaveBeenCalled();
      expect(mockAnnouncementImagesModel.softDeleteAnnouncementImages).toHaveBeenCalled();
    });
    it('should throw a HttpException if any error occurs while deleting announcement images', async () => {
      (mockAnnouncementImagesModel.softDeleteAnnouncementImages as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await announcementImagesService.deleteImages([IMAGE_ID], ANNOUNCEMENT_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockAnnouncementImagesModel.softDeleteAnnouncementImages).toHaveBeenCalledTimes(1);
    });
  });
  describe('insertAnnouncementImage', () => {
    it('should successfully insert image with repository provided', async () => {
      await announcementImagesService.insertAnnouncementImage(ANNOUNCEMENT_IMAGE_ENTITY, {} as EntityManager);

      expect(mockAnnouncementImagesModel.insertImage).toHaveBeenCalledWith(ANNOUNCEMENT_IMAGE_ENTITY, {});
    });
    it('should successfully insert image with no repository provided', async () => {
      await announcementImagesService.insertAnnouncementImage(ANNOUNCEMENT_IMAGE_ENTITY);

      expect(ormConnection).toHaveBeenCalled();
      expect(mockAnnouncementImagesModel.insertImage).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while inserting image', async () => {
      (mockAnnouncementImagesModel.insertImage as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await announcementImagesService.insertAnnouncementImage(ANNOUNCEMENT_IMAGE_ENTITY, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockAnnouncementImagesModel.insertImage).toHaveBeenCalledTimes(1);
    });
  });
  describe('insertAnnouncementMedia', () => {
    it('should successfully insert media with repository provided', async () => {
      await announcementImagesService.insertAnnouncementMedia(
        ANNOUNCEMENT_ID,
        [new MediaEntity('test.url', 1, RESTAURANT_ID, 'some_image', IMAGE_ID)],
        {} as EntityManager,
      );

      expect(mockAnnouncementImagesModel.insertAnnouncementMedia).toHaveBeenCalledWith(
        [new AnnouncementImageEntity(ANNOUNCEMENT_ID, IMAGE_ID, 'test.url')],
        {},
      );
    });
    it('should successfully insert media with no repository provided', async () => {
      await announcementImagesService.insertAnnouncementMedia(ANNOUNCEMENT_ID, [
        new MediaEntity('test.url', 1, RESTAURANT_ID, 'some_image', IMAGE_ID),
      ]);

      expect(ormConnection).toHaveBeenCalled();
      expect(mockAnnouncementImagesModel.insertAnnouncementMedia).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while inserting media', async () => {
      (mockAnnouncementImagesModel.insertAnnouncementMedia as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await announcementImagesService.insertAnnouncementMedia(
          ANNOUNCEMENT_ID,
          [new MediaEntity('test.url', 1, RESTAURANT_ID, 'some_image', IMAGE_ID)],
          {} as EntityManager,
        );
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockAnnouncementImagesModel.insertAnnouncementMedia).toHaveBeenCalledTimes(1);
    });
  });
  describe('validateImagesToDelete', () => {
    it('should successfully validate image id to be deleted exists', () => {
      // called without throwing exception indicates the image is value
      announcementImagesService.validateImagesToDelete([1], [1]);
    });
    it('should throw 404 Not Found if id for deletion provided but image does not exist', () => {
      try {
        announcementImagesService.validateImagesToDelete([1], [2]);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
