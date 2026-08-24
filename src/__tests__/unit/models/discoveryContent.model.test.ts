import { TapManagerError } from '@/exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import { DiscoveryContentEntity } from '@entities/discoveryContent.entity';
import DiscoveryContentModel from '@models/discoveryContent.model';

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

const discoveryContentModel = new DiscoveryContentModel();
describe('discoveryContentModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('fetchDiscoveryContentByID', () => {
    const CONTENT_ID = 123;
    const mockDiscoveryItem = {
      discoveryContentID: 47,
      description: 'string',
      title: 'stringX',
      isHidden: false,
      restaurantID: 1,
      media: [
        {
          discoveryContentID: 47,
          mediaLibraryID: 3,
          discoveryContentMediaID: 93,
          listOrder: 1,
          mediaLibrary: {
            media_type_id: 1,
            media_url: '9abb6429-51bb-4876-9a29-8208712c1883.jpeg',
            restaurant_id: 1,
            name: '9abb6429-51bb-4876-9a29-8208712c1883.jpeg',
            media_id: 3,
            description: null,
            created_at: '2024-05-17T13:36:29.088Z',
            deleted_at: null,
            media_type: {
              media_type_id: 1,
              type: 'image',
              description: 'identity type of media as image',
            },
          },
        },
      ],
      urls: [
        {
          url: 'test urlX',
          urlType: 'ordering',
          contentID: 47,
          platformID: 1,
          urlID: 47,
          platform: {
            name: 'grub_hub',
            icon: 'grubhub_icon.webp',
            platformID: 1,
          },
        },
      ],
      metaTags: [
        {
          tag: 'test_tags2',
          metaTagID: 67,
          contentID: 47,
        },
      ],
      categoryBuckets: [
        {
          bucketID: 67,
          contentID: 47,
          categoryID: 6,
          category: {
            name: 'vibes',
            categoryID: 6,
          },
        },
      ],
    };
    it('should get discovery content by discovery content id', async () => {
      const getRepository = jest.fn();
      const getOne = jest.fn();
      const orderBy = jest.fn(() => ({ getOne }));
      const andWhere1 = jest.fn(() => ({ orderBy }));
      const where = jest.fn(() => ({ andWhere: andWhere1 }));
      const leftJoinAndSelect8 = jest.fn(() => ({ where }));
      const leftJoinAndSelect7 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect8 }));
      const leftJoinAndSelect6 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect7 }));
      const leftJoinAndSelect5 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect6 }));
      const leftJoinAndSelect4 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect5 }));
      const leftJoinAndSelect3 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect4 }));
      const leftJoinAndSelect2 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect3 }));
      const leftJoinAndSelect = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));

      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });

      getRepository.mockImplementation(() => createQueryBuilder);
      (getOne as jest.MockedFunction<any>).mockResolvedValue(mockDiscoveryItem);

      const result = await discoveryContentModel.fetchDiscoveryContentByID(CONTENT_ID);

      expect(getOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDiscoveryItem);
    });
    it('should throw HttpException 500 if an error occurs while fetching discovery content by id', async () => {
      const createQueryBuilder = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        createQueryBuilder,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });

      try {
        await discoveryContentModel.fetchDiscoveryContentByID(CONTENT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });

  describe('getDiscoveryContent', () => {
    const RESTAURANT_ID = 123;
    it('should get discovery content for a restaurant', async () => {
      const mockRawDiscoveryContent = [
        {
          discoveryContentID: 1,
          description: 'test description',
          title: 'test',
          restaurant: {
            deleted: false,
            restaurant_id: RESTAURANT_ID,
          },
          media: [
            {
              discoveryContentID: 1,
              mediaID: 3,
              discoveryContentMediaID: 1,
              listOrder: 0,
              mediaLibrary: {
                media_url: '9abb6429-51bb-4876-9a29-8208712c1883.jpeg',
                name: '9abb6429-51bb-4876-9a29-8208712c1883.jpeg',
                deleted_at: null,
                media_type: {
                  type: 'image',
                },
              },
            },
          ],
          urls: [
            {
              url: 'https://test_url2.com',
              urlType: 'ordering',
              contentID: 1,
              platformID: 1,
              urlID: 2,
              platform: {
                name: 'grub_hub',
                icon: 'grubhub_icon.webp',
                platformID: 1,
              },
            },
          ],
          metaTags: [
            {
              tag: 'test_tag',
              metaTagID: 1,
              contentID: 1,
            },
          ],
          categoryBuckets: [
            {
              bucketID: 1,
              contentID: 1,
              categoryID: 1,
              category: {
                name: 'dish_media',
                categoryID: 1,
              },
            },
          ],
        },
      ];

      const getMany = jest.fn();
      const orderBy = jest.fn(() => ({ getMany }));
      const andWhere2 = jest.fn(() => ({ orderBy }));
      const andWhere1 = jest.fn(() => ({ andWhere: andWhere2 }));
      const where = jest.fn(() => ({ andWhere: andWhere1 }));
      const leftJoinAndSelect9 = jest.fn(() => ({ where }));
      const leftJoinAndSelect8 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect9 }));
      const leftJoinAndSelect7 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect8 }));
      const leftJoinAndSelect6 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect7 }));
      const leftJoinAndSelect5 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect6 }));
      const leftJoinAndSelect4 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect5 }));
      const leftJoinAndSelect3 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect4 }));
      const leftJoinAndSelect2 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect3 }));
      const leftJoinAndSelect = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));

      const createQueryBuilder = jest.fn(() => ({
        leftJoinAndSelect,
      }));

      // Mock the repository to return the createQueryBuilder chain
      const REPOSITORY = { createQueryBuilder };

      // Mock the database connection to return the repository
      (ormConnection as jest.Mock).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });

      // Mock the final `getMany` call in the chain
      (getMany as jest.Mock).mockResolvedValueOnce(mockRawDiscoveryContent);

      const result = await discoveryContentModel.getDiscoveryContentByRestaurantID(RESTAURANT_ID);
      expect(result).toEqual(mockRawDiscoveryContent);
    });

    it('should throw HttpException 500 if an error occurs while fetching discovery content', async () => {
      const getRepository = jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockRejectedValueOnce(new Error()),
        }),
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository,
      });

      try {
        await discoveryContentModel.getDiscoveryContentByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('softDeleteDiscoveryContent', () => {
    const CONTENT_ID = 123;
    it('should soft delete discovery content', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });
      await discoveryContentModel.softDeleteDiscoveryContent(CONTENT_ID);
      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while soft deleting discovery content', async () => {
      const update = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      try {
        await discoveryContentModel.softDeleteDiscoveryContent(CONTENT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('upsertDiscoveryContent', () => {
    const DISCOVERY_CONTENT: DiscoveryContentEntity = new DiscoveryContentEntity('Test', 123, 'This is a test');
    it('should upsert discovery content', async () => {
      const mockedSave = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });
      await discoveryContentModel.upsertDiscoveryContent(DISCOVERY_CONTENT);
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while upserting discovery content', async () => {
      const mockedSave = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });

      try {
        await discoveryContentModel.upsertDiscoveryContent(DISCOVERY_CONTENT);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
