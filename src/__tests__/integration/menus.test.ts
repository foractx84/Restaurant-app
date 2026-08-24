import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import { ormConnection } from '@/utils/dbUtils';
import { MenuEntity } from '@/entities/menus.entity';
import { CreateMenuDisclaimersResponseInterface } from '@interfaces/disclaimers.interface';
import { ModifierGroupToMenuItemLinkEntity } from '@/entities/modifierGroupToMenuItemLink.entity';
import { ModifierToModifierGroupLinkEntity } from '@/entities/modifierToModiferGroupLink.entity';
import { ModifierGroupEntity } from '@/entities/modifierGroup.entity';
import { ModifierEntity } from '@/entities/modifier.entity';
import { MenuSectionEntity } from '@/entities/menuSections.entity';
import { MenuHoursEntity } from '@/entities/menuHours.entity';
import { MenuItemEntity } from '@entities/menuItem.entity';

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
jest.mock('@/configs/config', () => {
  const MOCKED_APP_CONFIG = {
    SERVER: 'localhost',
    IMAGE_BUCKET: 'dummy',
    IMAGE_HOSTING_URL: 'https://dummy_image.jpeg',
    VIDEO_HOSTING_URL: 'https://resources-dev.trytaptab.com/videos/original',
    MAX_MULTER_FILE_SIZE_LIMIT: 75000000,
    FILE_HOSTING_URL: 'https://trytaptab.com/files/',
  };

  const originalModule = jest.requireActual('@/configs/config');

  return {
    __esModule: true,
    ...originalModule,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
  };
});
jest.mock('@/utils/imageUtils', () => {
  const originalModule = jest.requireActual('@/utils/imageUtils');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(),
    imageUpload: { fields: jest.fn() },
  };
});
jest.mock('@/utils/fileUtils', () => {
  const originalModule = jest.requireActual('@/utils/fileUtils');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(),
    generatePDFBuffer_PDF_Kit: jest.fn(),
    createMenuDoc_docx: jest.fn(),
    uploadFileToGoogleCloud: jest.fn(),
  };
});

const mockAuthService = new AuthService(new UsersModel());

let INSERTED_MENU_ID = 0;
let INSERTED_MENU_ID_DISCLAIMER_TESTS = 0;
describe('menus API', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  describe('PATCH /menus/reorder', () => {
    let INSERTED_MENU_ID_0;
    let INSERTED_MENU_ID_1;
    let INSERTED_MENU_ID_2;
    let INSERTED_MENU_ID_3;

    it('should reorder menu list order', async () => {
      mockVerify();
      const insert_req_0 = {
        menus: [
          {
            name: 'Menu Alone Reorder List Order Test 0',
            isPrixFixe: false,
            menuHours: [
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
            ],
            menuSections: [],
            disclaimers: [],
          },
        ],
      };
      const insert_req_1 = {
        menus: [
          {
            name: 'Menu Alone Reorder List Order Test 1',
            isPrixFixe: false,
            menuHours: [
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
            ],
            menuSections: [],
            disclaimers: [],
          },
        ],
      };
      const insert_req_2 = {
        menus: [
          {
            name: 'Menu Alone Reorder List Order Test 2',
            isPrixFixe: false,
            menuHours: [
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
            ],
            menuSections: [],
            disclaimers: [],
          },
        ],
      };
      const insert_req_3 = {
        menus: [
          {
            name: 'Menu Alone Reorder List Order Test 3',
            isPrixFixe: false,
            menuHours: [
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
            ],
            menuSections: [],
            disclaimers: [],
          },
        ],
      };

      const res_0 = await request(app.getServer())
        .post('/menus')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(insert_req_0)
        .expect(200);
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const res_1 = await request(app.getServer())
        .post('/menus')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(insert_req_1)
        .expect(200);
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const res_2 = await request(app.getServer())
        .post('/menus')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(insert_req_2)
        .expect(200);
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const res_3 = await request(app.getServer())
        .post('/menus')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(insert_req_3)
        .expect(200);

      INSERTED_MENU_ID_0 = res_0.body.menus[0].menuID; // save menu id
      INSERTED_MENU_ID_1 = res_1.body.menus[0].menuID; // save menu id
      INSERTED_MENU_ID_2 = res_2.body.menus[0].menuID; // save menu id
      INSERTED_MENU_ID_3 = res_3.body.menus[0].menuID; // save menu id

      // Get all existing menus for restaurantID 1 to include in reorder request
      const repository = await ormConnection();
      const existingMenus = await repository.find(MenuEntity, { restaurant_id: 1, deleted: false });
      const existingMenuIds = existingMenus.map(menu => menu.menu_id);

      // Build reorder request with all menus, reordered as desired
      // The new menus should be reordered: INSERTED_MENU_ID_3, INSERTED_MENU_ID_1, INSERTED_MENU_ID_2, INSERTED_MENU_ID_0
      // Other existing menus should be included as well
      const newMenuIds = [INSERTED_MENU_ID_3, INSERTED_MENU_ID_1, INSERTED_MENU_ID_2, INSERTED_MENU_ID_0];
      const otherMenuIds = existingMenuIds.filter(id => !newMenuIds.includes(id));
      const req = {
        menusOrder: [...newMenuIds, ...otherMenuIds],
      };
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await request(app.getServer()).patch('/menus/reorder').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should return 400 bad request due to not including all menus of a restaurant', async () => {
      mockVerify();
      const req = {
        menusOrder: [INSERTED_MENU_ID_3, 275, INSERTED_MENU_ID_2, 276, INSERTED_MENU_ID_0],
      };
      await request(app.getServer()).patch('/menus/reorder').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should return 400 bad request due to having extra non existent menus of a restaurant in request', async () => {
      mockVerify();
      const req = {
        menusOrder: [INSERTED_MENU_ID_3, 275, INSERTED_MENU_ID_2, INSERTED_MENU_ID_0, 276, INSERTED_MENU_ID_1, 275],
      };
      await request(app.getServer()).patch('/menus/reorder').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should return 400 bad request due to having duplicate menus of a restaurant in request', async () => {
      mockVerify();
      const req = {
        menusOrder: [INSERTED_MENU_ID_3, 275, INSERTED_MENU_ID_2, INSERTED_MENU_ID_3, 276, INSERTED_MENU_ID_0, INSERTED_MENU_ID_1],
      };
      await request(app.getServer()).patch('/menus/reorder').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should return 400 bad request due to having menus in request that dont exist in restaurant', async () => {
      mockVerify();
      const req = {
        menusOrder: [INSERTED_MENU_ID_3, 275, INSERTED_MENU_ID_2, INSERTED_MENU_ID_0, 20000],
      };
      await request(app.getServer()).patch('/menuSections/reorder').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);

      // cleanup
      await request(app.getServer()).delete(`/menus/${INSERTED_MENU_ID_0}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);
      await request(app.getServer()).delete(`/menus/${INSERTED_MENU_ID_1}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);
      await request(app.getServer()).delete(`/menus/${INSERTED_MENU_ID_2}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);
      await request(app.getServer()).delete(`/menus/${INSERTED_MENU_ID_3}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);
    });
  });
  describe('POST /menus', () => {
    it('should return created menu (isPrixFixe = false)', async () => {
      mockVerify();
      const req = {
        menus: [
          {
            name: 'Integration Test Menu',
            isPrixFixe: false,
            isHidden: false,
            menuHours: [
              { day: 'Monday', start: '08:00', end: '20:00' },
              { day: 'Tuesday', start: '08:00', end: '20:00' },
              { day: 'Wednesday', start: '08:00', end: '20:00' },
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
              { day: 'Saturday', start: '08:00', end: '20:00' },
              { day: 'Sunday', start: '08:00', end: '20:00' },
            ],
            menuSections: [
              {
                name: 'test menu section',
                message: 'test message',
              },
              {
                name: 'test menu section 2',
              },
            ],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };
      const expectedResponse = {
        menus: [
          {
            menuID: expect.any(Number),
            name: 'Integration Test Menu',
            isPrixFixe: false,
            isHidden: false,
            restaurantID: 1,
            menuSections: [
              {
                menuSectionID: expect.any(Number),
                name: 'test menu section',
                message: 'test message',
              },
              {
                menuSectionID: expect.any(Number),
                name: 'test menu section 2',
                message: '',
              },
            ],
            menuHours: [
              {
                id: expect.any(Number),
                day: 'Monday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Tuesday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Wednesday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Thursday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Friday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Saturday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Sunday',
                start: '08:00',
                end: '20:00',
              },
            ],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                messageID: expect.any(Number),
              },
            ],
          },
        ],
      };
      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      expect(res.body).toMatchObject(expectedResponse);
      INSERTED_MENU_ID = res.body.menus[0].menuID; // save menu id of test insertion to use in test delete
    });
    it('should return created menu (isPrixFixe = false) with top and bottom disclaimer', async () => {
      mockVerify();
      const req = {
        menus: [
          {
            name: 'Integration Test Menu Multiple Disclaimers',
            isPrixFixe: false,
            isHidden: false,
            menuHours: [
              { day: 'Monday', start: '08:00', end: '20:00' },
              { day: 'Tuesday', start: '08:00', end: '20:00' },
              { day: 'Wednesday', start: '08:00', end: '20:00' },
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
              { day: 'Saturday', start: '08:00', end: '20:00' },
              { day: 'Sunday', start: '08:00', end: '20:00' },
            ],
            menuSections: [
              {
                name: 'test menu section',
                message: 'test message',
              },
              {
                name: 'test menu section 2',
              },
            ],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER TOP',
                position: 'menu top bar',
              },
              {
                message: 'INTEGRATION TEST DISCLAIMER BOTTOM',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };
      const expectedResponse = {
        menus: [
          {
            menuID: expect.any(Number),
            name: 'Integration Test Menu Multiple Disclaimers',
            isPrixFixe: false,
            isHidden: false,
            restaurantID: 1,
            menuSections: [
              {
                menuSectionID: expect.any(Number),
                name: 'test menu section',
                message: 'test message',
              },
              {
                menuSectionID: expect.any(Number),
                name: 'test menu section 2',
                message: '',
              },
            ],
            menuHours: [
              {
                id: expect.any(Number),
                day: 'Monday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Tuesday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Wednesday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Thursday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Friday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Saturday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Sunday',
                start: '08:00',
                end: '20:00',
              },
            ],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER TOP',
                messageID: expect.any(Number),
              },
              {
                message: 'INTEGRATION TEST DISCLAIMER BOTTOM',
                messageID: expect.any(Number),
              },
            ],
          },
        ],
      };
      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      expect(res.body).toMatchObject(expectedResponse);

      // cleanup
      const INSERTED_MENU_ID_MULTIPLE_DISCLAIMERS = res.body.menus[0].menuID; // save menu id of test insertion to use in test delete
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_MULTIPLE_DISCLAIMERS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return created menu (isPrixFixe = false) with no disclaimers', async () => {
      mockVerify();
      const req = {
        menus: [
          {
            name: 'Integration Test Menu No Disclaimers',
            isPrixFixe: false,
            isHidden: false,
            menuHours: [
              { day: 'Monday', start: '08:00', end: '20:00' },
              { day: 'Tuesday', start: '08:00', end: '20:00' },
              { day: 'Wednesday', start: '08:00', end: '20:00' },
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
              { day: 'Saturday', start: '08:00', end: '20:00' },
              { day: 'Sunday', start: '08:00', end: '20:00' },
            ],
            menuSections: [
              {
                name: 'test menu section',
                message: 'test message',
              },
              {
                name: 'test menu section 2',
              },
            ],
            disclaimers: [],
          },
        ],
      };
      const expectedResponse = {
        menus: [
          {
            menuID: expect.any(Number),
            name: 'Integration Test Menu No Disclaimers',
            isPrixFixe: false,
            isHidden: false,
            restaurantID: 1,
            menuSections: [
              {
                menuSectionID: expect.any(Number),
                name: 'test menu section',
                message: 'test message',
              },
              {
                menuSectionID: expect.any(Number),
                name: 'test menu section 2',
                message: '',
              },
            ],
            menuHours: [
              {
                id: expect.any(Number),
                day: 'Monday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Tuesday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Wednesday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Thursday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Friday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Saturday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Sunday',
                start: '08:00',
                end: '20:00',
              },
            ],
            disclaimers: [],
          },
        ],
      };
      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      expect(res.body).toMatchObject(expectedResponse);

      // cleanup
      const INSERTED_MENU_ID_NO_DISCLAIMER = res.body.menus[0].menuID; // save menu id of test insertion to use in test delete
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_NO_DISCLAIMER}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return created menu (isPrixFixe = true)', async () => {
      mockVerify();
      const req = {
        menus: [
          {
            name: 'Integration Test Menu isPrixFixe = true',
            isPrixFixe: true,
            isHidden: false,
            menuHours: [
              { day: 'Monday', start: '08:00', end: '20:00' },
              { day: 'Tuesday', start: '08:00', end: '20:00' },
              { day: 'Wednesday', start: '08:00', end: '20:00' },
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
              { day: 'Saturday', start: '08:00', end: '20:00' },
              { day: 'Sunday', start: '08:00', end: '20:00' },
            ],
            menuSections: [
              {
                name: 'test menu section',
                message: 'test message',
              },
              {
                name: 'test menu section 2',
              },
            ],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };
      const expectedResponse = {
        menus: [
          {
            menuID: expect.any(Number),
            name: 'Integration Test Menu isPrixFixe = true',
            isPrixFixe: true,
            isHidden: false,
            restaurantID: 1,
            menuSections: [
              {
                menuSectionID: expect.any(Number),
                name: 'test menu section',
                message: 'test message',
              },
              {
                menuSectionID: expect.any(Number),
                name: 'test menu section 2',
                message: '',
              },
            ],
            menuHours: [
              {
                id: expect.any(Number),
                day: 'Monday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Tuesday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Wednesday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Thursday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Friday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Saturday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Sunday',
                start: '08:00',
                end: '20:00',
              },
            ],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                messageID: expect.any(Number),
              },
            ],
          },
        ],
      };
      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      expect(res.body).toMatchObject(expectedResponse);
      INSERTED_MENU_ID = res.body.menus[0].menuID; // save menu id of test insertion to use in test delete
    });
    it('should return created menu without any menu sections (isPrixFixe = true)', async () => {
      mockVerify();
      const req = {
        menus: [
          {
            name: 'Integration Test Menu Without Menu Sections',
            isPrixFixe: true,
            isHidden: false,
            menuHours: [
              { day: 'Monday', start: '08:00', end: '20:00' },
              { day: 'Tuesday', start: '08:00', end: '20:00' },
              { day: 'Wednesday', start: '08:00', end: '20:00' },
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
              { day: 'Saturday', start: '08:00', end: '20:00' },
              { day: 'Sunday', start: '08:00', end: '20:00' },
            ],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };
      const expectedResponse = {
        menus: [
          {
            menuID: expect.any(Number),
            name: 'Integration Test Menu Without Menu Sections',
            isPrixFixe: true,
            isHidden: false,
            restaurantID: 1,
            menuHours: [
              {
                id: expect.any(Number),
                day: 'Monday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Tuesday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Wednesday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Thursday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Friday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Saturday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Sunday',
                start: '08:00',
                end: '20:00',
              },
            ],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                messageID: expect.any(Number),
              },
            ],
          },
        ],
      };
      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      expect(res.body).toMatchObject(expectedResponse);
      INSERTED_MENU_ID = res.body.menus[0].menuID; // save menu id of test insertion to use in test delete
    });
    it('should fail to create menu(s) because enum day validation req fails', async () => {
      mockVerify();
      const req = {
        menus: [
          {
            name: 'Integration Test Menu',
            isPrixFixe: false,
            isHidden: false,
            menuHours: [
              { day: 'monday', start: '08:00', end: '20:00' },
              { day: 'Tuesday', start: '08:00', end: '20:00' },
              { day: 'Wednesday', start: '08:00', end: '20:00' },
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
              { day: 'Sat', start: '08:00', end: '20:00' },
              { day: 'Sunday', start: '08:00', end: '20:00' },
            ],
            menuSections: [
              {
                name: 'test menu section',
                message: 'test message',
              },
              {
                name: 'test menu section 2',
              },
            ],
          },
        ],
      };
      const expectedResponse = {};

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
      expect(res.body).toMatchObject(expectedResponse);
    });
    it('should fail to create menu(s) because duplicates of disclaimer position validation req fails', async () => {
      mockVerify();
      const req = {
        menus: [
          {
            name: 'Integration Test Menu',
            isPrixFixe: false,
            isHidden: false,
            menuHours: [
              { day: 'monday', start: '08:00', end: '20:00' },
              { day: 'Tuesday', start: '08:00', end: '20:00' },
              { day: 'Wednesday', start: '08:00', end: '20:00' },
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
              { day: 'Sat', start: '08:00', end: '20:00' },
              { day: 'Sunday', start: '08:00', end: '20:00' },
            ],
            menuSections: [
              {
                name: 'test menu section',
                message: 'test message',
              },
              {
                name: 'test menu section 2',
              },
            ],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                position: 'menu bottom bar',
              },
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };
      const expectedResponse = {};

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
      expect(res.body).toMatchObject(expectedResponse);
    });
    it('should fail to create menu(s) because of more than 3 disclaimer position bassed in req', async () => {
      mockVerify();
      const req = {
        menus: [
          {
            name: 'Integration Test Menu',
            isPrixFixe: false,
            isHidden: false,
            menuHours: [
              { day: 'monday', start: '08:00', end: '20:00' },
              { day: 'Tuesday', start: '08:00', end: '20:00' },
              { day: 'Wednesday', start: '08:00', end: '20:00' },
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
              { day: 'Sat', start: '08:00', end: '20:00' },
              { day: 'Sunday', start: '08:00', end: '20:00' },
            ],
            menuSections: [
              {
                name: 'test menu section',
                message: 'test message',
              },
              {
                name: 'test menu section 2',
              },
            ],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                position: 'menu top bar',
              },
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                position: 'menu bottom bar',
              },
              {
                message: 'INTEGRATION TEST DISCLAIMER2',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };
      const expectedResponse = {};

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
      expect(res.body).toMatchObject(expectedResponse);
    });
    it('should create hidden menu and return isHidden field as true (isHidden = true)', async () => {
      mockVerify();
      const req = {
        menus: [
          {
            name: 'Integration Test Menu isHidden = true',
            isPrixFixe: false,
            isHidden: true,
            menuHours: [
              { day: 'Monday', start: '08:00', end: '20:00' },
              { day: 'Tuesday', start: '08:00', end: '20:00' },
              { day: 'Wednesday', start: '08:00', end: '20:00' },
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
              { day: 'Saturday', start: '08:00', end: '20:00' },
              { day: 'Sunday', start: '08:00', end: '20:00' },
            ],
            menuSections: [
              {
                name: 'test menu section',
                message: 'test message',
              },
              {
                name: 'test menu section 2',
              },
            ],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };
      const expectedResponse = {
        menus: [
          {
            menuID: expect.any(Number),
            name: 'Integration Test Menu isHidden = true',
            isPrixFixe: false,
            isHidden: true,
            restaurantID: 1,
            menuSections: [
              {
                menuSectionID: expect.any(Number),
                name: 'test menu section',
                message: 'test message',
              },
              {
                menuSectionID: expect.any(Number),
                name: 'test menu section 2',
                message: '',
              },
            ],
            menuHours: [
              {
                id: expect.any(Number),
                day: 'Monday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Tuesday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Wednesday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Thursday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Friday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Saturday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Sunday',
                start: '08:00',
                end: '20:00',
              },
            ],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                messageID: expect.any(Number),
              },
            ],
          },
        ],
      };
      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      expect(res.body).toMatchObject(expectedResponse);
      const INSERTED_MENU_ID_ISHIDDEN = res.body.menus[0].menuID; // save menu id of test insertion to use in test delete
      await request(app.getServer()).delete(`/menus/${INSERTED_MENU_ID_ISHIDDEN}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);
    });
    it('should create menu and omit isHidden field from request and return isHidden = false in response', async () => {
      mockVerify();
      const req = {
        menus: [
          {
            name: 'Integration Test Menu isHidden omitted',
            isPrixFixe: false,
            menuHours: [
              { day: 'Monday', start: '08:00', end: '20:00' },
              { day: 'Tuesday', start: '08:00', end: '20:00' },
              { day: 'Wednesday', start: '08:00', end: '20:00' },
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
              { day: 'Saturday', start: '08:00', end: '20:00' },
              { day: 'Sunday', start: '08:00', end: '20:00' },
            ],
            menuSections: [
              {
                name: 'test menu section',
                message: 'test message',
              },
              {
                name: 'test menu section 2',
              },
            ],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };
      const expectedResponse = {
        menus: [
          {
            menuID: expect.any(Number),
            name: 'Integration Test Menu isHidden omitted',
            isPrixFixe: false,
            isHidden: false,
            restaurantID: 1,
            menuSections: [
              {
                menuSectionID: expect.any(Number),
                name: 'test menu section',
                message: 'test message',
              },
              {
                menuSectionID: expect.any(Number),
                name: 'test menu section 2',
                message: '',
              },
            ],
            menuHours: [
              {
                id: expect.any(Number),
                day: 'Monday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Tuesday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Wednesday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Thursday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Friday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Saturday',
                start: '08:00',
                end: '20:00',
              },
              {
                id: expect.any(Number),
                day: 'Sunday',
                start: '08:00',
                end: '20:00',
              },
            ],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                messageID: expect.any(Number),
              },
            ],
          },
        ],
      };
      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      expect(res.body).toMatchObject(expectedResponse);
      const INSERTED_MENU_ID_IS_HIDDEN_OMITTED = res.body.menus[0].menuID; // save menu id of test insertion to use in test delete
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_IS_HIDDEN_OMITTED}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
  });
  describe('PUT /menus', () => {
    const getDisclaimerByPosition = (
      disclaimers: CreateMenuDisclaimersResponseInterface[],
      position: string,
    ): CreateMenuDisclaimersResponseInterface => {
      return disclaimers.find(disclaimer => disclaimer.position === position);
    };
    const validateDisclaimer = (disclaimer: CreateMenuDisclaimersResponseInterface, message: string, position: string) => {
      expect(disclaimer.message).toEqual(message);
      expect(disclaimer.position).toEqual(position);
      expect(typeof disclaimer.messageID).toBe('number');
    };
    it('should return 200 status "OK" and edit menu (isPrixFixe = true)', async () => {
      mockVerify();
      const req = {
        menuID: INSERTED_MENU_ID,
        name: 'Edit Integration Test Menu EDITED',
        isPrixFixe: true,
        menuHours: [
          { day: 'Monday', start: '18:00', end: '21:00' },
          { day: 'Tuesday', start: '18:00', end: '21:00' },
          { day: 'Wednesday', start: '18:00', end: '21:00' },
          { day: 'Thursday', start: '18:00', end: '21:00' },
          { day: 'Friday', start: '18:00', end: '21:00' },
          { day: 'Saturday', start: '18:00', end: '21:00' },
          { day: 'Sunday', start: '18:00', end: '21:00' },
        ],
        disclaimers: {
          DELETE: [],
          INSERT: [],
          UPDATE: [],
        },
      };
      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should return 200 status "OK" and edit menu (isPrixFixe = false)', async () => {
      mockVerify();
      const req = {
        menuID: INSERTED_MENU_ID,
        name: 'Edit Integration Test Menu EDITED',
        isPrixFixe: false,
        menuHours: [
          { day: 'Monday', start: '18:00', end: '21:00' },
          { day: 'Tuesday', start: '18:00', end: '21:00' },
          { day: 'Wednesday', start: '18:00', end: '21:00' },
          { day: 'Thursday', start: '18:00', end: '21:00' },
          { day: 'Friday', start: '18:00', end: '21:00' },
          { day: 'Saturday', start: '18:00', end: '21:00' },
          { day: 'Sunday', start: '18:00', end: '21:00' },
        ],
        disclaimers: {
          DELETE: [],
          INSERT: [],
          UPDATE: [],
        },
      };
      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should return 200 status code OK when inserting both top and bottom menu disclaimers when editing a menu with no disclaimers', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Insert Top and Bottom Disclaimers',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Insert Top and Bottom Disclaimers',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [],
          INSERT: [
            {
              position: 'menu top bar',
              message: 'top',
            },
            {
              position: 'menu bottom bar',
              message: 'bottom',
            },
          ],
          UPDATE: [],
        },
      };

      const response = await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);
      validateDisclaimer(getDisclaimerByPosition(response.body.insertedDisclaimers, 'menu top bar'), 'top', 'menu top bar');
      validateDisclaimer(getDisclaimerByPosition(response.body.insertedDisclaimers, 'menu bottom bar'), 'bottom', 'menu bottom bar');
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status code OK when inserting just top disclaimer when editing a menu with no disclaimers', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Insert Top Disclaimer',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Insert Top Disclaimer',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [],
          INSERT: [
            {
              position: 'menu top bar',
              message: 'top',
            },
          ],
          UPDATE: [],
        },
      };

      const response = await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);
      validateDisclaimer(getDisclaimerByPosition(response.body.insertedDisclaimers, 'menu top bar'), 'top', 'menu top bar');
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status code OK when inserting just bottom menu disclaimers when editing a menu with no disclaimers', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Insert Bottom Disclaimer',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'INSERT Insert Bottom Disclaimer',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [],
          INSERT: [
            {
              position: 'menu bottom bar',
              message: 'bottom',
            },
          ],
          UPDATE: [],
        },
      };

      const response = await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);
      validateDisclaimer(getDisclaimerByPosition(response.body.insertedDisclaimers, 'menu bottom bar'), 'bottom', 'menu bottom bar');
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status code OK when updating both top and bottom menu disclaimers when editing a menu with top and bottom disclaimers', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Update Top and Bottom Disclaimers',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
              {
                message: 'Bottom',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const topDisclaimer = getDisclaimerByPosition(res.body.menus[0].disclaimers, 'menu top bar');
      const bottomDisclaimer = getDisclaimerByPosition(res.body.menus[0].disclaimers, 'menu bottom bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Update Top and Bottom Disclaimers',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [],
          INSERT: [],
          UPDATE: [
            {
              messageID: topDisclaimer.messageID,
              message: 'change top',
            },
            {
              messageID: bottomDisclaimer.messageID,
              message: 'change bottom',
            },
          ],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status code OK when updating just top disclaimer when editing a menu with top disclaimer', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Update Top Disclaimer',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const topDisclaimer = getDisclaimerByPosition(res.body.menus[0].disclaimers, 'menu top bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Update Top Disclaimer',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [],
          INSERT: [],
          UPDATE: [
            {
              messageID: topDisclaimer.messageID,
              message: 'change top',
            },
          ],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status code OK when updating just bottom disclaimer when editing a menu with bottom disclaimer', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Update Bottom Disclaimer',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Bottom',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const bottomDisclaimer = getDisclaimerByPosition(res.body.menus[0].disclaimers, 'menu bottom bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Update Bottom Disclaimer',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [],
          INSERT: [],
          UPDATE: [
            {
              messageID: bottomDisclaimer.messageID,
              message: 'change bottom',
            },
          ],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status code OK when deleting both top and bottom menu disclaimers when editing a menu with top and bottom disclaimers', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Delete Top and Bottom Disclaimers',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
              {
                message: 'Bottom',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Delete Top and Bottom Disclaimers',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [res.body.menus[0].disclaimers[0].messageID, res.body.menus[0].disclaimers[1].messageID],
          INSERT: [],
          UPDATE: [],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status code OK when deleting just top menu disclaimer when editing a menu with just top disclaimer', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Delete Top Disclaimer',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Delete Top Disclaimer',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [res.body.menus[0].disclaimers[0].messageID],
          INSERT: [],
          UPDATE: [],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status code OK when deleting just bottom menu disclaimer when editing a menu with just bottom disclaimer', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Delete Bottom Disclaimer',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Bottom',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Delete Bottom Disclaimer',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [res.body.menus[0].disclaimers[0].messageID],
          INSERT: [],
          UPDATE: [],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status code OK when both updating and deleting separate menu disclaimers of a menu when editing a menu with top and bottom disclaimers', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Delete And Update Top and Bottom Disclaimers',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
              {
                message: 'Bottom',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const topDisclaimer = getDisclaimerByPosition(res.body.menus[0].disclaimers, 'menu top bar');
      const bottomDisclaimer = getDisclaimerByPosition(res.body.menus[0].disclaimers, 'menu bottom bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Delete And Update Top and Bottom Disclaimers',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [topDisclaimer.messageID],
          INSERT: [],
          UPDATE: [
            {
              messageID: bottomDisclaimer.messageID,
              message: 'updating menu disclaimer',
            },
          ],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status code OK when both inserting and deleting separate menu disclaimers of a menu when editing a menu with top disclaimer', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Delete And Insert Top Disclaimer',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const currentTopDisclaimer = getDisclaimerByPosition(res.body.menus[0].disclaimers, 'menu top bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Delete And Insert Top and Bottom Disclaimers',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [currentTopDisclaimer.messageID],
          INSERT: [
            {
              position: 'menu bottom bar',
              message: 'bottom',
            },
          ],
          UPDATE: [],
        },
      };

      const response = await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);
      validateDisclaimer(getDisclaimerByPosition(response.body.insertedDisclaimers, 'menu bottom bar'), 'bottom', 'menu bottom bar');
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status code OK when both inserting and deleting SAME menu disclaimer of a menu when editing a menu with a disclaimer', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Delete And Insert Same Disclaimer',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const currentTopDisclaimer = getDisclaimerByPosition(res.body.menus[0].disclaimers, 'menu top bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Delete And Insert Same Disclaimer',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [currentTopDisclaimer.messageID],
          INSERT: [
            {
              position: 'menu top bar',
              message: 'top',
            },
          ],
          UPDATE: [],
        },
      };

      const response = await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);
      validateDisclaimer(getDisclaimerByPosition(response.body.insertedDisclaimers, 'menu top bar'), 'top', 'menu top bar');
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status code OK when both inserting and updating different menu disclaimers of a menu when editing a menu with a disclaimer', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Updating And Insert Top and Bottom Disclaimers',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const currentTopDisclaimer = getDisclaimerByPosition(res.body.menus[0].disclaimers, 'menu top bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Updating And Insert Top and Bottom Disclaimers',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [],
          INSERT: [
            {
              position: 'menu bottom bar',
              message: 'Bottom',
            },
          ],
          UPDATE: [
            {
              messageID: currentTopDisclaimer.messageID,
              message: 'update top disclaimer',
            },
          ],
        },
      };

      const response = await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);
      validateDisclaimer(getDisclaimerByPosition(response.body.insertedDisclaimers, 'menu bottom bar'), 'Bottom', 'menu bottom bar');
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status code OK when deleting and inserting same menu disclaimer location and also updating different menu disclaimer of a menu when editing a menu with a disclaimer', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Delete And Insert Same Disclaimer',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
              {
                message: 'Bottom',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const currentTopDisclaimer = getDisclaimerByPosition(res.body.menus[0].disclaimers, 'menu top bar');
      const currentBottomDisclaimer = getDisclaimerByPosition(res.body.menus[0].disclaimers, 'menu bottom bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Delete And Insert Same Disclaimer',
        isPrixFixe: false,
        menuHours: [{ day: 'Sunday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [currentBottomDisclaimer.messageID],
          INSERT: [
            {
              position: 'menu bottom bar',
              message: 'Bottom',
            },
          ],
          UPDATE: [
            {
              messageID: currentTopDisclaimer.messageID,
              message: 'update top disclaimer',
            },
          ],
        },
      };

      const response = await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(200);
      validateDisclaimer(getDisclaimerByPosition(response.body.insertedDisclaimers, 'menu bottom bar'), 'Bottom', 'menu bottom bar');
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 409 status code if deleting and updating disclaimers share the same disclaimer id when editing a menu with a disclaimer', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Delete and Update Same Disclaimer',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const currentTopDisclaimer = getDisclaimerByPosition(res.body.menus[0].disclaimers, 'menu top bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Delete and Update Same Disclaimer',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [currentTopDisclaimer.messageID],
          INSERT: [],
          UPDATE: [
            {
              messageID: currentTopDisclaimer.messageID,
              message: 'update top disclaimer',
            },
          ],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(409);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 404 status code if deleting disclaimer id does not exist for a menu when editing a menu with a disclaimer', async () => {
      const fakeID = 99999;
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Delete NonExistent Disclaimer',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const currentTopDisclaimer = getDisclaimerByPosition(res.body.menus[0].disclaimers, 'menu top bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Delete NonExistent Disclaimer',
        isPrixFixe: false,
        menuHours: [{ day: 'Sunday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [fakeID],
          INSERT: [],
          UPDATE: [
            {
              messageID: currentTopDisclaimer.messageID,
              message: 'update top disclaimer',
            },
          ],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(404);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 404 status code if updating disclaimer id does not exist for a menu when editing a menu with a disclaimer', async () => {
      const fakeID = 99999;
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Update NonExistent Disclaimer',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const currentTopDisclaimer = getDisclaimerByPosition(res.body.menus[0].disclaimers, 'menu top bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Update NonExistent Disclaimer',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [currentTopDisclaimer.messageID],
          INSERT: [],
          UPDATE: [
            {
              messageID: fakeID,
              message: 'update top disclaimer',
            },
          ],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(404);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 409 status code if inserting disclaimer in position where a disclaimer already exists', async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Insert Disclaimer Into Already Existing Disclaimer Position',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Insert Disclaimer Into Already Existing Disclaimer Position',
        isPrixFixe: false,
        menuHours: [{ day: 'Monday', start: '18:00', end: '21:00' }],
        disclaimers: {
          DELETE: [],
          INSERT: [
            {
              position: 'menu top bar',
              message: 'insert top',
            },
          ],
          UPDATE: [],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(409);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it(`should fail to edit menu(s) and send back 400 status code due to incorrect disclaimer position type (not equal to 'menu top bar' or 'menu bottom bar')`, async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Insert Disclaimer NonExistent Position',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Insert Disclaimer NonExistent Position',
        isPrixFixe: false,
        menuHours: [
          { day: 'Monday', start: '18:00', end: '21:00' },
          { day: 'Tuesday', start: '18:00', end: '21:00' },
          { day: 'Wednesday', start: '18:00', end: '21:00' },
          { day: 'Thursday', start: '18:00', end: '21:00' },
          { day: 'Friday', start: '18:00', end: '21:00' },
          { day: 'Saturday', start: '18:00', end: '21:00' },
          { day: 'Sunday', start: '18:00', end: '21:00' },
        ],
        disclaimers: {
          DELETE: [],
          INSERT: [
            {
              position: 'menu bar',
              message: 'insert top',
            },
          ],
          UPDATE: [],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(400);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it(`should fail to edit menu(s) and send back 400 status code due to having more than 2 disclaimers in request DELETE`, async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Delete Disclaimer More than 2 disclaimers',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
              {
                message: 'Bottom',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const currentTopDisclaimer = res.body.menus[0].disclaimers.find(disclaimer => disclaimer.position === 'menu top bar');
      const currentBottomDisclaimer = res.body.menus[0].disclaimers.find(disclaimer => disclaimer.position === 'menu bottom bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Delete Disclaimer More than 2 disclaimers',
        isPrixFixe: false,
        menuHours: [
          { day: 'Monday', start: '18:00', end: '21:00' },
          { day: 'Tuesday', start: '18:00', end: '21:00' },
          { day: 'Wednesday', start: '18:00', end: '21:00' },
          { day: 'Thursday', start: '18:00', end: '21:00' },
          { day: 'Friday', start: '18:00', end: '21:00' },
          { day: 'Saturday', start: '18:00', end: '21:00' },
          { day: 'Sunday', start: '18:00', end: '21:00' },
        ],
        disclaimers: {
          DELETE: [currentTopDisclaimer.messageID, currentBottomDisclaimer.messageID, 9999],
          INSERT: [],
          UPDATE: [],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(400);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it(`should fail to edit menu(s) and send back 400 status code due to having more than 2 disclaimers in request UPDATE`, async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Update Disclaimer More than 2 disclaimers',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
              {
                message: 'Bottom',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const currentTopDisclaimer = res.body.menus[0].disclaimers.find(disclaimer => disclaimer.position === 'menu top bar');
      const currentBottomDisclaimer = res.body.menus[0].disclaimers.find(disclaimer => disclaimer.position === 'menu bottom bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Update Disclaimer More than 2 disclaimers',
        isPrixFixe: false,
        menuHours: [
          { day: 'Monday', start: '18:00', end: '21:00' },
          { day: 'Tuesday', start: '18:00', end: '21:00' },
          { day: 'Wednesday', start: '18:00', end: '21:00' },
          { day: 'Thursday', start: '18:00', end: '21:00' },
          { day: 'Friday', start: '18:00', end: '21:00' },
          { day: 'Saturday', start: '18:00', end: '21:00' },
          { day: 'Sunday', start: '18:00', end: '21:00' },
        ],
        disclaimers: {
          DELETE: [],
          INSERT: [],
          UPDATE: [
            {
              messageID: currentTopDisclaimer.messageID,
              message: 'top',
            },
            {
              messageID: currentBottomDisclaimer.messageID,
              message: 'bottom',
            },
            {
              messageID: currentTopDisclaimer.messageID,
              message: 'top',
            },
          ],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(400);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it(`should fail to edit menu(s) and send back 400 status code due to having more than 2 disclaimers in request INSERT`, async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Insert Disclaimer More than 2 disclaimers',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
              {
                message: 'Bottom',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Insert Disclaimer More than 2 disclaimers',
        isPrixFixe: false,
        menuHours: [
          { day: 'Monday', start: '18:00', end: '21:00' },
          { day: 'Tuesday', start: '18:00', end: '21:00' },
          { day: 'Wednesday', start: '18:00', end: '21:00' },
          { day: 'Thursday', start: '18:00', end: '21:00' },
          { day: 'Friday', start: '18:00', end: '21:00' },
          { day: 'Saturday', start: '18:00', end: '21:00' },
          { day: 'Sunday', start: '18:00', end: '21:00' },
        ],
        disclaimers: {
          DELETE: [],
          INSERT: [
            {
              message: 'top',
              position: 'menu top bar',
            },
            {
              message: 'bottom',
              position: 'menu bottom bar',
            },
            {
              message: 'bottom',
              position: 'menu bottom bar',
            },
          ],
          UPDATE: [],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(400);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it(`should fail to edit menu(s) and send back 400 status code due to having duplicate disclaimer ids DELETE`, async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Delete Disclaimer Duplicate ids',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
              {
                message: 'Bottom',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const currentTopDisclaimer = res.body.menus[0].disclaimers.find(disclaimer => disclaimer.position === 'menu top bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Delete Disclaimer Duplicate ids',
        isPrixFixe: false,
        menuHours: [
          { day: 'Monday', start: '18:00', end: '21:00' },
          { day: 'Tuesday', start: '18:00', end: '21:00' },
          { day: 'Wednesday', start: '18:00', end: '21:00' },
          { day: 'Thursday', start: '18:00', end: '21:00' },
          { day: 'Friday', start: '18:00', end: '21:00' },
          { day: 'Saturday', start: '18:00', end: '21:00' },
          { day: 'Sunday', start: '18:00', end: '21:00' },
        ],
        disclaimers: {
          DELETE: [currentTopDisclaimer.messageID, currentTopDisclaimer.messageID],
          INSERT: [],
          UPDATE: [],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(400);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it(`should fail to edit menu(s) and send back 400 status code due to having duplicate disclaimer ids UPDATE`, async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Update Disclaimer Duplicate ids',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
              {
                message: 'Bottom',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;
      const currentTopDisclaimer = res.body.menus[0].disclaimers.find(disclaimer => disclaimer.position === 'menu top bar');

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Update Disclaimer Duplicate ids',
        isPrixFixe: false,
        menuHours: [
          { day: 'Monday', start: '18:00', end: '21:00' },
          { day: 'Tuesday', start: '18:00', end: '21:00' },
          { day: 'Wednesday', start: '18:00', end: '21:00' },
          { day: 'Thursday', start: '18:00', end: '21:00' },
          { day: 'Friday', start: '18:00', end: '21:00' },
          { day: 'Saturday', start: '18:00', end: '21:00' },
          { day: 'Sunday', start: '18:00', end: '21:00' },
        ],
        disclaimers: {
          DELETE: [],
          INSERT: [],
          UPDATE: [currentTopDisclaimer.messageID, currentTopDisclaimer.messageID],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(400);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it(`should fail to edit menu(s) and send back 400 status code due to having duplicate disclaimer positions INSERT`, async () => {
      mockVerify();
      const insert_req = {
        menus: [
          {
            name: 'TEST Insert Disclaimer Duplicate ids',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section 3',
                message: 'test message',
              },
              {
                name: 'test menu section 4',
              },
            ],
            disclaimers: [
              {
                message: 'Top',
                position: 'menu top bar',
              },
              {
                message: 'Bottom',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(insert_req).expect(200);
      INSERTED_MENU_ID_DISCLAIMER_TESTS = res.body.menus[0].menuID;

      const editReq = {
        menuID: INSERTED_MENU_ID_DISCLAIMER_TESTS,
        name: 'TEST Insert Disclaimer Duplicate ids',
        isPrixFixe: false,
        menuHours: [
          { day: 'Monday', start: '18:00', end: '21:00' },
          { day: 'Tuesday', start: '18:00', end: '21:00' },
          { day: 'Wednesday', start: '18:00', end: '21:00' },
          { day: 'Thursday', start: '18:00', end: '21:00' },
          { day: 'Friday', start: '18:00', end: '21:00' },
          { day: 'Saturday', start: '18:00', end: '21:00' },
          { day: 'Sunday', start: '18:00', end: '21:00' },
        ],
        disclaimers: {
          DELETE: [],
          INSERT: [
            {
              message: 'top 1',
              position: 'menu top bar',
            },
            {
              message: 'top 2',
              position: 'menu top bar',
            },
          ],
          UPDATE: [],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(editReq).expect(400);
      mockVerify();
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_DISCLAIMER_TESTS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should fail to edit menu(s) and send back 400 status code because enum day validation req fails', async () => {
      mockVerify();
      const req = {
        menuID: INSERTED_MENU_ID,
        name: 'Integration Test Menu EDITED',
        isPrixFixe: false,
        menuHours: [
          { day: 'monday', start: '09:00', end: '23:00' },
          { day: 'Tues', start: '08:00', end: '20:00' },
          { day: 'Wednesday', start: '08:00', end: '20:00' },
          { day: 'Thursday', start: '08:00', end: '20:00' },
          { day: 'Friday', start: '18:00', end: '02:00' },
          { day: 'Saturday', start: '08:00', end: '20:00' },
        ],
        disclaimers: {
          DELETE: [],
          INSERT: [],
          UPDATE: [],
        },
      };

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should fail to edit menu(s) and send back 400 status code due to incorrect empty body request', async () => {
      mockVerify();
      const req = {};

      await request(app.getServer()).put('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
  });
  describe('GET /menus', () => {
    const MENU_ID = 275;

    // need to make sure we got all keys and sub keys of nested arrays and objects of entire response included in this function
    const assertGetMenuDetailsResponse = menu => {
      expect(typeof menu?.menuID).toBe('number');
      expect(typeof menu?.menuName).toBe('string');
      expect(typeof menu?.restaurantID).toBe('number');
      expect(typeof menu?.isPrixFixe).toBe('boolean');
      expect(typeof menu?.isHidden).toBe('boolean');

      // Checking arrays are indeed arrays
      expect(Array.isArray(menu?.messages)).toBe(true);
      expect(Array.isArray(menu?.menuSections)).toBe(true);
      expect(Array.isArray(menu?.menuHours)).toBe(true);

      menu?.messages?.forEach(_message => {
        expect(typeof _message?.message).toBe('string');
        expect(typeof _message?.messageID).toBe('number');
        expect(typeof _message?.position).toBe('string');
        expect(typeof _message?.menuID).toBe('number');
      });

      menu?.menuSections?.forEach(section => {
        expect(typeof section?.menuSectionID).toBe('number');
        expect(typeof section?.sectionName).toBe('string');
        expect(typeof section?.message).toBe('string');
        expect(typeof section?.isHidden).toBe('boolean');
        expect(Array.isArray(section?.items)).toBe(true);

        section?.items?.forEach(item => {
          expect(typeof item?.name).toBe('string');
          expect(typeof item?.description).toBe('string');
          expect(typeof item?.menuItemID).toBe('number');
          expect(typeof item?.category).toBe('string');
          expect(typeof item?.createdAt).toBe('string');
          expect(typeof item?.updatedAt).toBe('string');
          expect(typeof item?.isHidden).toBe('boolean');
          expect(typeof item?.imageURL).toBe('string');
          item.calories || item.calories === 0 ? expect(typeof item?.menuItemID).toBe('number') : expect(item.calories).toBeNull();
          expect(Array.isArray(item?.dietaryRestrictions)).toBe(true);
          expect(Array.isArray(item?.tags)).toBe(true);
          expect(Array.isArray(item?.media)).toBe(true);
          expect(Array.isArray(item?.modifierGroups)).toBe(true);
          expect(Array.isArray(item?.pairings)).toBe(true);
          expect(Array.isArray(item?.allItemSizes)).toBe(true);

          item?.dietaryRestrictions?.forEach(restriction => {
            expect(typeof restriction?.restrictionID).toBe('number');
            expect(typeof restriction?.name).toBe('string');
          });

          expect(item?.baseItemSize).toMatchObject({
            id: expect.any(Number),
            label: expect.any(String),
            price: expect.any(Number),
            priceOverride: expect.any(String),
          });

          item?.allItemSizes?.forEach(size => {
            expect(typeof size?.id).toBe('number');
            expect(typeof size?.label).toBe('string');
            expect(typeof size?.price).toBe('number');
            expect(typeof size?.priceOverride).toBe('string');
          });

          item?.pairings?.forEach(pair => {
            expect(typeof pair?.name).toBe('string');
            expect(typeof pair?.drinkItemID).toBe('number');
            expect(typeof pair?.isHidden).toBe('boolean');
          });

          item?.dietaryRestrictions?.forEach(restriction => {
            expect(typeof restriction?.restrictionID).toBe('number');
            expect(typeof restriction?.name).toBe('string');
          });

          item?.tags?.forEach(tag => {
            expect(typeof tag?.tagID).toBe('number');
            expect(typeof tag?.tagColor).toBe('string');
            expect(typeof tag?.name).toBe('string');
          });

          item?.media?.forEach(media => {
            expect(typeof media?.type).toBe('string');
            expect(typeof media?.mediaID).toBe('number');
            expect(typeof media?.mediaURL).toBe('string');
            if (Object.keys(media?.thumbnail).length > 0) {
              expect(media?.thumbnail).toMatchObject({
                thumbnailID: expect.any(Number),
                thumbnailURL: expect.any(String),
              });
            }
          });

          item?.modifierGroups?.forEach(modifierGroup => {
            expect(typeof modifierGroup?.label).toBe('string');
            expect(typeof modifierGroup?.name).toBe('string');
            expect(typeof modifierGroup?.modifierGroupID).toBe('number');
            expect(Array.isArray(modifierGroup?.modifiers)).toBe(true);

            modifierGroup?.modifiers?.forEach(modifier => {
              expect(typeof modifier?.modifierID).toBe('number');
              expect(typeof modifier?.name).toBe('string');
              expect(typeof modifier?.description).toBe('string');
              expect(typeof modifier?.price).toBe('number');
              expect(typeof modifier?.isHidden).toBe('boolean');
              expect(typeof modifier?.imageURL).toBe('string');
            });
          });
        });
      });

      menu?.menuHours?.forEach(hour => {
        expect(typeof hour?.day).toBe('string');
        expect(typeof hour?.start).toBe('string');
        expect(typeof hour?.end).toBe('string');
      });
    };

    it('should return 200 status "OK" and get menu details of a menu', async () => {
      mockVerify();

      const createDrinkItemRequest = {
        name: 'DRINK ITEM FOR PAIRING',
        category: 'drink',
        menuSectionID: 1,
        baseItemSize: {
          label: 'default',
          price: 599,
        },
        allItemSizes: [
          {
            label: 'default',
            price: 599,
          },
        ],
      };

      // add tags to menu item 345 so that it is added in expectedResponse
      await request(app.getServer())
        .put('/menuItem/tag')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          menuItemID: 345,
          tagIDs: [1],
        })
        .expect(200);

      // create drink and pair with menu item
      const createDrinkItemResponse = await request(app.getServer())
        .post('/drinkItem')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createDrinkItemRequest)
        .expect(200);
      const INSERTED_DRINK_ITEM_ID = createDrinkItemResponse.body.menuItemID;
      await request(app.getServer())
        .put('/menuItem/pair')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          menuItemID: 345,
          pairingItemIDs: [INSERTED_DRINK_ITEM_ID],
        })
        .expect(200);

      const res = await request(app.getServer()).get(`/menus/${MENU_ID}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);
      assertGetMenuDetailsResponse(res.body);

      // cleanup
      await request(app.getServer())
        .put('/menuItem/tag')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          menuItemID: 345,
          tagIDs: [],
        })
        .expect(200);
      await request(app.getServer())
        .put('/menuItem/pair')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({
          menuItemID: 345,
          pairingItemIDs: [],
        })
        .expect(200);
      await request(app.getServer())
        .delete(`/drinkItem/${INSERTED_DRINK_ITEM_ID}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status "OK" and get menu details of a menu with multiple menu disclaimers', async () => {
      mockVerify();
      const topAndBottomDisclaimerMenuRequest = {
        menus: [
          {
            name: 'GET Menus Test Top and Bottom Disclaimers',
            isPrixFixe: false,
            menuHours: [
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
            ],
            menuSections: [],
            disclaimers: [
              {
                message: 'Test Top',
                position: 'menu top bar',
              },
              {
                message: 'Test Bottom',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };

      const temp_inserted_menu = await request(app.getServer())
        .post('/menus')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(topAndBottomDisclaimerMenuRequest)
        .expect(200);
      const INSERTED_MENU_ID_BOTH_DISCLAIMERS = temp_inserted_menu.body.menus[0].menuID; // save menu id

      const res = await request(app.getServer())
        .get(`/menus/${INSERTED_MENU_ID_BOTH_DISCLAIMERS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);

      assertGetMenuDetailsResponse(res.body);

      // cleanup
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_BOTH_DISCLAIMERS}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status "OK" and get menu details of a menu with just bottom menu disclaimers', async () => {
      mockVerify();
      const bottomDisclaimerMenuRequest = {
        menus: [
          {
            name: 'GET Menus Test Bottom Disclaimer',
            isPrixFixe: true,
            menuHours: [
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
            ],
            menuSections: [],
            disclaimers: [
              {
                message: 'Test Bottom',
                position: 'menu bottom bar',
              },
            ],
          },
        ],
      };

      const temp_inserted_menu = await request(app.getServer())
        .post('/menus')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(bottomDisclaimerMenuRequest)
        .expect(200);
      const INSERTED_MENU_ID_BOTTOM_DISCLAIMER = temp_inserted_menu.body.menus[0].menuID; // save menu id

      const res = await request(app.getServer())
        .get(`/menus/${INSERTED_MENU_ID_BOTTOM_DISCLAIMER}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);

      assertGetMenuDetailsResponse(res.body);

      // cleanup
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_BOTTOM_DISCLAIMER}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should return 200 status "OK" and get menu details of a menu with just top menu disclaimer (empty disclaimer already tested with GET /menus/:275)', async () => {
      mockVerify();
      const topDisclaimerMenuRequest = {
        menus: [
          {
            name: 'GET Menus Test Top Disclaimer',
            isPrixFixe: false,
            menuHours: [{ day: 'Thursday', start: '08:00', end: '20:00' }],
            menuSections: [],
            disclaimers: [
              {
                message: 'Test Top',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };

      const temp_inserted_menu = await request(app.getServer())
        .post('/menus')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(topDisclaimerMenuRequest)
        .expect(200);
      const INSERTED_MENU_ID_TOP_DISCLAIMER = temp_inserted_menu.body.menus[0].menuID; // save menu id

      const res = await request(app.getServer())
        .get(`/menus/${INSERTED_MENU_ID_TOP_DISCLAIMER}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);

      assertGetMenuDetailsResponse(res.body);

      // cleanup
      await request(app.getServer())
        .delete(`/menus/${INSERTED_MENU_ID_TOP_DISCLAIMER}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    // this test might be unnecessary / deprecated soon as the modifier groups and modifiers will be moved over from db patch migration eventually
    it('should return 200 status "OK" and get menu details of a menu with modifier groups and modifiers', async () => {
      // create a modifier
      mockVerify();
      const reqModifier = { name: 'with all values', description: 'This is a test', price: 100 };
      const resModifier = await request(app.getServer())
        .post('/modifier')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(reqModifier)
        .expect(200);

      // create a modifier group and tie the created modifier to this modifier group
      const reqModifierGroup = {
        name: 'TEST_NAME',
        label: 'TEST_LABEL',
        modifierIDs: [resModifier.body.modifierID],
      };
      mockVerify();
      const resModifierGroup = await request(app.getServer())
        .post('/modifierGroup')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(reqModifierGroup)
        .expect(200);

      // link modifier group to menu item
      const reqLinkGroupToMenuItem = {
        menuItemID: 345,
        modifierGroupIDs: [resModifierGroup.body.modifierGroupID],
      };
      mockVerify();
      await request(app.getServer())
        .put('/menuItem/modifierGroups')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(reqLinkGroupToMenuItem)
        .expect(200);

      // finally get the result of the modifier groups and modifier tied to it in the get menu details request.
      mockVerify();
      const res = await request(app.getServer()).get(`/menus/${MENU_ID}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);

      // compare response with expected response
      assertGetMenuDetailsResponse(res.body);

      // cleanup
      await removeModifierGroupAndModifier(resModifierGroup.body.modifierGroupID, resModifier.body.modifierID);
    });
    it('should return 200 status "OK" and get menu details of a menu (isPrixFixe = true)', async () => {
      mockVerify();
      const repository = await ormConnection();
      await repository.update(MenuEntity, MENU_ID, { is_prix_fixe: true });

      const res = await request(app.getServer()).get(`/menus/${MENU_ID}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);

      assertGetMenuDetailsResponse(res.body);

      await repository.update(MenuEntity, MENU_ID, { is_prix_fixe: false });
    });
    it('should fail to get menu and send back 401 status code because user is not authorized to get menu or menu does not exist for this restaurant', async () => {
      mockVerify();
      const INCORRECT_MENU_ID = 286;

      await request(app.getServer()).get(`/menus/${INCORRECT_MENU_ID}`).set('Authorization', 'token').set('restaurantID', '1').expect(401);
    });
    it('should fail to get menu and send back 400 status code due to incorrect menuID type string passed in and not integer', async () => {
      mockVerify();
      const INCORRECT_MENU_ID_TYPE = 'Not an integer';

      await request(app.getServer()).get(`/menus/${INCORRECT_MENU_ID_TYPE}`).set('Authorization', 'token').set('restaurantID', '1').expect(400);
    });
  });
  describe('DELETE /menu', () => {
    it('should delete menu', async () => {
      mockVerify();
      await request(app.getServer()).delete(`/menus/${INSERTED_MENU_ID}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);
    });
  });
  describe('PUT /menus/hide', () => {
    it('should successfully hide menu', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuID: 275,
        hide: true,
      };
      await request(app.getServer()).put('/menus/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should successfully un-hide menu', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuID: 275,
        hide: false,
      };
      await request(app.getServer()).put('/menus/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should throw 401 HttpException error if menu id doesnt exist', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuID: 9999999,
        hide: false,
      };
      await request(app.getServer()).put('/menus/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(401);
    });
    it('should throw 400 HttpException error if bad request', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuID: 275,
      };
      await request(app.getServer()).put('/menus/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
  });
  describe('POST /generateFile', () => {
    const PDF_FORMAT = 'pdf';
    const DOCX_FORMAT = 'docx';
    it('should generate menu pdf file', async () => {
      mockVerify();
      const req = {
        menus: [
          {
            name: 'Integration Test Menu PDF',
            isPrixFixe: false,
            menuHours: [{ day: 'Monday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section',
                message: 'test message',
              },
              {
                name: 'test menu section 2',
              },
            ],
            disclaimers: [],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      const MENU_ID = res.body.menus[0].menuID;
      const MENU_SECTION_ID = res.body.menus[0].menuSections[0].menuSectionID;

      const createMenuItemReq = {
        name: 'MENU ITEM TEST 1',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: MENU_SECTION_ID,
        baseItemSize: {
          label: 'default',
          price: 599,
        },
        allItemSizes: [
          {
            label: 'default',
            price: 599,
          },
        ],
      };

      const menuItemResponse = await request(app.getServer())
        .post('/menuItem')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createMenuItemReq)
        .expect(200);

      const req2 = {
        menuID: MENU_ID,
        fileFormat: PDF_FORMAT,
      };

      mockVerify();

      const result = await request(app.getServer())
        .post(`/menus/generateFile`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req2)
        .expect(200);

      expect(result.body).toEqual({ fileURL: expect.any(String) });

      // cleanup
      await removeMenuItem(menuItemResponse.body.menuItemID);
      await removeMenu(MENU_ID);
    });
    it('should generate menu docx file', async () => {
      mockVerify();
      const req = {
        menus: [
          {
            name: 'Integration Test Menu PDF',
            isPrixFixe: false,
            menuHours: [{ day: 'Monday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section',
                message: 'test message',
              },
              {
                name: 'test menu section 2',
              },
            ],
            disclaimers: [],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      const MENU_ID = res.body.menus[0].menuID;
      const MENU_SECTION_ID = res.body.menus[0].menuSections[0].menuSectionID;

      const createMenuItemReq = {
        name: 'MENU ITEM TEST 1',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: MENU_SECTION_ID,
        baseItemSize: {
          label: 'default',
          price: 599,
        },
        allItemSizes: [
          {
            label: 'default',
            price: 599,
          },
        ],
      };

      const menuItemResponse = await request(app.getServer())
        .post('/menuItem')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createMenuItemReq)
        .expect(200);

      const req2 = {
        menuID: MENU_ID,
        fileFormat: DOCX_FORMAT,
      };

      mockVerify();

      const result = await request(app.getServer())
        .post(`/menus/generateFile`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req2)
        .expect(200);

      expect(result.body).toEqual({ fileURL: expect.any(String) });

      // cleanup
      await removeMenuItem(menuItemResponse.body.menuItemID);
      await removeMenu(MENU_ID);
    });
    it('should throw 422 HttpException error if menu sections dont exist for menu', async () => {
      mockVerify();
      const req = {
        menus: [
          {
            name: 'Integration Test Menu PDF',
            isPrixFixe: false,
            menuHours: [
              { day: 'Monday', start: '08:00', end: '20:00' },
              { day: 'Tuesday', start: '08:00', end: '20:00' },
              { day: 'Wednesday', start: '08:00', end: '20:00' },
              { day: 'Thursday', start: '08:00', end: '20:00' },
              { day: 'Friday', start: '08:00', end: '20:00' },
              { day: 'Saturday', start: '08:00', end: '20:00' },
              { day: 'Sunday', start: '08:00', end: '20:00' },
            ],
            menuSections: [],
            disclaimers: [
              {
                message: 'INTEGRATION TEST DISCLAIMER',
                position: 'menu top bar',
              },
            ],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      const MENU_ID = res.body.menus[0].menuID;

      const req2 = {
        menuID: MENU_ID,
        fileFormat: DOCX_FORMAT,
      };

      mockVerify();
      await request(app.getServer()).post(`/menus/generateFile`).set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(422);

      // cleanup
      await removeMenu(MENU_ID);
    });
    it('should throw 422 HttpException error if menu items dont exist for menu', async () => {
      mockVerify();
      const req = {
        menus: [
          {
            name: 'Integration Test Menu PDF',
            isPrixFixe: false,
            menuHours: [{ day: 'Monday', start: '08:00', end: '20:00' }],
            menuSections: [
              {
                name: 'test menu section',
                message: 'test message',
              },
              {
                name: 'test menu section 2',
              },
            ],
            disclaimers: [],
          },
        ],
      };

      const res = await request(app.getServer()).post('/menus').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      const MENU_ID = res.body.menus[0].menuID;

      const req2 = {
        menuID: MENU_ID,
        fileFormat: PDF_FORMAT,
      };

      mockVerify();

      await request(app.getServer()).post(`/menus/generateFile`).set('Authorization', 'token').set('restaurantID', '1').send(req2).expect(422);

      // cleanup
      await removeMenu(MENU_ID);
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

/**
 * remove modifer groups and modifiers
 */
const removeModifierGroupAndModifier = async (modifierGroupID: number, modifierID: number): Promise<void> => {
  const repository = await ormConnection();
  await repository.delete(ModifierGroupToMenuItemLinkEntity, { modifierGroupID });
  await repository.delete(ModifierToModifierGroupLinkEntity, { modifierGroupID });
  await repository.delete(ModifierGroupEntity, modifierGroupID);
  await repository.delete(ModifierEntity, modifierID);
};

/**
 * remove menus, and sections, and hours of menu
 */
const removeMenu = async (menuID: number) => {
  const repository = await ormConnection();
  await repository.delete(MenuSectionEntity, { menu_id: menuID });
  await repository.delete(MenuHoursEntity, { menu_id: menuID });
  await repository.delete(MenuEntity, menuID);
};

/**
 * remove menus, and sections, and hours of menu
 */
const removeMenuItem = async (menuItemID: number) => {
  const repository = await ormConnection();
  await repository.delete(MenuItemEntity, menuItemID);
};
