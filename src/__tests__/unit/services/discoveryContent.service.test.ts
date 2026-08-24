import { TapManagerError } from '@/exceptions/HttpException';
import DiscoveryContentModel from '@models/discoveryContent.model';
import DiscoveryContentService from '@services/discoveryContent.service';
import { DiscoveryContentEntity } from '@entities/discoveryContent.entity';
import { DiscoveryContentMediaServiceInterface } from '@/interfaces/discoveryContentMedia.interface';
import { DiscoveryContentURLsServiceInterface } from '@/interfaces/discoveryContentURLs.interface';
import { DiscoveryContentMetaTagsServiceInterface } from '@/interfaces/discoveryContentMetaTags.interface';
import { DiscoveryContentCategoryBucketsServiceInterface } from '@/interfaces/discoveryContentCategoryBuckets.interface';
import { EditDiscoveryContentDto } from '@/dtos/discoveryContent.dto';
import { ormConnection } from '@/utils/dbUtils';
import { PlatformENUMS, PlatformUrlTypeENUMS } from '@/enums/discoveryURLPlatforms';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/discoveryContent.model', () => {
  const mockDiscoveryContentModel = {
    softDeleteDiscoveryContent: jest.fn(),
    upsertDiscoveryContent: jest.fn(),
    editDiscoveryContent: jest.fn(),
    fetchDiscoveryContentByID: jest.fn(),
    getDiscoveryContentByRestaurantID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDiscoveryContentModel) };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const mockDiscoveryContentModel = new DiscoveryContentModel();
const discoveryContentService = new DiscoveryContentService(
  mockDiscoveryContentModel,
  {} as DiscoveryContentMediaServiceInterface,
  {} as DiscoveryContentURLsServiceInterface,
  {} as DiscoveryContentMetaTagsServiceInterface,
  {} as DiscoveryContentCategoryBucketsServiceInterface,
);

describe('discoveryContentService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('hideDiscoveryContent', () => {
    const CONTENT_ID = 123;
    it('should successfully hide discovery content', async () => {
      await discoveryContentService.hideDiscoveryContent({ discoveryContentID: CONTENT_ID } as DiscoveryContentEntity, true);

      expect(mockDiscoveryContentModel.upsertDiscoveryContent).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while hiding discovery content', async () => {
      (mockDiscoveryContentModel.upsertDiscoveryContent as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await discoveryContentService.hideDiscoveryContent({ discoveryContentID: CONTENT_ID } as DiscoveryContentEntity, true);
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

      const discoveryContentServiceResponse = [
        {
          discoveryContentID: 1,
          title: 'test',
          description: 'test description',
          media: [
            {
              mediaID: 3,
              mediaUrl: '',
              mediaType: 'image',
            },
          ],
          urls: [
            {
              urlID: 2,
              platform: 'grub_hub',
              type: 'ordering',
            },
          ],
          metaTags: [
            {
              tag: 'test_tag',
              metaTagID: 1,
            },
          ],
          categories: [
            {
              categoryName: 'dish_media',
              categoryBucketID: 1,
              categoryID: 1,
            },
          ],
        },
      ];

      (mockDiscoveryContentModel.getDiscoveryContentByRestaurantID as jest.Mock).mockResolvedValue(mockRawDiscoveryContent);

      const result = await discoveryContentService.getDiscoveryContent(RESTAURANT_ID);

      expect(result).toHaveLength(1);
      expect(result).toEqual(discoveryContentServiceResponse);
    });

    it('should throw HttpException 500 if an error occurs while fetching discovery content', async () => {
      (mockDiscoveryContentModel.getDiscoveryContentByRestaurantID as jest.Mock).mockRejectedValue(new Error());

      try {
        await discoveryContentService.getDiscoveryContent(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toBe(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('softDeleteDiscoveryContent', () => {
    const CONTENT_ID = 123;
    it('should successfully soft delete discovery content', async () => {
      await discoveryContentService.softDeleteDiscoveryContent({ discoveryContentID: CONTENT_ID } as DiscoveryContentEntity);

      expect(mockDiscoveryContentModel.softDeleteDiscoveryContent).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while soft deleting discovery content', async () => {
      (mockDiscoveryContentModel.softDeleteDiscoveryContent as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await discoveryContentService.softDeleteDiscoveryContent({ discoveryContentID: CONTENT_ID } as DiscoveryContentEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('createDiscoveryContent', () => {
    const RESTAURANT_ID = 1;
    const TITLE = 'test_title';
    const DESCRIPTION = 'test_description';
    const discoveryContent = {
      title: TITLE,
      description: DESCRIPTION,
      mediaIDs: [71, 3],
      urls: [
        {
          url: 'test urlX',
          platform: PlatformENUMS.grub_hub,
          type: PlatformUrlTypeENUMS.ordering,
        },
      ],
      metaTags: ['test_tags1', 'test_tags2'],
      categories: ['misc', 'vibes'],
    };
    it('should successfully create discovery content', async () => {
      const entity: DiscoveryContentEntity = new DiscoveryContentEntity(TITLE, 1, DESCRIPTION);

      const transaction = jest.fn();
      (transaction as jest.MockedFunction<any>).mockResolvedValueOnce(entity);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await discoveryContentService.createDiscoveryContent(discoveryContent, RESTAURANT_ID);

      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while creating discovery content', async () => {
      const transaction = jest.fn().mockImplementation(() => {
        throw Error;
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      try {
        await discoveryContentService.createDiscoveryContent(discoveryContent, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('editDiscoveryContent', () => {
    const CONTENT_ID = 123;
    const RESTAURANT_ID = 1;
    const editDiscoveryContentDto: EditDiscoveryContentDto = {
      discoveryContentID: CONTENT_ID,
      title: 'New Title',
      description: 'New Description',
      mediaIDs: [],
      categories: ['category1', 'category2'],
      urls: [{ url: 'https://grubhub.com', platform: PlatformENUMS.grub_hub, type: PlatformUrlTypeENUMS.reservation }],
      metaTags: ['tag1', 'tag2'],
    };
    const currentDiscoveryItem = new DiscoveryContentEntity('New Title', CONTENT_ID, 'New Description');
    currentDiscoveryItem.media = [];
    currentDiscoveryItem.categoryBuckets = [];
    currentDiscoveryItem.urls = [];
    currentDiscoveryItem.metaTags = [];

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully edit discovery content', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });
      await discoveryContentService.editDiscoveryContent(currentDiscoveryItem, editDiscoveryContentDto, RESTAURANT_ID);

      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while editing discovery content', async () => {
      const transaction = jest.fn();

      (transaction as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await discoveryContentService.editDiscoveryContent(currentDiscoveryItem, editDiscoveryContentDto, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
