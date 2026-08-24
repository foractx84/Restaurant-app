import { NextFunction, Request, Response } from 'express-serve-static-core';
import DiscoveryContentService from '@services/discoveryContent.service';
import { DiscoveryContentModelInterface } from '@interfaces/discoveryContent.interface';
import DiscoveryContentController from '@controllers/discoveryContent.controller';
import { DiscoveryContentCategoryBucketsServiceInterface } from '@/interfaces/discoveryContentCategoryBuckets.interface';
import { DiscoveryContentMetaTagsServiceInterface } from '@/interfaces/discoveryContentMetaTags.interface';
import { DiscoveryContentURLsServiceInterface } from '@/interfaces/discoveryContentURLs.interface';
import { DiscoveryContentMediaServiceInterface } from '@/interfaces/discoveryContentMedia.interface';

jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/services/discoveryContent.service', () => {
  const mockDiscoveryContentService = {
    createDiscoveryContent: jest.fn(),
    hideDiscoveryContent: jest.fn(),
    softDeleteDiscoveryContent: jest.fn(),
    getDiscoveryContent: jest.fn(),
    editDiscoveryContent: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn(() => mockDiscoveryContentService),
  };
});

const mockDiscoveryContentService = new DiscoveryContentService(
  {} as DiscoveryContentModelInterface,
  {} as DiscoveryContentMediaServiceInterface,
  {} as DiscoveryContentURLsServiceInterface,
  {} as DiscoveryContentMetaTagsServiceInterface,
  {} as DiscoveryContentCategoryBucketsServiceInterface,
);
// create test controller object
const discoveryContentController = new DiscoveryContentController(mockDiscoveryContentService);

describe('discoveryContentController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('deleteDiscoveryContent', () => {
    it('should successfully delete discovery content', async () => {
      (mockDiscoveryContentService.softDeleteDiscoveryContent as jest.MockedFunction<any>).mockResolvedValueOnce(null);
      // mock a request needed by controller
      const mReq = {};

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        locals: {
          discoveryContent: {
            discoveryContentID: 1,
            title: 'test',
            description: 'test description',
            media: [
              {
                mediaID: 95,
                mediaUrl: 'https://resources-dev.trytaptab.com/images/27a0f1cc-339b-4750-8543-8a2936a0ae75.mp4',
                mediaType: 'video',
              },
              {
                mediaID: 3,
                mediaUrl: 'https://resources-dev.trytaptab.com/images/9abb6429-51bb-4876-9a29-8208712c1883.jpeg',
                mediaType: 'image',
              },
            ],
            urls: [
              {
                url: 'https://test_url2.com',
                urlID: 2,
                platform: 'grub_hub',
                type: 'ordering',
              },
              {
                url: 'https://test_url.com',
                urlID: 1,
                platform: 'grub_hub',
                type: 'reservation',
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
        },
      };

      // call on controller as the router would
      await discoveryContentController.deleteDiscoveryContent(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockDiscoveryContentService.softDeleteDiscoveryContent).toHaveBeenCalled();
    });
    it('should not delete modifier because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await discoveryContentController.deleteDiscoveryContent(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockDiscoveryContentService.softDeleteDiscoveryContent).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('getDiscoveryContent', () => {
    const RESTAURANT_ID = 123;

    it('should get discovery content for a restaurant', async () => {
      const discoveryContentEntities = [
        {
          discoveryContentID: 1,
          title: 'Content 1',
          description: 'Description 1',
        },
      ];

      (mockDiscoveryContentService.getDiscoveryContent as jest.MockedFunction<any>).mockResolvedValueOnce(discoveryContentEntities);
      const mReq = {};
      const mRes: Partial<Response> = {
        locals: { restaurantID: RESTAURANT_ID },
        json: jest.fn(),
      };
      const mNext = jest.fn();

      await discoveryContentController.getDiscoveryContent(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockDiscoveryContentService.getDiscoveryContent).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(mRes.json).toHaveBeenCalledWith(discoveryContentEntities);
      expect(mNext).not.toHaveBeenCalled();
    });

    it('should handle error while getting discovery content', async () => {
      const error = new Error('Something went wrong');
      (mockDiscoveryContentService.getDiscoveryContent as jest.MockedFunction<any>).mockRejectedValueOnce(error);
      const mReq = {};
      const mRes: Partial<Response> = {
        locals: { restaurantID: RESTAURANT_ID },
      };
      const mNext = jest.fn();

      await discoveryContentController.getDiscoveryContent(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockDiscoveryContentService.getDiscoveryContent).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(mNext).toHaveBeenCalledWith(error);
    });
  });
  describe('hideDiscoveryContent', () => {
    it('should successfully hide discovery content', async () => {
      (mockDiscoveryContentService.hideDiscoveryContent as jest.MockedFunction<any>).mockResolvedValueOnce(null);
      // mock a request needed by controller
      const mReq = { body: { hide: true } };

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        locals: { discoveryContent: { discoveryContentID: 1, title: 'TEST 1', description: 'description' } },
      };

      // call on controller as the router would
      await discoveryContentController.hideDiscoveryContent(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockDiscoveryContentService.hideDiscoveryContent).toHaveBeenCalled();
    });
    it('should not hide discovery content because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await discoveryContentController.hideDiscoveryContent(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockDiscoveryContentService.hideDiscoveryContent).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('createiscoveryContent', () => {
    const RESTAURANT_ID = 1;
    const reqBody = {
      title: 'test_title',
      description: 'test_description',
      media: [1],
      urls: [
        {
          url: 'test_url',
          type: 'test_type',
          platform: 'test_platform',
        },
      ],
      metaTags: ['test_tag'],
      categories: ['test_category'],
    };
    const mockServiceResponse = {
      title: 'test_title',
      description: 'test_description',
      media: [
        {
          mediaLibraryID: 1,
          discoveryContentMediaID: 8,
        },
      ],
      urls: [
        {
          url: 'test urlX',
          urlType: 'ordering',
          platformID: 1,
          urlID: 5,
        },
      ],
      metaTags: [
        {
          tag: 'test_tags3',
          metaTagID: 6,
        },
      ],
      categoryBuckets: [
        {
          categoryID: 7,
          bucketID: 5,
        },
        {
          categoryID: 6,
          bucketID: 6,
        },
      ],
    };
    it('should successfully create discovery content', async () => {
      let responseObject;

      // mock a request needed by controller
      const mReq = { body: reqBody } as unknown;
      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      (mockDiscoveryContentService.createDiscoveryContent as jest.MockedFunction<any>).mockResolvedValueOnce(mockServiceResponse);

      // call on controller as the router would
      await discoveryContentController.createDiscoveryContent(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      expect(mockDiscoveryContentService.createDiscoveryContent).toHaveBeenCalledWith(reqBody, RESTAURANT_ID);
      expect(responseObject).toEqual(mockServiceResponse);
    });
    it('should not create discovery content because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await discoveryContentController.createDiscoveryContent(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockDiscoveryContentService.createDiscoveryContent).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('editDiscoveryContent', () => {
    it('should successfully edit discovery content', async () => {
      (mockDiscoveryContentService.editDiscoveryContent as jest.MockedFunction<any>).mockResolvedValueOnce(null);
      const reqBody = {
        body: {
          discoveryContentID: 1,
          title: 'stringX',
          description: 'string',
          mediaIDs: [71, 3, 95, 96],
          urls: [
            {
              url: 'https://test_urlX.com',
              platform: 'grubhub',
              type: 'ordering',
            },
          ],
          metaTags: ['test_tags2', 'test_tags3'],
          categories: ['misc', 'vibes'],
        },
      };

      const mReq = { body: reqBody } as unknown;

      const mRes: Partial<Response> = {
        locals: { restaurantID: 1 },
      };

      const mNext = jest.fn();
      await discoveryContentController.editDiscoveryContent(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockDiscoveryContentService.editDiscoveryContent).toHaveBeenCalled();
    });
    it('should not edit discovery content because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await discoveryContentController.editDiscoveryContent(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockDiscoveryContentService.editDiscoveryContent).not.toHaveBeenCalled();
    });
  });
});
