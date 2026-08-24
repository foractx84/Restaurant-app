import { TapManagerError } from '@/exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import { EntityManager } from 'typeorm';
import DiscoveryContentMetaTagsModel from '@/models/discoveryContentMetaTags.model';
import { DiscoveryContentMetaTagsEntity } from '@/entities/discoveryContentMetaTags.entity';

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
jest.mock('@/utils/dbUtils', () => {
  return { __esModule: true, ormConnection: jest.fn() };
});

const discoveryContentMetaTagsModel = new DiscoveryContentMetaTagsModel();
describe('discoveryContentMetaTagsModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('linkDiscoveryContentMetaTags', () => {
    const discoveryContentMetaTags: DiscoveryContentMetaTagsEntity[] = [
      {
        metaTagID: 1,
        tag: 'test',
      },
    ];
    it('should link discovery content meta tags', async () => {
      const mockedSave = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });
      await discoveryContentMetaTagsModel.linkDiscoveryContentMetaTags(discoveryContentMetaTags);
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while linking discovery content meta tags', async () => {
      const mockedSave = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });

      try {
        await discoveryContentMetaTagsModel.linkDiscoveryContentMetaTags(discoveryContentMetaTags);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('deleteDiscoveryContentMetaTags', () => {
    const CONTENT_ID = 1;
    it('should delete discovery content meta tags by contentID', async () => {
      const mockedDelete = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: mockedDelete,
      });
      await discoveryContentMetaTagsModel.deleteDiscoveryContentMetaTags(CONTENT_ID);
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
        await discoveryContentMetaTagsModel.deleteDiscoveryContentMetaTags(CONTENT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
