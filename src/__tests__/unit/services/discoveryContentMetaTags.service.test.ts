import { TapManagerError } from '@/exceptions/HttpException';
import { EntityManager } from 'typeorm';
import DiscoveryContentMetaTagsModel from '@/models/discoveryContentMetaTags.model';
import DiscoveryContentMetaTagsService from '@/services/discoveryContentMetaTags.service';
import { DiscoveryContentMetaTagsEntity } from '@/entities/discoveryContentMetaTags.entity';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/discoveryContentMetaTags.model', () => {
  const mockDiscoveryContentMetaTagsModel = {
    linkDiscoveryContentMetaTags: jest.fn(),
    deleteDiscoveryContentMetaTags: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDiscoveryContentMetaTagsModel) };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const mockDiscoveryContentMetaTagsModel = new DiscoveryContentMetaTagsModel();
const discoveryContentMetaTagsService = new DiscoveryContentMetaTagsService(mockDiscoveryContentMetaTagsModel);

describe('discoveryContentMetaTagsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('linkDiscoveryContentMetaTags', () => {
    const DISCOVERY_CONTENT_ID = 100;
    const discoveryContenMetaTagsMedia: DiscoveryContentMetaTagsEntity[] = [
      {
        metaTagID: 1,
        tag: 'test',
      },
    ];
    const mockDiscoveryContentMetaTagsModelResponse: DiscoveryContentMetaTagsEntity[] = [
      {
        metaTagID: 1,
        tag: 'test',
      },
    ];
    it('should successfully link discovery content meta tags', async () => {
      (mockDiscoveryContentMetaTagsModel.linkDiscoveryContentMetaTags as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockDiscoveryContentMetaTagsModelResponse,
      );

      const result = await discoveryContentMetaTagsService.linkDiscoveryContentMetaTags(discoveryContenMetaTagsMedia, {} as EntityManager);

      expect(mockDiscoveryContentMetaTagsModel.linkDiscoveryContentMetaTags).toHaveBeenCalledWith(
        mockDiscoveryContentMetaTagsModelResponse,
        {} as EntityManager,
      );
      expect(result).toEqual(mockDiscoveryContentMetaTagsModelResponse);
    });
    it('should first delete meta tags and then successfully link discovery content meta tags', async () => {
      (mockDiscoveryContentMetaTagsModel.linkDiscoveryContentMetaTags as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockDiscoveryContentMetaTagsModelResponse,
      );

      const result = await discoveryContentMetaTagsService.linkDiscoveryContentMetaTags(
        discoveryContenMetaTagsMedia,
        {} as EntityManager,
        DISCOVERY_CONTENT_ID,
      );

      expect(mockDiscoveryContentMetaTagsModel.deleteDiscoveryContentMetaTags).toHaveBeenCalledTimes(1);
      expect(mockDiscoveryContentMetaTagsModel.linkDiscoveryContentMetaTags).toHaveBeenCalledWith(
        mockDiscoveryContentMetaTagsModelResponse,
        {} as EntityManager,
      );
      expect(result).toEqual(mockDiscoveryContentMetaTagsModelResponse);
    });
    it('should throw HttpException 500 if an error occurs while linking discovery content meta tags', async () => {
      (mockDiscoveryContentMetaTagsModel.linkDiscoveryContentMetaTags as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await discoveryContentMetaTagsService.linkDiscoveryContentMetaTags(discoveryContenMetaTagsMedia, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
