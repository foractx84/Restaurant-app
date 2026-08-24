import { TapManagerError } from '@/exceptions/HttpException';
import { EntityManager } from 'typeorm';
import DiscoveryContentMediaModel from '@/models/discoveryContentMedia.model';
import DiscoveryContentMediaService from '@/services/discoveryContentMedia.service';
import { DiscoveryContentMediaEntity } from '@/entities/discoveryContentMedia.entity';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/discoveryContentMedia.model', () => {
  const mockDiscoveryContentMediaModel = {
    linkDiscoveryContentMedia: jest.fn(),
    deleteDiscoveryContentMedia: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDiscoveryContentMediaModel) };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const mockDiscoveryContentMediaModel = new DiscoveryContentMediaModel();
const discoveryContentMediaService = new DiscoveryContentMediaService(mockDiscoveryContentMediaModel);

describe('discoveryContentMediaService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('linkDiscoveryContentMedia', () => {
    const discoveryContenCategoryMedia: DiscoveryContentMediaEntity[] = [
      {
        discoveryContentID: 12,
        mediaID: 100,
      },
    ];
    const mockDiscoveryContentMediaModelResponse: DiscoveryContentMediaEntity[] = [
      {
        discoveryContentID: 12,
        mediaID: 100,
      },
    ];
    it('should successfully link discovery content media', async () => {
      (mockDiscoveryContentMediaModel.linkDiscoveryContentMedia as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockDiscoveryContentMediaModelResponse,
      );

      const result = await discoveryContentMediaService.linkDiscoveryContentMedia(discoveryContenCategoryMedia, {} as EntityManager);

      expect(mockDiscoveryContentMediaModel.linkDiscoveryContentMedia).toHaveBeenCalledWith(
        mockDiscoveryContentMediaModelResponse,
        {} as EntityManager,
      );
      expect(result).toEqual(mockDiscoveryContentMediaModelResponse);
    });
    it('should first delete existing media and then successfully link discovery content media', async () => {
      (mockDiscoveryContentMediaModel.linkDiscoveryContentMedia as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockDiscoveryContentMediaModelResponse,
      );

      const result = await discoveryContentMediaService.linkDiscoveryContentMedia(discoveryContenCategoryMedia, {} as EntityManager, true);

      expect(mockDiscoveryContentMediaModel.deleteDiscoveryContentMedia).toHaveBeenCalledTimes(1);
      expect(mockDiscoveryContentMediaModel.linkDiscoveryContentMedia).toHaveBeenCalledWith(
        mockDiscoveryContentMediaModelResponse,
        {} as EntityManager,
      );
      expect(result).toEqual(mockDiscoveryContentMediaModelResponse);
    });
    it('should throw HttpException 500 if an error occurs while linking discovery content media', async () => {
      (mockDiscoveryContentMediaModel.linkDiscoveryContentMedia as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await discoveryContentMediaService.linkDiscoveryContentMedia(discoveryContenCategoryMedia, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
