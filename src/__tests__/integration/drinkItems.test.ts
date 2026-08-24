import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';

jest.mock('@/utils/GCP_bucket', () => require('../../../__mocks__/GCP_bucket'));

jest.mock('@/utils/logger', () => {
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return { __esModule: true, logger: logger, initializeLogger: jest.fn() };
});
// mock jwt.verify until a test token is generated
jest.mock('jsonwebtoken', () => {
  const jwt = {
    verify: jest.fn(),
  };
  return { __esModule: true, default: jwt };
});
// mock authService response until Test DB creates proper tables for queries
jest.mock('@/services/auth.service', () => {
  const mockAuthService = {
    validateManager: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAuthService) };
});
jest.mock('@/utils/imageUtils', () => {
  const MOCKED_APP_CONFIG = {
    IMAGE_BUCKET: 'dummy',
    MAX_MULTER_FILE_SIZE_LIMIT: 75000000,
  };

  return {
    __esModule: true,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
    imageUpload: { fields: jest.fn() },
  };
});
const mockAuthService = new AuthService(new UsersModel());

describe('drink items API', () => {
  let INSERTED_DRINK_ITEM_ID;
  let INSERTED_MENU_SECTION_ID;
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  describe('GET /drinkItems', () => {
    it('should return empty array if no drink items for restaurant', async () => {
      mockVerify();
      const res = await request(app.getServer()).get('/drinkItems').set('Authorization', 'token').set('restaurantID', '1').expect(200);
      expect(res.body).toMatchObject([]);
    });
    it('should return drink items for restaurant', async () => {
      mockVerify();
      const createDrinkReq = {
        name: 'B DRINK ITEM',
        category: 'drink',
        menuSectionID: 1,
        baseItemSize: {
          label: 'default',
          price: 599,
        },
        allItemSizes: [
          {
            label: 'small',
            price: 199,
            priceOverride: 'Market Price',
          },
          {
            label: 'default',
            price: 599,
          },
        ],
      };
      const expectedResponse = [
        {
          name: 'A DRINK ITEM',
          drinkItemID: expect.any(Number),
          isHidden: false,
        },
        {
          name: 'B DRINK ITEM',
          drinkItemID: expect.any(Number),
          isHidden: false,
        },
        {
          name: 'C DRINK ITEM',
          drinkItemID: expect.any(Number),
          isHidden: false,
        },
      ];

      // create drink items
      const createdDrink1 = await request(app.getServer())
        .post('/drinkItem')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({ ...createDrinkReq, name: 'C DRINK ITEM' })
        .expect(200);
      const createdDrink2 = await request(app.getServer())
        .post('/drinkItem')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({ ...createDrinkReq, name: 'B DRINK ITEM' })
        .expect(200);
      const createdDrink3 = await request(app.getServer())
        .post('/drinkItem')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({ ...createDrinkReq, name: 'A DRINK ITEM' })
        .expect(200);

      const res = await request(app.getServer()).get('/drinkItems').set('Authorization', 'token').set('restaurantID', '1').expect(200);
      expect(res.body).toMatchObject(expectedResponse);

      // delete drink items
      await request(app.getServer())
        .delete(`/drinkItem/${createdDrink1.body.menuItemID}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
      await request(app.getServer())
        .delete(`/drinkItem/${createdDrink2.body.menuItemID}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
      await request(app.getServer())
        .delete(`/drinkItem/${createdDrink3.body.menuItemID}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
  });
  describe('POST /drinkItem', () => {
    it('should return created drink item', async () => {
      mockVerify();
      const req = {
        name: 'DRINK ITEM TEST 1',
        description: 'DESCRIPTION',
        category: 'drink',
        calories: 100,
        menuSectionID: 1,
        baseItemSize: {
          label: 'default',
          price: 599,
        },
        allItemSizes: [
          {
            label: 'small',
            price: 199,
            priceOverride: 'Market Price',
          },
          {
            label: 'default',
            price: 599,
          },
        ],
      };
      const expectedResponse = {
        menuItemID: expect.any(Number),
        menuItemUrlID: expect.any(String),
        name: 'DRINK ITEM TEST 1',
        description: 'DESCRIPTION',
        calories: 100,
        category: 'drink',
        menuSectionID: 1,
        isHidden: false,
        baseItemSize: {
          id: expect.any(Number),
          price: 599,
          label: 'default',
          priceOverride: '',
        },
        allItemSizes: [
          {
            id: expect.any(Number),
            price: 0,
            label: 'small',
            priceOverride: 'Market Price',
          },
          {
            id: expect.any(Number),
            price: 599,
            label: 'default',
            priceOverride: '',
          },
        ],
      };
      const res = await request(app.getServer()).post('/drinkItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      expect(res.body).toMatchObject(expectedResponse);
      INSERTED_DRINK_ITEM_ID = res.body.menuItemID;
      INSERTED_MENU_SECTION_ID = res.body.menuSectionID;
    });
    it('should throw 400 Bad Request when Base Item Size is not included in All Item Sizes', async () => {
      mockVerify();
      const req = {
        name: 'DRINK ITEM TEST 2',
        description: 'DESCRIPTION',
        category: 'drink',
        menuSectionID: 1,
        baseItemSize: {
          label: 'default',
          price: 599,
        },
        allItemSizes: [
          {
            label: 'small',
            price: 199,
            priceOverride: 'Market Price',
          },
        ],
      };
      await request(app.getServer()).post('/drinkItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should throw 400 Bad Request when All Item Sizes has a duplicate label', async () => {
      mockVerify();
      const req = {
        name: 'DRINK ITEM TEST 3',
        description: 'DESCRIPTION',
        category: 'drink',
        menuSectionID: 1,
        baseItemSize: {
          label: 'small',
          price: 199,
          priceOverride: '',
        },
        allItemSizes: [
          {
            label: 'small',
            price: 199,
            priceOverride: '',
          },
          {
            label: 'SMALL',
            price: 199,
            priceOverride: '',
          },
        ],
      };
      await request(app.getServer()).post('/drinkItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should throw 400 Bad Request when category is "food" instead of "drink" ', async () => {
      mockVerify();
      const req = {
        name: 'DRINK ITEM TEST 3',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: 1,
        baseItemSize: {
          label: 'small',
          price: 199,
          priceOverride: '',
        },
        allItemSizes: [
          {
            label: 'small',
            price: 199,
            priceOverride: '',
          },
          {
            label: 'SMALL',
            price: 199,
            priceOverride: '',
          },
        ],
      };
      await request(app.getServer()).post('/drinkItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
  });
  describe('PUT /drinkItem', () => {
    it('should successfully edit drink item with same name and menu section id as original', async () => {
      mockVerify();
      const req = {
        name: 'DRINK ITEM TEST 1',
        description: 'DESCRIPTION',
        category: 'drink',
        menuItemID: INSERTED_DRINK_ITEM_ID,
        menuSectionID: INSERTED_MENU_SECTION_ID,
        baseItemSize: {
          label: 'default',
          price: 599,
        },
        allItemSizes: [
          {
            label: 'small',
            price: 199,
            priceOverride: 'Market Price',
          },
          {
            label: 'default',
            price: 599,
          },
        ],
      };
      await request(app.getServer()).put('/drinkItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should throw 400 Bad Request when Base Item Size is not included in All Item Sizes when editing drink item', async () => {
      mockVerify();
      const req = {
        name: 'DRINK ITEM TEST 2',
        description: 'DESCRIPTION',
        category: 'drink',
        menuItemID: INSERTED_DRINK_ITEM_ID,
        baseItemSize: {
          label: 'default',
          price: 599,
        },
        allItemSizes: [
          {
            label: 'small',
            price: 199,
            priceOverride: 'Market Price',
          },
        ],
      };
      await request(app.getServer()).put('/drinkItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should throw 400 Bad Request when All Item Sizes has a duplicate label when editing drink item', async () => {
      mockVerify();
      const req = {
        name: 'DRINK ITEM TEST 3',
        description: 'DESCRIPTION',
        category: 'drink',
        menuItemID: INSERTED_DRINK_ITEM_ID,
        baseItemSize: {
          label: 'small',
          price: 199,
          priceOverride: '',
        },
        allItemSizes: [
          {
            label: 'small',
            price: 199,
            priceOverride: '',
          },
          {
            label: 'SMALL',
            price: 199,
            priceOverride: '',
          },
        ],
      };
      await request(app.getServer()).put('/drinkItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should throw 400 Bad Request when category is "food" instead of "drink" ', async () => {
      mockVerify();
      const req = {
        name: 'DRINK ITEM TEST 3',
        description: 'DESCRIPTION',
        category: 'food',
        menuItemID: INSERTED_DRINK_ITEM_ID,
        baseItemSize: {
          label: 'small',
          price: 199,
          priceOverride: '',
        },
        allItemSizes: [
          {
            label: 'small',
            price: 199,
            priceOverride: '',
          },
          {
            label: 'SMALL',
            price: 199,
            priceOverride: '',
          },
        ],
      };
      await request(app.getServer()).put('/drinkItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should successfully edit drink item and move it to different menu section since name is unique', async () => {
      mockVerify();
      const req = {
        name: 'DRINK ITEM TEST 1',
        description: 'DESCRIPTION',
        category: 'food',
        menuItemID: INSERTED_DRINK_ITEM_ID,
        menuSectionID: 2,
        baseItemSize: {
          label: 'default',
          price: 599,
        },
        allItemSizes: [
          {
            label: 'small',
            price: 199,
            priceOverride: 'Market Price',
          },
          {
            label: 'default',
            price: 599,
          },
        ],
      };
      await request(app.getServer()).put('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);

      // cleanup, move menu item back to original menu section
      req.menuSectionID = INSERTED_MENU_SECTION_ID;
      await request(app.getServer()).put('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
  });
  describe('PUT /drinkItem/hide', () => {
    it('should successfully hide drink item', async () => {
      mockVerify();
      const req = {
        menuItemID: 345,
        hide: true,
      };
      await request(app.getServer()).put('/drinkItem/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should successfully un-hide drink item', async () => {
      mockVerify();
      const req = {
        menuItemID: 345,
        hide: false,
      };
      await request(app.getServer()).put('/drinkItem/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should throw 401 HttpException error if drink item id doesnt exist', async () => {
      mockVerify();
      const req = {
        menuItemID: 9999999,
        hide: false,
      };
      await request(app.getServer()).put('/drinkItem/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(401);
    });
    it('should throw 400 HttpException error if bad request', async () => {
      mockVerify();
      const req = {
        menuItemID: 345,
      };
      await request(app.getServer()).put('/drinkItem/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
  });
  describe('DELETE /drinkItem', () => {
    it('should delete drink item', async () => {
      mockVerify();
      await request(app.getServer())
        .delete(`/drinkItem/${INSERTED_DRINK_ITEM_ID}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
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
  (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValue(true);
};
