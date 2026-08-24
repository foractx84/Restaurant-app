import { HttpException } from '@/exceptions/HttpException';
import { ormConnection } from '@/utils/dbUtils';
import MediaLibraryModel from '@/models/mediaLibrary.model';
import { MediaEntity } from '@/entities/media.entity';

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
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const mediaLibraryModel = new MediaLibraryModel();

describe('MediaLibraryModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('insertMedia', () => {
    // mock model response
    const MEDIA_ID = 1;
    const RESTAURANT_ID = 2;
    const MEDIA_TYPE_ID = 3;
    const mockModelResponse: MediaEntity[] = [
      new MediaEntity('test.jpeg', MEDIA_TYPE_ID, RESTAURANT_ID, 'some_image', MEDIA_ID),
      new MediaEntity('test2.jpeg', MEDIA_TYPE_ID, RESTAURANT_ID, null, MEDIA_ID),
    ];
    it('should successfully insert media entities', async () => {
      const insert = jest.fn().mockResolvedValue({ raw: mockModelResponse });
      const CUSTOM_REPOSITORY: any = {
        insert,
      };
      const REPOSITORY: any = {
        getCustomRepository: () => CUSTOM_REPOSITORY,
      };
      const result = await mediaLibraryModel.insertMedia(mockModelResponse, REPOSITORY);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw a HttpException if any error occurs while inserting media entities', async () => {
      const insert = jest.fn();

      (insert as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mediaLibraryModel.insertMedia(mockModelResponse);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getMediaByRestaurantID', () => {
    // mock model response
    const MEDIA_ID = 1;
    const RESTAURANT_ID = 2;
    const MEDIA_TYPE_ID = 3;
    const mockModelResponse: MediaEntity[] = [
      new MediaEntity('test.jpeg', MEDIA_TYPE_ID, RESTAURANT_ID, 'some_image', MEDIA_ID),
      new MediaEntity('test2.jpeg', MEDIA_TYPE_ID, RESTAURANT_ID, null, MEDIA_ID),
    ];
    it('should successfully get media entities by restaurantID', async () => {
      const find = jest.fn();
      const REPOSITORY: any = {
        find,
      };
      (find as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await mediaLibraryModel.getMediaByRestaurantID(RESTAURANT_ID, 'createdAt', REPOSITORY);

      expect(find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw a HttpException if any error occurs while getting media entities by restaurantID', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mediaLibraryModel.getMediaByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
  });
  describe('softDeleteMediaByMediaID', () => {
    // mock model response
    const MEDIA_ID = 1;
    it('should successfully soft delete media entity by mediaID', async () => {
      const update = jest.fn();
      const REPOSITORY: any = {
        update,
      };

      await mediaLibraryModel.softDeleteMediaByMediaID(MEDIA_ID, REPOSITORY);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while soft deleting media entity by mediaID', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mediaLibraryModel.softDeleteMediaByMediaID(MEDIA_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(ormConnection).toHaveBeenCalledTimes(1);

      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('getMediaByMediaID', () => {
    const MEDIA_ID = 1;
    const mockMediaEntity = {
      media_id: 1,
      menuItemVideoThumbnail: [],
      announcementsMedia: [],
    };
    it('should get media by mediaID of media library', async () => {
      const getRepository = jest.fn();
      const getOne = jest.fn();
      const andWhere1 = jest.fn(() => ({ getOne }));
      const where1 = jest.fn(() => ({ andWhere: andWhere1 }));
      const leftJoinAndSelect3 = jest.fn(() => ({ where: where1 }));
      const leftJoinAndSelect2 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect3 }));
      const leftJoinAndSelect1 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect: leftJoinAndSelect1,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      (getOne as jest.MockedFunction<any>).mockResolvedValueOnce(mockMediaEntity);

      getRepository.mockImplementation(() => createQueryBuilder);

      const result = await mediaLibraryModel.getMediaByMediaID(MEDIA_ID);

      expect(getOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMediaEntity);
    });
    it('should throw HttpException 500 if an error occurs while getting media by mediaID of media library', async () => {
      const REPOSITORY = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });

      try {
        await mediaLibraryModel.getMediaByMediaID(MEDIA_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getMediaByMediaURL', () => {
    const MEDIA_URL = 'some_uuid.mp4';
    const MEDIA_ID = 1;
    const mockMediaEntity: Partial<MediaEntity> = {
      media_url: MEDIA_URL,
      media_id: MEDIA_ID,
      deleted_at: null,
      menuItemVideoThumbnail: [],
      announcementsMedia: [],
    };
    it('should get media by mediaURL of undeleted media of media library', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      (findOne as jest.MockedFunction<any>).mockResolvedValueOnce(mockMediaEntity);

      const result = await mediaLibraryModel.getMediaByMediaURL(MEDIA_URL);

      expect(findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMediaEntity);
    });
    it('should get media by mediaURL of deleted media of media library', async () => {
      const findOne = jest.fn();
      mockMediaEntity.deleted_at = 'some_timestamp';
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      (findOne as jest.MockedFunction<any>).mockResolvedValueOnce(mockMediaEntity);

      const result = await mediaLibraryModel.getMediaByMediaURL(MEDIA_URL);

      expect(findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMediaEntity);
      mockMediaEntity.deleted_at = null;
    });
    it('should throw HttpException 500 if an error occurs while getting media by mediaURL of media library', async () => {
      const findOne = jest.fn();
      (findOne as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mediaLibraryModel.getMediaByMediaURL(MEDIA_URL);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
