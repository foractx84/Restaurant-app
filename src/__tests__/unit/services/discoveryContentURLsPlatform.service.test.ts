import { TapManagerError } from '@/exceptions/HttpException';
import DiscoveryContentUrlPlatformsModel from '@/models/discoveryContentUrlPlatforms.model';
import DiscoveryContentUrlPlatformsService from '@/services/discoveryContentUrlPlatforms.service';
import { DiscoveryContentUrlPlatformsEntity } from '@/entities/discoveryContentURLPlattforms.entity';
import { PlatformENUMS } from '@/enums/discoveryURLPlatforms';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/discoveryContentUrlPlatforms.model', () => {
  const mockDiscoveryContentURLPlatformsModel = {
    getAllPlatforms: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDiscoveryContentURLPlatformsModel) };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const mockDiscoveryContentURLPlatformsModel = new DiscoveryContentUrlPlatformsModel();
const discoveryContentURLPlatformsService = new DiscoveryContentUrlPlatformsService(mockDiscoveryContentURLPlatformsModel);

describe('discoveryContentURLPlatformsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllPlatforms', () => {
    const mockDiscoveryContentCategoryBucketsModelResponse: DiscoveryContentUrlPlatformsEntity[] = [
      {
        platformID: 1,
        name: PlatformENUMS.grub_hub,
      },
    ];
    it('should successfully get discovery content url platforms', async () => {
      (mockDiscoveryContentURLPlatformsModel.getAllPlatforms as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockDiscoveryContentCategoryBucketsModelResponse,
      );

      const result = await discoveryContentURLPlatformsService.getAllPlatforms();

      expect(mockDiscoveryContentURLPlatformsModel.getAllPlatforms).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDiscoveryContentCategoryBucketsModelResponse);
    });
    it('should throw HttpException 500 if an error occurs while getting discovery content url platforms', async () => {
      (mockDiscoveryContentURLPlatformsModel.getAllPlatforms as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await discoveryContentURLPlatformsService.getAllPlatforms();
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
