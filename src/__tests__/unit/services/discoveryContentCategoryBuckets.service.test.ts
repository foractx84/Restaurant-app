import { TapManagerError } from '@/exceptions/HttpException';
import { EntityManager } from 'typeorm';
import DiscoveryContentCategoryBucketsModel from '@/models/discoveryContentCategoryBuckets.model';
import DiscoveryContentCategoryBucketsService from '@/services/discoveryContentCategoryBuckets.service';
import { DiscoveryContentCategoryBucketsEntity } from '@/entities/discoveryContentBuckets.entity';
import DiscoveryContentCategoriesService from '@/services/discoveryContentCategories.service';
import { DiscoveryContentCategoriesModelInterface } from '@/interfaces/discoveryContentCategories.interface';
import { DiscoveryContentCategoriesEntity } from '@/entities/discoveryContentCategories.entity';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/discoveryContentCategoryBuckets.model', () => {
  const mockDiscoveryContentCategoryBucketsModel = {
    deleteDiscoveryContentCategoryBuckets: jest.fn(),
    linkDiscoveryContentCategoryBuckets: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDiscoveryContentCategoryBucketsModel) };
});
jest.mock('@/services/discoveryContentCategories.service', () => {
  const mockDiscoveryContentCategoriesService = {
    getAllCategories: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDiscoveryContentCategoriesService) };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const mockDiscoveryContentCategoryBucketsModel = new DiscoveryContentCategoryBucketsModel();
const mockDiscoveryContentCategoriesService = new DiscoveryContentCategoriesService({} as DiscoveryContentCategoriesModelInterface);
const discoveryContentCategoriesBucketsService = new DiscoveryContentCategoryBucketsService(
  mockDiscoveryContentCategoryBucketsModel,
  mockDiscoveryContentCategoriesService,
);

describe('discoveryContentCategoriesService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllCategories', () => {
    const discoveryContenCategoryBuckets: string[] = ['test_category'];
    const mockDiscoveryContentCategoryBucketsModelResponse: DiscoveryContentCategoryBucketsEntity[] = [
      {
        bucketID: 1,
      },
    ];
    const mockDiscoveryContentCategoriesServiceResponse: DiscoveryContentCategoriesEntity[] = [
      {
        categoryID: 9,
        name: 'test_category',
      },
    ];
    const DISCOVERY_CONTENT_ID = 2;
    it('should successfully link discovery content category buckets', async () => {
      (mockDiscoveryContentCategoriesService.getAllCategories as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockDiscoveryContentCategoriesServiceResponse,
      );
      (mockDiscoveryContentCategoryBucketsModel.linkDiscoveryContentCategoryBuckets as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockDiscoveryContentCategoryBucketsModelResponse,
      );

      const result = await discoveryContentCategoriesBucketsService.linkDiscoveryContentCategoryBuckets(
        DISCOVERY_CONTENT_ID,
        discoveryContenCategoryBuckets,
        {} as EntityManager,
      );

      expect(mockDiscoveryContentCategoriesService.getAllCategories).toHaveBeenCalledTimes(1);
      expect(mockDiscoveryContentCategoryBucketsModel.linkDiscoveryContentCategoryBuckets).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDiscoveryContentCategoryBucketsModelResponse);
    });
    it('should first delete existing category buckets and then successfully link discovery content category buckets', async () => {
      (mockDiscoveryContentCategoriesService.getAllCategories as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockDiscoveryContentCategoriesServiceResponse,
      );
      (mockDiscoveryContentCategoryBucketsModel.linkDiscoveryContentCategoryBuckets as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockDiscoveryContentCategoryBucketsModelResponse,
      );

      const result = await discoveryContentCategoriesBucketsService.linkDiscoveryContentCategoryBuckets(
        DISCOVERY_CONTENT_ID,
        discoveryContenCategoryBuckets,
        {} as EntityManager,
        DISCOVERY_CONTENT_ID,
      );

      expect(mockDiscoveryContentCategoryBucketsModel.deleteDiscoveryContentCategoryBuckets).toHaveBeenCalledTimes(1);
      expect(mockDiscoveryContentCategoriesService.getAllCategories).toHaveBeenCalledTimes(1);
      expect(mockDiscoveryContentCategoryBucketsModel.linkDiscoveryContentCategoryBuckets).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDiscoveryContentCategoryBucketsModelResponse);
    });
    it('should throw HttpException 500 if an error occurs while linking discovery content category buckets', async () => {
      (mockDiscoveryContentCategoriesService.getAllCategories as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await discoveryContentCategoriesBucketsService.linkDiscoveryContentCategoryBuckets(
          DISCOVERY_CONTENT_ID,
          discoveryContenCategoryBuckets,
          {} as EntityManager,
        );
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockDiscoveryContentCategoriesService.getAllCategories).toHaveBeenCalledTimes(1);
      expect(mockDiscoveryContentCategoryBucketsModel.linkDiscoveryContentCategoryBuckets).toHaveBeenCalledTimes(0);
    });
  });
});
