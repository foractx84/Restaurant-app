import { app } from '@/server';
import request from 'supertest';
import { EntityManager, getConnection, In } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import { ormConnection } from '@/utils/dbUtils';
import { MenuSectionEntity } from '@/entities/menuSections.entity';

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

const INSERTED_MENU_SECTION_ID = [];
let INSERTED_MENU_ID;

describe('menu sections API', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  describe('PATCH /menuSections/reorder', () => {
    it('should reorder menu sections list order', async () => {
      mockVerify();

      const insert_req = {
        menus: [
          {
            name: 'Menu Reorder List Order Test',
            isPrixFixe: false,
            menuHours: [
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
            ],
            menuSections: [
              {
                name: 'reorder test menu section 1',
                message: 'test message 1',
              },
              {
                name: 'reorder test menu section 2',
              },
              {
                name: 'reorder test menu section 3',
              },
              {
                name: 'reorder test menu section 4',
              },
            ],
            disclaimers: [],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      mockVerify();

      INSERTED_MENU_ID = res.body.menus[0].menuID; // save menu id of test insertion to use in test delete
      const res_menu_details = await request(app.getServer())
        .get(`/menus/${INSERTED_MENU_ID}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
      const SECTION_ORDER = res_menu_details.body.menuSections
        .map(section => section.menuSectionID)
        .sort(function () {
          return 0.5 - Math.random();
        });

      const req = {
        menuID: INSERTED_MENU_ID,
        menuSectionsOrder: SECTION_ORDER,
      };
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await request(app.getServer()).patch('/menuSections/reorder').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should return 400 bad request due to not including all menu sections of a menu', async () => {
      mockVerify();
      const MENU_ID = 275;
      const req = {
        menuID: MENU_ID,
        menuSectionsOrder: [1, 2, 4, 5, 6, 7],
      };
      await request(app.getServer()).patch('/menuSections/reorder').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should return 400 bad request due to having extra non existent menu sections of a menu in request', async () => {
      mockVerify();
      const MENU_ID = 275;
      const req = {
        menuID: MENU_ID,
        menuSectionsOrder: [1, 2, 3, 4, 5, 6, 7, 8],
      };
      await request(app.getServer()).patch('/menuSections/reorder').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should return 400 bad request due to having duplicate menu sections of a menu in request', async () => {
      mockVerify();
      const MENU_ID = 275;
      const req = {
        menuID: MENU_ID,
        menuSectionsOrder: [1, 2, 3, 4, 5, 6, 7, 7],
      };
      await request(app.getServer()).patch('/menuSections/reorder').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should return 400 bad request due to having menu sections in request that dont exist in menu', async () => {
      mockVerify();
      const MENU_ID = 275;
      const req = {
        menuID: MENU_ID,
        menuSectionsOrder: [1, 2, 3, 4, 8, 6, 7, 7],
      };
      await request(app.getServer()).patch('/menuSections/reorder').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
      mockVerify();
      // cleanup
      await request(app.getServer()).delete(`/menus/${INSERTED_MENU_ID}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);
    });
  });
  describe('POST /menuSections', () => {
    it('should return created menu sections', async () => {
      mockVerify();
      const MENU_ID = 275;
      const req = {
        menuID: MENU_ID,
        menuSections: [
          {
            name: 'INTEGRATION TEST menu section 1',
            message: 'test message 1',
          },
          {
            name: 'INTEGRATION TEST menu section 2',
          },
        ],
      };
      const expectedResponse = {
        menuID: MENU_ID,
        menuSections: [
          {
            menuSectionID: expect.any(Number),
            name: 'INTEGRATION TEST menu section 1',
          },
          {
            menuSectionID: expect.any(Number),
            name: 'INTEGRATION TEST menu section 2',
          },
        ],
      };
      const res = await request(app.getServer()).post('/menuSections').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      expect(res.body).toMatchObject(expectedResponse);
      INSERTED_MENU_SECTION_ID[0] = res.body.menuSections[0].menuSectionID; // save menu id of test insertion to use in test delete
      INSERTED_MENU_SECTION_ID[1] = res.body.menuSections[1].menuSectionID; // save menu id of test insertion to use in test delete
    });
    it('should return 401 unauthorized due to menu ID not linked to RestaurantID', async () => {
      mockVerify();
      const MENU_ID = 286;
      const req = {
        menuID: MENU_ID,
        menuSections: [
          {
            name: 'INTEGRATION TEST menu section 1',
            message: 'test message 1',
          },
          {
            name: 'INTEGRATION TEST menu section 2',
          },
        ],
      };
      const expectedResponse = {
        errors: [
          {
            code: 4444,
            message: 'User is not authorized',
          },
        ],
      };
      const res = await request(app.getServer()).post('/menuSections').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(401);
      expect(res.body).toMatchObject(expectedResponse);
    });
  });
  describe('PUT /menuSections', () => {
    it('should return 200 status code and edit menu section name', async () => {
      mockVerify();
      const MENU_ID = 275;
      const req = {
        menuID: MENU_ID,
        menuSectionID: INSERTED_MENU_SECTION_ID[0],
        menuSectionName: 'EDIT INTEGRATION TEST menu section 1',
      };
      await request(app.getServer()).put('/menuSections').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should return 200 status code and edit menu section message', async () => {
      mockVerify();
      const MENU_ID = 275;
      const insert_req = {
        menuID: MENU_ID,
        menuSections: [
          {
            name: 'test menu section A',
            message: 'test message A',
          },
          {
            name: 'test menu section B',
          },
          {
            name: 'test menu section C',
            message: '',
          },
        ],
      };
      const res = await request(app.getServer())
        .post('/menuSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(insert_req)
        .expect(200);
      const MENU_SECTION_IDs = res.body.menuSections.map(section => section.menuSectionID);

      const req = {
        menuID: MENU_ID,
        menuSectionID: MENU_SECTION_IDs[0],
        menuSectionName: 'EDIT 2 INTEGRATION TEST menu section 1',
        message: 'edit menu section message',
      };
      mockVerify();
      await request(app.getServer()).put('/menuSections').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);

      await deleteMenuSectionsByMenuSectionIDs(MENU_SECTION_IDs);
    });
    it('should return 401 unauthorized due to menu ID not linked to RestaurantID', async () => {
      mockVerify();
      const MENU_ID = 286;
      const req = {
        menuID: MENU_ID,
        menuSectionID: INSERTED_MENU_SECTION_ID[0],
        menuSectionName: 'EDIT INTEGRATION TEST menu section 1',
      };
      const expectedResponse = {
        errors: [
          {
            code: 4444,
            message: 'User is not authorized',
          },
        ],
      };
      const res = await request(app.getServer()).put('/menuSections').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(401);
      expect(res.body).toMatchObject(expectedResponse);
    });
  });
  describe('DELETE /menuSections', () => {
    it('should delete menu section', async () => {
      mockVerify();
      await request(app.getServer())
        .delete(`/menuSections/${INSERTED_MENU_SECTION_ID[0]}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
      mockVerify();
      await request(app.getServer())
        .delete(`/menuSections/${INSERTED_MENU_SECTION_ID[1]}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
  });
  describe('PUT /menuSections/hide', () => {
    it('should successfully hide menu section', async () => {
      mockVerify();
      const req = {
        menuSectionID: 1,
        hide: true,
      };
      await request(app.getServer()).put('/menuSections/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should successfully un-hide menu section', async () => {
      mockVerify();
      const req = {
        menuSectionID: 1,
        hide: false,
      };
      await request(app.getServer()).put('/menuSections/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should throw 401 HttpException error if menu section id doesnt exist', async () => {
      mockVerify();
      const req = {
        menuSectionID: 9999999,
        hide: false,
      };
      await request(app.getServer()).put('/menuSections/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(401);
    });
    it('should throw 400 HttpException error if bad request', async () => {
      mockVerify();
      const req = {
        menuSectionID: 1,
      };
      await request(app.getServer()).put('/menuSections/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
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

const deleteMenuSectionsByMenuSectionIDs = async (menuSectionIDs: number[], repository?: EntityManager) => {
  if (!repository) {
    repository = await ormConnection();
  }
  await repository.delete(MenuSectionEntity, { menu_section_id: In(menuSectionIDs) });
};
