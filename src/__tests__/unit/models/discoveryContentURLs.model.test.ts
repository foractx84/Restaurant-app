import { TapManagerError } from '@/exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import { EntityManager } from 'typeorm';
import DiscoveryContentURLsModel from '@/models/discoveryContentURLs.model';
import { DiscoveryContentURLsEntity } from '@/entities/discoveryContentURLs.entity';
import { PlatformUrlTypeENUMS } from '@/enums/discoveryURLPlatforms';

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

const discoveryContentURLsModel = new DiscoveryContentURLsModel();
describe('discoveryContentURLsModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('linkDiscoveryContentMetaTags', () => {
    const discoveryContentURLS: DiscoveryContentURLsEntity[] = [
      {
        urlID: 1,
        url: 'test',
        urlType: PlatformUrlTypeENUMS.ordering,
      },
    ];
    it('should link discovery content urls', async () => {
      const mockedSave = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });
      await discoveryContentURLsModel.linkDiscoveryContentURLs(discoveryContentURLS);
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while linking discovery content urls', async () => {
      const mockedSave = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });

      try {
        await discoveryContentURLsModel.linkDiscoveryContentURLs(discoveryContentURLS, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('deleteDiscoveryContentURLs', () => {
    const CONTENT_ID = 1;
    it('should delete discovery content urls by contentID', async () => {
      const mockedDelete = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: mockedDelete,
      });
      await discoveryContentURLsModel.deleteDiscoveryContentURLs(CONTENT_ID);
      expect(mockedDelete).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while deleting discovery content meta tags', async () => {
      const mockedDelete = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: mockedDelete,
      });

      try {
        await discoveryContentURLsModel.deleteDiscoveryContentURLs(CONTENT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
