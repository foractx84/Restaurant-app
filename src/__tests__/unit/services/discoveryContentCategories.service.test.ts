import { TapManagerError } from '@/exceptions/HttpException';
import DiscoveryContentCategoriesService from '@/services/discoveryContentCategories.service';
import DiscoveryContentCategoriesModel from '@/models/discoveryContentCategories.model';
import { EntityManager } from 'typeorm';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/discoveryContentCategories.model', () => {
  const mockDiscoveryContentCategoriesModel = {
    getAllCategories: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDiscoveryContentCategoriesModel) };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const mockDiscoveryContentCategoriesModel = new DiscoveryContentCategoriesModel();
const discoveryContentCategoriesService = new DiscoveryContentCategoriesService(mockDiscoveryContentCategoriesModel);

describe('discoveryContentCategoriesService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllCategories', () => {
    const CONTENT_CATEGORY_ID = 123;
    const mockDiscoveryContentCategoriesModelResponse = {
      categoryID: CONTENT_CATEGORY_ID,
      name: 'test_name',
    };
    it('should successfully get discovery content categories', async () => {
      (mockDiscoveryContentCategoriesModel.getAllCategories as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockDiscoveryContentCategoriesModelResponse,
      );

      const result = await discoveryContentCategoriesService.getAllCategories({} as EntityManager);

      expect(mockDiscoveryContentCategoriesModel.getAllCategories).toHaveBeenCalledWith({} as EntityManager);
      expect(result).toEqual(mockDiscoveryContentCategoriesModelResponse);
    });
    it('should throw HttpException 500 if an error occurs while calling get discovery content categories', async () => {
      (mockDiscoveryContentCategoriesModel.getAllCategories as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await discoveryContentCategoriesService.getAllCategories({} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
