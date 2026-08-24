import { TapManagerError } from '@/exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import { EntityManager } from 'typeorm';
import { DiscoveryContentMediaEntity } from '@/entities/discoveryContentMedia.entity';
import DiscoveryContentMediaModel from '@/models/discoveryContentMedia.model';

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

const discoveryContentMediaModel = new DiscoveryContentMediaModel();
describe('discoveryContentMediasModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('linkDiscoveryContentMedia', () => {
    const discoveryContentMedia: DiscoveryContentMediaEntity[] = [
      {
        discoveryContentMediaID: 1,
        discoveryContentID: 2,
        mediaID: 3,
      },
    ];
    it('should link discovery content media', async () => {
      const mockedSave = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });
      await discoveryContentMediaModel.linkDiscoveryContentMedia(discoveryContentMedia);
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while linking discovery content media', async () => {
      const mockedSave = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });

      try {
        await discoveryContentMediaModel.linkDiscoveryContentMedia(discoveryContentMedia, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('deleteDiscoveryContentMedia', () => {
    const CONTENT_ID = 1;
    it('should delete discovery content media by contentID', async () => {
      const mockedDelete = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: mockedDelete,
      });
      await discoveryContentMediaModel.deleteDiscoveryContentMedia(CONTENT_ID);
      expect(mockedDelete).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while deleting discovery content media', async () => {
      const mockedDelete = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: mockedDelete,
      });

      try {
        await discoveryContentMediaModel.deleteDiscoveryContentMedia(CONTENT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
