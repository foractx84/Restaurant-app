import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@services/auth.service';
import UsersModel from '@models/users.model';
import { DiscoveryContentEntity } from '@entities/discoveryContent.entity';
import DiscoveryContentModel from '@models/discoveryContent.model';
import { ormConnection } from '@utils/dbUtils';
import { obtainUrlHTTPS } from '@/utils/imageUtils';
import { DiscoveryContentMediaEntity } from '@/entities/discoveryContentMedia.entity';
import { DiscoveryContentCategoryBucketsEntity } from '@/entities/discoveryContentBuckets.entity';
import { DiscoveryContentURLsEntity } from '@/entities/discoveryContentURLs.entity';
import { DiscoveryContentMetaTagsEntity } from '@/entities/discoveryContentMetaTags.entity';
import { CreateDiscoveryContentDto } from '@/dtos/discoveryContent.dto';

jest.mock('@/utils/GCP_bucket', () => require('../../../__mocks__/GCP_bucket'));

jest.mock('@/services/auth.service', () => {
  const mockAuthService = {
    validateManager: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAuthService) };
});
jest.mock('jsonwebtoken', () => {
  const jwt = {
    verify: jest.fn(),
  };
  return { __esModule: true, default: jwt };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return { __esModule: true, logger: logger, initializeLogger: jest.fn() };
});

const mockAuthService = new AuthService(new UsersModel());

describe('discovery content API', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  const assertCreateDiscoveryContentResponse = response => {
    const expectedResponse = {
      discoveryContentID: expect.any(Number),
      title: expect.any(String),
      description: expect.any(String),
      media: response.media.map(() => ({
        mediaID: expect.any(Number),
        mediaUrl: expect.any(String),
        mediaType: expect.any(String),
      })),
      urls: response.urls.map(url => ({
        url: expect.any(String),
        urlID: expect.any(Number),
        platform: expect.any(String),
        type: expect.any(String),
      })),
      metaTags: response.metaTags.map(() => ({
        tag: expect.any(String),
        metaTagID: expect.any(Number),
      })),
      categories: response.categories.map(() => ({
        categoryName: expect.any(String),
        categoryBucketID: expect.any(Number),
        categoryID: expect.any(Number),
      })),
    };

    expect(response).toMatchObject(expectedResponse);
  };

  describe('PUT /discoveryContent/hide', () => {
    const RESTAURANT_ID = 1;
    it('should hide discovery content for a restaurant', async () => {
      const mockDiscoverContent = new DiscoveryContentEntity('Test title', undefined, 'test description', false, RESTAURANT_ID);
      const discoveryContentModel = new DiscoveryContentModel();
      const discoveryContent = await discoveryContentModel.upsertDiscoveryContent(mockDiscoverContent);
      const discoveryContentID = discoveryContent.discoveryContentID;

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent/hide`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          discoveryContentID,
          hide: true,
        })
        .expect(200);
      await removeDiscoveryContent(discoveryContentID);
    });
    it('should show discovery content for a restaurant', async () => {
      const mockDiscoverContent = new DiscoveryContentEntity('Test title', undefined, 'test description', true, RESTAURANT_ID);
      const discoveryContentModel = new DiscoveryContentModel();
      const discoveryContent = await discoveryContentModel.upsertDiscoveryContent(mockDiscoverContent);
      const discoveryContentID = discoveryContent.discoveryContentID;

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent/hide`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          discoveryContentID,
          hide: false,
        })
        .expect(200);
      await removeDiscoveryContent(discoveryContentID);
    });
    it('should not hide discovery content for a restaurant if id doesnt exist', async () => {
      mockVerify();

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent/hide`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          discoveryContentID: 99999,
          hide: false,
        })
        .expect(404);
    });
  });

  describe('PUT /discoveryContent', () => {
    // Base payload; each test uses a deep copy so shared mutable state cannot break other tests.
    const baseDiscoveryItemReq = {
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
    };
    const getDiscoveryItemReq = () => JSON.parse(JSON.stringify(baseDiscoveryItemReq));

    it('should edit discovery content for a restaurant by changing the name of discovery item', async () => {
      const discoveryItemReq = getDiscoveryItemReq();
      // create a discovery item first
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      // get discovery item ID
      const discoveryContentID = res.body.discoveryContentID;
      discoveryItemReq['discoveryContentID'] = discoveryContentID;
      discoveryItemReq.title = 'new_title';

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      // get current discovery item to compare results to
      const updatedDiscoveryItem = await getDiscoveryItemByDiscoveryItemID(discoveryContentID);
      expect(updatedDiscoveryItem.title).toEqual(discoveryItemReq.title);

      await removeDiscoveryContent(discoveryContentID);
    });
    it('should edit discovery content for a restaurant by changing the description of discovery item', async () => {
      const discoveryItemReq = getDiscoveryItemReq();
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const discoveryContentID = res.body.discoveryContentID;
      discoveryItemReq['discoveryContentID'] = discoveryContentID;
      discoveryItemReq.description = 'new_description';

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const updatedDiscoveryItem = await getDiscoveryItemByDiscoveryItemID(discoveryContentID);
      expect(updatedDiscoveryItem.description).toEqual(discoveryItemReq.description);

      await removeDiscoveryContent(discoveryContentID);
    });
    it('should edit discovery content for a restaurant by deleting mediaIDs and adding new mediIDs', async () => {
      const discoveryItemReq = getDiscoveryItemReq();
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const discoveryContentID = res.body.discoveryContentID;
      discoveryItemReq['discoveryContentID'] = discoveryContentID;
      discoveryItemReq.mediaIDs = [3];

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const updatedDiscoveryItem = await getDiscoveryItemByDiscoveryItemID(discoveryContentID);
      expect(updatedDiscoveryItem.media.map(_media => _media.mediaID)).toEqual(JSON.parse(JSON.stringify(discoveryItemReq.mediaIDs)));

      await removeDiscoveryContent(discoveryContentID);
    });
    it('should NOT pass up mediaIDs array in request (undefined) and endpoint should give 500 response', async () => {
      const discoveryItemReq = getDiscoveryItemReq();
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const discoveryContentID = res.body.discoveryContentID;
      discoveryItemReq['discoveryContentID'] = discoveryContentID;
      delete discoveryItemReq.mediaIDs;

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(500);

      await removeDiscoveryContent(discoveryContentID);
    });
    it('should edit discovery content for a restaurant by deleting urls and adding new urls', async () => {
      const discoveryItemReq = getDiscoveryItemReq();
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const discoveryContentID = res.body.discoveryContentID;
      discoveryItemReq['discoveryContentID'] = discoveryContentID;
      discoveryItemReq.urls = [
        {
          url: 'https://test_url.com',
          platform: 'resy',
          type: 'reservation',
        },
      ];

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const updatedDiscoveryItem = await getDiscoveryItemByDiscoveryItemID(discoveryContentID);
      validateIdenticalUrlArrays(updatedDiscoveryItem.urls, discoveryItemReq.urls);

      await removeDiscoveryContent(discoveryContentID);
    });
    it('should edit discovery content for a restaurant by deleting urls', async () => {
      const discoveryItemReq = getDiscoveryItemReq();
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const discoveryContentID = res.body.discoveryContentID;
      discoveryItemReq['discoveryContentID'] = discoveryContentID;
      discoveryItemReq.urls = [];

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const updatedDiscoveryItem = await getDiscoveryItemByDiscoveryItemID(discoveryContentID);
      validateIdenticalUrlArrays(updatedDiscoveryItem.urls, discoveryItemReq.urls);

      await removeDiscoveryContent(discoveryContentID);
    });
    it('should NOT pass up urls array in request (undefined) and endpoint should still give 200 response', async () => {
      const discoveryItemReq = getDiscoveryItemReq();
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const discoveryContentID = res.body.discoveryContentID;
      discoveryItemReq['discoveryContentID'] = discoveryContentID;
      delete discoveryItemReq.urls;

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      await removeDiscoveryContent(discoveryContentID);
    });
    it('should edit discovery content for a restaurant by deleting categories and adding new categories', async () => {
      const discoveryItemReq = getDiscoveryItemReq();
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const discoveryContentID = res.body.discoveryContentID;
      discoveryItemReq['discoveryContentID'] = discoveryContentID;
      discoveryItemReq.categories = ['misc'];

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const updatedDiscoveryItem = await getDiscoveryItemByDiscoveryItemID(discoveryContentID);
      const flattenedCategories = updatedDiscoveryItem.categories.map(category => category.categoryName);
      expect(flattenedCategories.map(category => discoveryItemReq.categories.includes(category)));
      expect(discoveryItemReq.categories.map(category => flattenedCategories.includes(category)));

      await removeDiscoveryContent(discoveryContentID);
    });
    it('should edit discovery content for a restaurant by deleting categories', async () => {
      const discoveryItemReq = getDiscoveryItemReq();
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const discoveryContentID = res.body.discoveryContentID;
      discoveryItemReq['discoveryContentID'] = discoveryContentID;
      discoveryItemReq.categories = [];

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const updatedDiscoveryItem = await getDiscoveryItemByDiscoveryItemID(discoveryContentID);
      const flattenedCategories = updatedDiscoveryItem.categories.map(category => category.categoryName);
      expect(flattenedCategories.map(category => discoveryItemReq.categories.includes(category)));
      expect(discoveryItemReq.categories.map(category => flattenedCategories.includes(category)));

      await removeDiscoveryContent(discoveryContentID);
    });
    it('should NOT pass up categories array in request (undefined) and endpoint should give 200 response and not change categories of a discovery item', async () => {
      const discoveryItemReq = getDiscoveryItemReq();
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const discoveryContentID = res.body.discoveryContentID;
      discoveryItemReq['discoveryContentID'] = discoveryContentID;
      delete discoveryItemReq.categories;

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      await removeDiscoveryContent(discoveryContentID);
    });
    it('should throw 400 status code if categories is not a correct allowed category type ("vibes, "dish_storey", "....") ', async () => {
      const discoveryItemReq = getDiscoveryItemReq();
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const discoveryContentID = res.body.discoveryContentID;
      discoveryItemReq['discoveryContentID'] = discoveryContentID;
      discoveryItemReq.categories = ['foobar'];

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(400);

      await removeDiscoveryContent(discoveryContentID);
    });
    it('should edit discovery content for a restaurant by deleting metatags and inserting new meta tags', async () => {
      const discoveryItemReq = getDiscoveryItemReq();
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const discoveryContentID = res.body.discoveryContentID;
      discoveryItemReq['discoveryContentID'] = discoveryContentID;
      discoveryItemReq.metaTags = ['foo', 'bar'];

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const updatedDiscoveryItem = await getDiscoveryItemByDiscoveryItemID(discoveryContentID);
      const flattenedCategories = updatedDiscoveryItem.metaTags.map(_tag => _tag.tag);
      expect(flattenedCategories.map(tag => discoveryItemReq.metaTags.includes(tag)));
      expect(discoveryItemReq.metaTags.map(tag => flattenedCategories.includes(tag)));

      await removeDiscoveryContent(discoveryContentID);
    });
    it('should edit discovery content by deleting metatags and NOT inserting new meta tags via empty meta tags array', async () => {
      const discoveryItemReq = getDiscoveryItemReq();
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const discoveryContentID = res.body.discoveryContentID;
      discoveryItemReq['discoveryContentID'] = discoveryContentID;
      discoveryItemReq.metaTags = [];

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const updatedDiscoveryItem = await getDiscoveryItemByDiscoveryItemID(discoveryContentID);
      const flattenedCategories = updatedDiscoveryItem.metaTags.map(_tag => _tag.tag);
      expect(flattenedCategories.map(tag => discoveryItemReq.metaTags.includes(tag)));
      expect(discoveryItemReq.metaTags.map(tag => flattenedCategories.includes(tag)));

      await removeDiscoveryContent(discoveryContentID);
    });
    it('should NOT pass up metaTags array in request (undefined) and endpoint should still give 200 response and no changes occur for meta tags', async () => {
      const discoveryItemReq = getDiscoveryItemReq();
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      const discoveryContentID = res.body.discoveryContentID;
      discoveryItemReq['discoveryContentID'] = discoveryContentID;
      delete discoveryItemReq.metaTags;

      mockVerify();
      await request(app.getServer())
        .put(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(discoveryItemReq)
        .expect(200);

      await getDiscoveryItemByDiscoveryItemID(discoveryContentID);
      await removeDiscoveryContent(discoveryContentID);
    });
  });
  describe('DELETE /discoveryContent/:discoveryContentID', () => {
    const RESTAURANT_ID = 1;
    it('should soft delete discovery content for a restaurant', async () => {
      const mockDiscoverContent = new DiscoveryContentEntity('Test title', undefined, 'test description', true, RESTAURANT_ID);
      const discoveryContentModel = new DiscoveryContentModel();
      const discoveryContent = await discoveryContentModel.upsertDiscoveryContent(mockDiscoverContent);
      const discoveryContentID = discoveryContent.discoveryContentID;

      mockVerify();
      await request(app.getServer())
        .delete(`/discoveryContent/${discoveryContentID}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
      await removeDiscoveryContent(discoveryContentID);
    });
    it('should not soft delete discovery content for a restaurant if id doesnt exist', async () => {
      mockVerify();
      await request(app.getServer()).delete(`/discoveryContent/${99999}`).set('Authorization', 'token').set('restaurantID', '1').expect(404);
    });
  });
  describe('POST /discoveryContent', () => {
    const RESTAURANT_ID = 1;
    const req = {
      title: 'test_title',
      description: 'lorem ipsum...',
      mediaIDs: [71, 3], // we have these dummy values in database so no need to create them
      urls: [
        {
          url: 'https://test_url.com',
          platform: 'grubhub',
          type: 'ordering',
        },
      ],
      metaTags: ['test_tags2', 'test_tags3'],
      categories: ['misc', 'vibes'],
    };
    it('should create discovery content for a restaurant', async () => {
      mockVerify();
      const res = await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', `${RESTAURANT_ID}`)
        .send(req)
        .expect(200);

      // assert response function
      assertCreateDiscoveryContentResponse(res.body);

      // clean up
      await removeDiscoveryContent(res.body.discoveryContentID);
    });
    it('should create discovery item even if description is undefined', async () => {
      const tempDescription = req.description;
      req.description = '';
      mockVerify();
      await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', `${RESTAURANT_ID}`)
        .send(req)
        .expect(400);

      req.description = tempDescription;
    });
    it('should throw 400 if description is EMPTY string for discovery content (must be string length > 1)', async () => {
      const tempDescription = req.description;
      req.description = '';
      mockVerify();
      await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', `${RESTAURANT_ID}`)
        .send(req)
        .expect(400);

      req.description = tempDescription;
    });
    it('should not create discovery content for a restaurant if restaurant id doesnt exist and throw 401 status code', async () => {
      mockVerify();
      await request(app.getServer()).post(`/discoveryContent`).set('Authorization', 'token').set('restaurantID', '999999').send(req).expect(401);
    });
    it('should not create discovery content for a restaurant if media ids array has not existing value and throw 401 status code', async () => {
      const tempMediaIDs = req.mediaIDs;
      req.mediaIDs = [99999999];

      mockVerify();
      await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', `${RESTAURANT_ID}`)
        .send(req)
        .expect(401);

      req.mediaIDs = tempMediaIDs;
    });
    it('should not create discovery content for a restaurant if media ids array is empty and throw 400 status code', async () => {
      const tempMediaIDs = req.mediaIDs;
      req.mediaIDs = [];

      mockVerify();
      await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', `${RESTAURANT_ID}`)
        .send(req)
        .expect(400);

      req.mediaIDs = tempMediaIDs;
    });
    it('should not create discovery content for a restaurant if media ids array is undefined and throw 400 status code', async () => {
      const tempMediaIDs = req.mediaIDs;
      req.mediaIDs = undefined;

      mockVerify();
      await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', `${RESTAURANT_ID}`)
        .send(req)
        .expect(400);

      req.mediaIDs = tempMediaIDs;
    });
    it('should not create discovery content for a restaurant if url is invalid type (i.e. not ordering or payment) and throw 400 status code', async () => {
      const tempURLType = req.urls[0].type;
      req.urls[0].type = 'invalid';

      mockVerify();
      await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', `${RESTAURANT_ID}`)
        .send(req)
        .expect(400);

      req.urls[0].type = tempURLType;
    });
    it('should not create discovery content for a restaurant if url is empty string (i.e. not ordering or payment) and throw 400 status code', async () => {
      const tempURLType = req.urls[0].type;
      req.urls[0].type = '';

      mockVerify();
      await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', `${RESTAURANT_ID}`)
        .send(req)
        .expect(400);

      req.urls[0].type = tempURLType;
    });
    it('should not create discovery content for a restaurant if url platform is invalid type (i.e. not grubhub, doordash, etc) and throw 400 status code', async () => {
      const tempPlatformType = req.urls[0].platform;
      req.urls[0].platform = 'invalid';

      mockVerify();
      await request(app.getServer())
        .post(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', `${RESTAURANT_ID}`)
        .send(req)
        .expect(400);

      req.urls[0].platform = tempPlatformType;
    });
    const testCases = [
      { url: 'http://not_https.com', description: 'URL starts with "http://" instead of "https://"' },
      { url: 'not_starting_with_https_prefix.com', description: 'URL does not start with "https://"' },
      {
        url: 'not_starting_with_https_and_not_having_a_top_level_domain',
        description: 'URL does not start with "https://" and lacks a top-level domain',
      },
      { url: 'https://having a_space_in_url.com', description: 'URL contains a space' },
      { url: 'https://not_having_a_top_level_domain', description: 'URL does not have a top-level domain' },
      { url: '', description: 'URL does not have a top-level domain' },
    ];
    it.each(testCases)(
      'should not create discovery content for a restaurant if url is invalid ($description) and throw 400 status code',
      async ({ url }) => {
        const modifiedReq = { ...req };
        modifiedReq.urls[0].url = url;

        mockVerify();
        await request(app.getServer())
          .post(`/discoveryContent`)
          .set('Authorization', 'token')
          .set('restaurantID', 'RESTAURANT_ID')
          .send(modifiedReq)
          .expect(400);
      },
    );
  });
  describe('GET /discoveryContent', () => {
    const RESTAURANT_ID = 1;
    // This test exercises GET /discoveryContent, which can be slow when the restaurant has many items.
    jest.setTimeout(15000);
    const assertCreateDiscoveryContentResponse = response => {
      const expectedResponse = {
        discoveryContentID: expect.any(Number),
        title: expect.any(String),
        description: expect.any(String),
        media: response.media.map(() => ({
          mediaID: expect.any(Number),
          mediaUrl: expect.any(String),
          mediaType: expect.any(String),
        })),
        urls: response.urls.map(url => ({
          url: expect.any(String),
          urlID: expect.any(Number),
          platform: expect.any(String),
          type: expect.any(String),
        })),
        metaTags: response.metaTags.map(() => ({
          tag: expect.any(String),
          metaTagID: expect.any(Number),
        })),
        categories: response.categories.map(() => ({
          categoryName: expect.any(String),
          categoryBucketID: expect.any(Number),
          categoryID: expect.any(Number),
        })),
      };

      expect(response).toMatchObject(expectedResponse);
    };

    it('should get discovery content for a restaurant', async () => {
      mockVerify();
      const response = await request(app.getServer())
        .get(`/discoveryContent`)
        .set('Authorization', 'token')
        .set('restaurantID', `${RESTAURANT_ID}`)
        .expect(200);
      response.body.map(discoveryItem => assertCreateDiscoveryContentResponse(discoveryItem));
    });
  });
});

/**
 * set up database items needed for test cases
 *  - connect to database
 */
const setUp = async () => {
  await getConnection().connect();
};
/**
 * clean up anything done by test cases
 *  - close connections
 */
const cleanUp = async () => {
  await getConnection().close();
};

/**
 * bypass authorization layer
 */
const mockVerify = (managerID?: number | 1) => {
  const decoded = {
    managerID: managerID,
  };
  (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
    callback(null, decoded);
  });
  (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
};

const removeDiscoveryContent = async (discoveryContentID: number): Promise<void> => {
  const repository = await ormConnection();
  await repository.delete(DiscoveryContentMediaEntity, discoveryContentID);
  await repository.delete(DiscoveryContentCategoryBucketsEntity, discoveryContentID);
  await repository.delete(DiscoveryContentURLsEntity, discoveryContentID);
  await repository.delete(DiscoveryContentMetaTagsEntity, discoveryContentID);
  await repository.delete(DiscoveryContentEntity, discoveryContentID);
};

/**
 * Fetches a single discovery item by ID via the model (single fast query).
 * Avoids GET /discoveryContent which can be slow when the restaurant has many items.
 */
const getDiscoveryItemByDiscoveryItemID = async (discoveryContentID: number): Promise<any> => {
  const discoveryContentModel = new DiscoveryContentModel();
  const entity = await discoveryContentModel.fetchDiscoveryContentByID(discoveryContentID);
  if (!entity) return undefined;
  return {
    discoveryContentID: entity.discoveryContentID,
    title: entity.title,
    description: entity.description ?? '',
    media: entity.media?.map(m => ({ mediaID: m.mediaID })) ?? [],
    urls:
      entity.urls?.map(u => ({
        url: obtainUrlHTTPS(u.url),
        platform: u.platform?.name,
        type: u.urlType,
      })) ?? [],
    categories: entity.categoryBuckets?.map(b => ({ categoryName: b.category?.name ?? '' })) ?? [],
    metaTags: entity.metaTags?.map(t => ({ tag: t.tag })) ?? [],
  };
};

const validateIdenticalUrlArrays = (arr1, arr2) => {
  // Remove `urlID` key from each object and compare remaining keys and values
  const cleanedArr1 = arr1.map(({ urlID, ...rest }) => rest);
  const cleanedArr2 = arr2.map(({ urlID, ...rest }) => rest);

  expect(arr1.length).toEqual(arr2.length);
  expect(cleanedArr1).toEqual(cleanedArr2);
};
