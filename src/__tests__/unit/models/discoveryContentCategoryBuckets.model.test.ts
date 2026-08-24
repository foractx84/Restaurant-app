import { TapManagerError } from '@/exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import { EntityManager } from 'typeorm';
import DiscoveryContentCategoryBucketsModel from '@/models/discoveryContentCategoryBuckets.model';
import { DiscoveryContentCategoryBucketsEntity } from '@/entities/discoveryContentBuckets.entity';

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
  return { __esModule: true, ormConnection: jest.fn() };
});

const discoveryContentCategoryBucketsModel = new DiscoveryContentCategoryBucketsModel();
describe('discoveryContentCategoriesModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('linkDiscoveryContentCategoryBuckets', () => {
    const discoveryContentCategoryBuckets: DiscoveryContentCategoryBucketsEntity[] = [
      {
        bucketID: 1,
        contentID: 2,
      },
    ];
    it('should link discovery content category buckets', async () => {
      const mockedSave = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });
      await discoveryContentCategoryBucketsModel.linkDiscoveryContentCategoryBuckets(discoveryContentCategoryBuckets);
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while linking discovery content category buckets', async () => {
      const mockedSave = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });

      try {
        await discoveryContentCategoryBucketsModel.linkDiscoveryContentCategoryBuckets(discoveryContentCategoryBuckets, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('deleteDiscoveryContentCategoryBuckets', () => {
    const CONTENT_ID = 1;
    it('should delete discovery content category buckets by contentID', async () => {
      const mockedDelete = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: mockedDelete,
      });
      await discoveryContentCategoryBucketsModel.deleteDiscoveryContentCategoryBuckets(CONTENT_ID);
      expect(mockedDelete).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while deleting discovery content category buckets', async () => {
      const mockedDelete = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: mockedDelete,
      });

      try {
        await discoveryContentCategoryBucketsModel.deleteDiscoveryContentCategoryBuckets(CONTENT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
