import { TapManagerError } from '@/exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import { EntityManager } from 'typeorm';
import { DiscoveryContentURLsEntity } from '@/entities/discoveryContentURLs.entity';
import DiscoveryContentUrlPlatformsModel from '@/models/discoveryContentUrlPlatforms.model';

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

const discoveryContentURLPlatformsModel = new DiscoveryContentUrlPlatformsModel();
describe('discoveryContentURLPlatformsModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('getAllPlatforms', () => {
    it('should link discovery content urls', async () => {
      const find = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });
      await discoveryContentURLPlatformsModel.getAllPlatforms();
      expect(find).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while linking discovery content urls', async () => {
      const find = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      try {
        await discoveryContentURLPlatformsModel.getAllPlatforms({} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
