import { TapManagerError } from '@/exceptions/HttpException';
import { EntityManager } from 'typeorm';
import DiscoveryContentURLsModel from '@/models/discoveryContentURLs.model';
import DiscoveryContentURLsService from '@/services/discoveryContentURLs.service';
import { DiscoveryContentURLsEntity } from '@/entities/discoveryContentURLs.entity';
import { PlatformENUMS, PlatformUrlTypeENUMS } from '@/enums/discoveryURLPlatforms';
import DiscoveryContentUrlPlatformsService from '@/services/discoveryContentUrlPlatforms.service';
import { DiscoveryContentUrlPlatformsModelInterface } from '@/interfaces/discoveryContentUrlPlatforms.interface';
import { CreateDiscoveryContentUrlsDto } from '@/dtos/discoveryContentUrls.dto';
import { DiscoveryContentUrlPlatformsEntity } from '@/entities/discoveryContentURLPlattforms.entity';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/discoveryContentURLs.model', () => {
  const mockDiscoveryContentURLsModel = {
    linkDiscoveryContentURLs: jest.fn(),
    deleteDiscoveryContentURLs: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDiscoveryContentURLsModel) };
});
jest.mock('@/services/discoveryContentUrlPlatforms.service', () => {
  const mockDiscoveryContentURLPlatformService = {
    getAllPlatforms: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDiscoveryContentURLPlatformService) };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const mockDiscoveryContentURLsModel = new DiscoveryContentURLsModel();
const mockDiscoveryContentPlatformURLsService = new DiscoveryContentUrlPlatformsService({} as DiscoveryContentUrlPlatformsModelInterface);
const discoveryContentURLsService = new DiscoveryContentURLsService(mockDiscoveryContentURLsModel, mockDiscoveryContentPlatformURLsService);

describe('discoveryContentURLsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('linkDiscoveryContentURLs', () => {
    const discoveryContenCategoryURLs: CreateDiscoveryContentUrlsDto[] = [
      {
        url: 'test',
        type: PlatformUrlTypeENUMS.ordering,
        platform: PlatformENUMS.grub_hub,
      },
    ];
    const mockDiscoveryContentsURLsModelResponse: DiscoveryContentURLsEntity[] = [
      {
        urlID: 1,
        url: 'test',
        urlType: PlatformUrlTypeENUMS.ordering,
      },
    ];
    const mockDiscoveryContentUrlPlatformsResponse: DiscoveryContentUrlPlatformsEntity[] = [
      {
        platformID: 10,
        name: PlatformENUMS.grub_hub,
      },
    ];
    const DISCOVERY_CONTENT_ID = 2;
    it('should successfully link discovery content urls', async () => {
      (mockDiscoveryContentPlatformURLsService.getAllPlatforms as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockDiscoveryContentUrlPlatformsResponse,
      );
      (mockDiscoveryContentURLsModel.linkDiscoveryContentURLs as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockDiscoveryContentsURLsModelResponse,
      );

      const result = await discoveryContentURLsService.linkDiscoveryContentURLs(
        DISCOVERY_CONTENT_ID,
        discoveryContenCategoryURLs,
        {} as EntityManager,
      );

      expect(mockDiscoveryContentURLsModel.linkDiscoveryContentURLs).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDiscoveryContentsURLsModelResponse);
    });
    it('should first delete existing content urls and then successfully link discovery content urls', async () => {
      (mockDiscoveryContentPlatformURLsService.getAllPlatforms as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockDiscoveryContentUrlPlatformsResponse,
      );
      (mockDiscoveryContentURLsModel.linkDiscoveryContentURLs as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockDiscoveryContentsURLsModelResponse,
      );

      const result = await discoveryContentURLsService.linkDiscoveryContentURLs(
        DISCOVERY_CONTENT_ID,
        discoveryContenCategoryURLs,
        {} as EntityManager,
        true,
      );

      expect(mockDiscoveryContentURLsModel.deleteDiscoveryContentURLs).toHaveBeenCalledTimes(1);
      expect(mockDiscoveryContentURLsModel.linkDiscoveryContentURLs).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDiscoveryContentsURLsModelResponse);
    });
    it('should throw HttpException 500 if an error occurs while linking discovery content urls', async () => {
      (mockDiscoveryContentURLsModel.linkDiscoveryContentURLs as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await discoveryContentURLsService.linkDiscoveryContentURLs(DISCOVERY_CONTENT_ID, discoveryContenCategoryURLs, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
