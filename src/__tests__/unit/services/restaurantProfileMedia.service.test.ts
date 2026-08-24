import { TapManagerError } from '@exceptions/HttpException';
import RestaurantProfileMediaService from '@/services/restaurantProfileMedia.service';
import RestaurantProfileMediaModel from '@/models/restaurantProfileMedia.model';
import { EntityManager } from 'typeorm';
import { RestaurantProfileMediaEntity } from '@/entities/restaurantProfileMedia.entity';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/models/restaurantProfileMedia.model', () => {
  const mockRestaurantProfileMediaModel = {
    insertRestaurantProfileMediaForPageSection: jest.fn(),
    softDeleteRestaurantProfileMediaBySectionID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantProfileMediaModel) };
});
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

const mocRestaurantMediaModel = new RestaurantProfileMediaModel();
const restaurantProfileMediaService = new RestaurantProfileMediaService(mocRestaurantMediaModel);

describe('restaurantProfileMediaService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const SECTION_ID = 1;
  const MEDIA_IDs = [1, 2];

  describe('insertRestaurantProfileMediaForPageSection', () => {
    const restaurantProfileMediaEntities: RestaurantProfileMediaEntity[] = [
      new RestaurantProfileMediaEntity(SECTION_ID, 1, null, 0),
      new RestaurantProfileMediaEntity(SECTION_ID, 2, null, 1),
    ];
    it('should successfully insert restaurant profile media entities', async () => {
      await restaurantProfileMediaService.insertRestaurantProfileMediaForPageSection(MEDIA_IDs, SECTION_ID, {} as EntityManager);

      expect(mocRestaurantMediaModel.insertRestaurantProfileMediaForPageSection).toHaveBeenCalledTimes(1);
      expect(mocRestaurantMediaModel.insertRestaurantProfileMediaForPageSection).toHaveBeenCalledWith(
        restaurantProfileMediaEntities,
        {} as EntityManager,
      );
    });
    it('should throw 500 HttpException if any error occurs while creating profile section', async () => {
      (mocRestaurantMediaModel.insertRestaurantProfileMediaForPageSection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantProfileMediaService.insertRestaurantProfileMediaForPageSection(MEDIA_IDs, SECTION_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mocRestaurantMediaModel.insertRestaurantProfileMediaForPageSection).toHaveBeenCalledTimes(1);
      expect(mocRestaurantMediaModel.insertRestaurantProfileMediaForPageSection).toHaveBeenCalledWith(
        restaurantProfileMediaEntities,
        {} as EntityManager,
      );
    });
  });
  describe('softDeleteRestaurantProfileMediaBySectionID ', () => {
    it('should successfully soft delete restaurant profile media by sectionID', async () => {
      await restaurantProfileMediaService.softDeleteRestaurantProfileMediaBySectionID(SECTION_ID, {} as EntityManager);

      expect(mocRestaurantMediaModel.softDeleteRestaurantProfileMediaBySectionID).toHaveBeenCalledTimes(1);
      expect(mocRestaurantMediaModel.softDeleteRestaurantProfileMediaBySectionID).toHaveBeenCalledWith(SECTION_ID, {} as EntityManager);
    });
    it('should throw 500 HttpException if any error occurs while soft deleting restaurant profile media by sectionID', async () => {
      (mocRestaurantMediaModel.softDeleteRestaurantProfileMediaBySectionID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantProfileMediaService.softDeleteRestaurantProfileMediaBySectionID(SECTION_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
