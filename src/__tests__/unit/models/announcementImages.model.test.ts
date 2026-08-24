import { ormConnection } from '@/utils/dbUtils';
import { HttpException, TapManagerError } from '@exceptions/HttpException';
import AnnouncementImagesModel from '@/models/announcementImages.model';

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

const announcementImagesModel = new AnnouncementImagesModel();

describe('announcementImagesModel', () => {
  const ANNOUNCEMENT_ID = 1;
  const IMAGE_ID = 2;
  const IMAGE_NAME = 'test_url.png';
  const ANNOUNCEMENT_IMAGE_ENTITY = {
    announcement_image_id: IMAGE_ID,
    announcement_id: ANNOUNCEMENT_ID,
    image_url: IMAGE_NAME,
    media_id: 123,
  };
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  describe('softDeleteAnnouncementImages', () => {
    const IMAGE_IDS = [1, 2];
    it('should successfully mark announcement images as deleted', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      await announcementImagesModel.softDeleteAnnouncementImages(IMAGE_IDS, ANNOUNCEMENT_ID);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs when marking announcement images as deleted', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw Error;
      });

      try {
        await announcementImagesModel.softDeleteAnnouncementImages(IMAGE_IDS, ANNOUNCEMENT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('insertAnnouncementMedia', () => {
    it('should insert announcement media', async () => {
      const mockedSave = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });
      await announcementImagesModel.insertAnnouncementMedia([ANNOUNCEMENT_IMAGE_ENTITY]);
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs when inserting announcement media', async () => {
      const mockedSave = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });

      try {
        await announcementImagesModel.insertAnnouncementMedia([ANNOUNCEMENT_IMAGE_ENTITY]);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('insertImage', () => {
    it('should successfully insert announcement image', async () => {
      const insert = jest.fn().mockResolvedValue({ raw: [ANNOUNCEMENT_IMAGE_ENTITY] });
      const CUSTOM_REPOSITORY: any = {
        insert,
      };
      const REPOSITORY: any = {
        getCustomRepository: () => CUSTOM_REPOSITORY,
      };

      const result = await announcementImagesModel.insertImage(ANNOUNCEMENT_IMAGE_ENTITY, REPOSITORY);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(ANNOUNCEMENT_IMAGE_ENTITY);
    });
    it('should throw 500 HttpException if any error occurs when inserting announcement image', async () => {
      const REPOSITORY: any = {
        getCustomRepository: () => {
          throw Error;
        },
      };

      try {
        await announcementImagesModel.insertImage(ANNOUNCEMENT_IMAGE_ENTITY, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
