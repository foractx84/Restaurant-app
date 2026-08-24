import { app } from '@/server';
import request from 'supertest';
import { getConnection } from 'typeorm';
import jwt from 'jsonwebtoken';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import MenuItemModel from '@/models/menuItem.model';
import { CreateModifierRequestInterface } from '@interfaces/modifier.interface';
import { ormConnection } from '@utils/dbUtils';
import { ModifierToModifierGroupLinkEntity } from '@entities/modifierToModiferGroupLink.entity';
import { ModifierGroupEntity } from '@entities/modifierGroup.entity';
import { ModifierEntity } from '@entities/modifier.entity';
import { ModifierGroupToMenuItemLinkEntity } from '@entities/modifierGroupToMenuItemLink.entity';

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
    MAX_MULTER_FILE_SIZE_LIMIT: 75000000,
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

const mockAuthService = new AuthService(new UsersModel());
const mockMenuItemModel = new MenuItemModel();

describe('menu items API', () => {
  let INSERTED_MENU_ITEM_ID;
  let INSERTED_MENU_SECTION_ID;
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());

  describe('POST /menuItem', () => {
    it('should return created menu item', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        name: 'MENU ITEM TEST 1',
        description: 'DESCRIPTION',
        category: 'food',
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
        calories: 100,
      };
      const expectedResponse = {
        menuItemID: expect.any(Number),
        menuItemUrlID: expect.any(String),
        name: 'MENU ITEM TEST 1',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: 1,
        isHidden: false,
        isFeatured: false,
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
        calories: 100,
      };
      const res = await request(app.getServer()).post('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
      expect(res.body).toMatchObject(expectedResponse);
      INSERTED_MENU_ITEM_ID = res.body.menuItemID;
      INSERTED_MENU_SECTION_ID = res.body.menuSectionID;
    });
    it('should throw 400 Bad Request when Base Item Size is not included in All Item Sizes', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        name: 'MENU ITEM TEST 2',
        description: 'DESCRIPTION',
        category: 'food',
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
      await request(app.getServer()).post('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should throw 400 Bad Request when All Item Sizes has a duplicate label', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        name: 'MENU ITEM TEST 3',
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
      await request(app.getServer()).post('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
  });
  describe('PUT /menuItem', () => {
    it('should successfully edit menu item with same menu item name and menu section as original', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        name: 'MENU ITEM TEST 1',
        description: 'DESCRIPTION',
        category: 'food',
        menuItemID: INSERTED_MENU_ITEM_ID,
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
        calories: 100,
      };
      await request(app.getServer()).put('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should successfully edit menu item by removing calories value from menu item', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        name: 'MENU ITEM TEST 1',
        description: 'DESCRIPTION',
        category: 'food',
        menuItemID: INSERTED_MENU_ITEM_ID,
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
        calories: null,
      };
      await request(app.getServer()).put('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should throw 400 Bad Request when Base Item Size is not included in All Item Sizes when editing menu item', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        name: 'MENU ITEM TEST 2',
        description: 'DESCRIPTION',
        category: 'food',
        menuItemID: INSERTED_MENU_ITEM_ID,
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
        ],
      };
      await request(app.getServer()).put('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should throw 400 Bad Request when All Item Sizes has a duplicate label when editing menu item', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        name: 'MENU ITEM TEST 3',
        description: 'DESCRIPTION',
        category: 'food',
        menuItemID: INSERTED_MENU_ITEM_ID,
        menuSectionID: INSERTED_MENU_SECTION_ID,
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
      await request(app.getServer()).put('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should successfully edit menu item and move it to different menu section since name is unique and check if list order is correct for both menu sections', async () => {
      const NEW_MENU_SECTION = 2;
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        name: 'MENU ITEM TEST 1',
        description: 'DESCRIPTION',
        category: 'food',
        menuItemID: INSERTED_MENU_ITEM_ID,
        menuSectionID: NEW_MENU_SECTION,
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
        calories: 200,
      };

      await request(app.getServer()).put('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);

      // check old menu section list order update (queries order ascending via list order)
      const oldMenuItems = await mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID(INSERTED_MENU_SECTION_ID);
      const oldExpectedListOrder = [];
      const oldActualListOrder = [];
      oldMenuItems
        .sort((itemA, itemB) => itemA.list_order - itemB.list_order) // must sort due to query not returning via ascending list order
        .map((item, index) => {
          oldActualListOrder.push(item.list_order);
          oldExpectedListOrder.push(index);
        });

      // check new menu section has correct list order 0...n index
      const newMenuItems = await mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID(NEW_MENU_SECTION);
      const newExpectedListOrder = [];
      const newActualListOrder = [];
      newMenuItems
        .sort((itemA, itemB) => itemA.list_order - itemB.list_order)
        .map((item, index) => {
          newActualListOrder.push(item.list_order);
          newExpectedListOrder.push(index);
        });

      // get edited menu item with new list order value
      const editedMenuItemEntity = await mockMenuItemModel.getMenuItemEntityByID(req.menuItemID);

      // cleanup, move menu item back to original menu section
      req.menuSectionID = INSERTED_MENU_SECTION_ID;
      await request(app.getServer()).put('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);

      // do list order test expect .toEqual() checks after endpoints are called and test is cleaned up (moving menu item back)....

      // check old menu sections list order [0, 1, 2, 3, 4....]
      expect(oldActualListOrder).toEqual(oldExpectedListOrder);

      // check new menu sections list order [0, 1, 2, 3, 4....]
      expect(newActualListOrder).toEqual(newExpectedListOrder);

      // check if list order last value n is equal to edited menu item
      expect(editedMenuItemEntity.list_order).toEqual(newExpectedListOrder.length - 1);

      // check new menu section list order update after moving menu item back to original
      const tempMovedMenuItems = await mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID(NEW_MENU_SECTION);
      const tempMovedExpectedListOrder = [];
      const tempMovedActualListOrder = [];
      tempMovedMenuItems
        .sort((itemA, itemB) => itemA.list_order - itemB.list_order)
        .map((item, index) => {
          tempMovedActualListOrder.push(item.list_order);
          tempMovedExpectedListOrder.push(index);
        });

      // check original menu section has correct list order 0...n index
      const originalMenuItems = await mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID(INSERTED_MENU_SECTION_ID);
      const originalExpectedListOrder = [];
      const originalActualListOrder = [];
      originalMenuItems
        .sort((itemA, itemB) => itemA.list_order - itemB.list_order)
        .map((item, index) => {
          originalActualListOrder.push(item.list_order);
          originalExpectedListOrder.push(index);
        });

      // get edited menu item now moved back to original for latest list order value
      const originalEditedMenuItemEntity = await mockMenuItemModel.getMenuItemEntityByID(req.menuItemID);

      // check temporarily moved to menu sections list order [0, 1, 2, 3, 4....]
      expect(tempMovedActualListOrder).toEqual(tempMovedExpectedListOrder);

      // check original menu sections list order [0, 1, 2, 3, 4....]
      expect(originalActualListOrder).toEqual(originalExpectedListOrder);

      // check if list order last value n is equal to edited menu item
      expect(originalEditedMenuItemEntity.list_order).toEqual(originalExpectedListOrder.length - 1);
    });
    it('should successfully edit menu item while moving from old to new menu sections with old menu section having menu items and new menu section empty while maintaining list order', async () => {
      const MENU_ID = 275;
      const req_menu_sections = {
        menuID: MENU_ID,
        menuSections: [
          {
            name: 'INTEGRATION TEST menu section list order A',
            message: 'test message X',
          },
          {
            name: 'INTEGRATION TEST menu section list order B',
          },
        ],
      };

      // menu section A and menu section B
      const res = await request(app.getServer())
        .post('/menuSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req_menu_sections)
        .expect(200);
      const INSERTED_MENU_SECTION_ID = [];
      INSERTED_MENU_SECTION_ID[0] = res.body.menuSections[0].menuSectionID; // save menu section id of test insertion to use in test delete
      INSERTED_MENU_SECTION_ID[1] = res.body.menuSections[1].menuSectionID; // save menu section id of test insertion to use in test delete

      const req_menu_item0 = {
        name: 'MENU ITEM TEST LIST ORDER 0',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: INSERTED_MENU_SECTION_ID[0],
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
      const req_menu_item1 = {
        name: 'MENU ITEM TEST LIST ORDER 1',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: INSERTED_MENU_SECTION_ID[0],
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
      const req_menu_item2 = {
        name: 'MENU ITEM TEST LIST ORDER 2',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: INSERTED_MENU_SECTION_ID[0],
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
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      // insert menu items 1, 2, and 3 (we will only move menu item 1)
      await request(app.getServer()).post('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req_menu_item0).expect(200);
      const res1 = await request(app.getServer())
        .post('/menuItem')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req_menu_item1)
        .expect(200);
      await request(app.getServer()).post('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req_menu_item2).expect(200);
      const INSERTED_MENU_ITEM_ID_1 = res1.body.menuItemID;

      const edit_req_menu_item1 = {
        name: 'MENU ITEM TEST LIST ORDER 1',
        description: 'DESCRIPTION',
        category: 'food',
        menuItemID: INSERTED_MENU_ITEM_ID_1,
        menuSectionID: INSERTED_MENU_SECTION_ID[1],
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

      // move middle menu item from sectionA (full) to sectionB (empty)
      await request(app.getServer()).put('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(edit_req_menu_item1).expect(200);

      // check old menu section list order update (queries order ascending via list order)
      const oldMenuItems = await mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID(INSERTED_MENU_SECTION_ID[0]);
      const oldExpectedListOrder = [];
      const oldActualListOrder = [];
      oldMenuItems
        .sort((itemA, itemB) => itemA.list_order - itemB.list_order) // must sort due to query not returning via ascending list order
        .map((item, index) => {
          oldActualListOrder.push(item.list_order);
          oldExpectedListOrder.push(index);
        });

      // check new menu section has correct list order 0...n index
      const newMenuItems = await mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID(INSERTED_MENU_SECTION_ID[1]);
      const newExpectedListOrder = [];
      const newActualListOrder = [];
      newMenuItems
        .sort((itemA, itemB) => itemA.list_order - itemB.list_order)
        .map((item, index) => {
          newActualListOrder.push(item.list_order);
          newExpectedListOrder.push(index);
        });

      // get edited menu item with new list order value
      const editedMenuItemEntity = await mockMenuItemModel.getMenuItemEntityByID(INSERTED_MENU_ITEM_ID_1);

      // cleanup, move menu item back to original menu section....menuSectionB (empty after move) to menuSectionA (full)
      edit_req_menu_item1.menuSectionID = INSERTED_MENU_SECTION_ID[0];
      await request(app.getServer()).put('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(edit_req_menu_item1).expect(200);

      // do list order test expect .toEqual() checks after endpoints are called and test is cleaned up (moving menu item back)....

      // check old menu sections list order [0, 1, 2, 3, 4....]
      expect(oldActualListOrder).toEqual(oldExpectedListOrder);

      // check new menu sections list order [0, 1, 2, 3, 4....]
      expect(newActualListOrder).toEqual(newExpectedListOrder);

      // check if list order last value n is equal to edited menu item
      expect(editedMenuItemEntity.list_order).toEqual(newExpectedListOrder.length - 1);

      // check new menu section list order update after moving menu item back to original
      const tempMovedMenuItems = await mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID(INSERTED_MENU_SECTION_ID[1]);
      const tempMovedExpectedListOrder = [];
      const tempMovedActualListOrder = [];
      tempMovedMenuItems
        .sort((itemA, itemB) => itemA.list_order - itemB.list_order)
        .map((item, index) => {
          tempMovedActualListOrder.push(item.list_order);
          tempMovedExpectedListOrder.push(index);
        });

      // check original menu section has correct list order 0...n index
      const originalMenuItems = await mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID(INSERTED_MENU_SECTION_ID[0]);
      const originalExpectedListOrder = [];
      const originalActualListOrder = [];
      originalMenuItems
        .sort((itemA, itemB) => itemA.list_order - itemB.list_order)
        .map((item, index) => {
          originalActualListOrder.push(item.list_order);
          originalExpectedListOrder.push(index);
        });

      // get edited menu item now moved back to original for latest list order value
      const originalEditedMenuItemEntity = await mockMenuItemModel.getMenuItemEntityByID(INSERTED_MENU_ITEM_ID_1);

      // check temporarily moved to menu sections list order [0, 1, 2, 3, 4....]
      expect(tempMovedActualListOrder).toEqual(tempMovedExpectedListOrder);

      // check original menu sections list order [0, 1, 2, 3, 4....]
      expect(originalActualListOrder).toEqual(originalExpectedListOrder);

      // check if list order last value n is equal to edited menu item
      expect(originalEditedMenuItemEntity.list_order).toEqual(originalExpectedListOrder.length - 1);

      // cleanup, remove both menu sections and menu items
      await request(app.getServer())
        .delete(`/menuSections/${INSERTED_MENU_SECTION_ID[0]}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
      await request(app.getServer())
        .delete(`/menuSections/${INSERTED_MENU_SECTION_ID[1]}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
    it('should successfully edit menu item while moving from old to new menu sections with old menu section empty and new menu section empty while maintaining list order', async () => {
      const MENU_ID = 275;
      const req_menu_sections = {
        menuID: MENU_ID,
        menuSections: [
          {
            name: 'INTEGRATION TEST2 menu section list order A',
            message: 'test message X',
          },
          {
            name: 'INTEGRATION TEST2 menu section list order B',
          },
        ],
      };

      // menu section A and menu section B
      mockVerify();
      const res = await request(app.getServer())
        .post('/menuSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req_menu_sections)
        .expect(200);
      const INSERTED_MENU_SECTION_ID = [];
      INSERTED_MENU_SECTION_ID[0] = res.body.menuSections[0].menuSectionID; // save menu section id of test insertion to use in test delete
      INSERTED_MENU_SECTION_ID[1] = res.body.menuSections[1].menuSectionID; // save menu section id of test insertion to use in test delete

      const req_menu_item0 = {
        name: 'MENU ITEM TEST LIST ORDER 0',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: INSERTED_MENU_SECTION_ID[0],
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
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      // insert menu items 1, 2, and 3 (we will only move menu item 1)
      const res0 = await request(app.getServer())
        .post('/menuItem')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req_menu_item0)
        .expect(200);
      const INSERTED_MENU_ITEM_ID_0 = res0.body.menuItemID;

      const edit_req_menu_item0 = {
        name: 'MENU ITEM TEST LIST ORDER 1',
        description: 'DESCRIPTION',
        category: 'food',
        menuItemID: INSERTED_MENU_ITEM_ID_0,
        menuSectionID: INSERTED_MENU_SECTION_ID[1],
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

      // move only remaining menu item from sectionA (soon to be empty) to sectionB (empty)
      await request(app.getServer()).put('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(edit_req_menu_item0).expect(200);

      // check old menu section list order update (queries order ascending via list order)
      const oldMenuItems = await mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID(INSERTED_MENU_SECTION_ID[0]);
      const oldExpectedListOrder = [];
      const oldActualListOrder = [];
      oldMenuItems
        .sort((itemA, itemB) => itemA.list_order - itemB.list_order) // must sort due to query not returning via ascending list order
        .map((item, index) => {
          oldActualListOrder.push(item.list_order);
          oldExpectedListOrder.push(index);
        });

      // check new menu section has correct list order 0...n index
      const newMenuItems = await mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID(INSERTED_MENU_SECTION_ID[1]);
      const newExpectedListOrder = [];
      const newActualListOrder = [];
      newMenuItems
        .sort((itemA, itemB) => itemA.list_order - itemB.list_order)
        .map((item, index) => {
          newActualListOrder.push(item.list_order);
          newExpectedListOrder.push(index);
        });

      // get edited menu item with new list order value
      const editedMenuItemEntity = await mockMenuItemModel.getMenuItemEntityByID(INSERTED_MENU_ITEM_ID_0);

      // cleanup, move menu item back to original menu section....menuSectionB (empty after move) to menuSectionA (full)
      edit_req_menu_item0.menuSectionID = INSERTED_MENU_SECTION_ID[0];
      mockVerify();
      await request(app.getServer()).put('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(edit_req_menu_item0).expect(200);

      // do list order test expect .toEqual() checks after endpoints are called and test is cleaned up (moving menu item back)....

      // check old menu sections list order [0, 1, 2, 3, 4....]
      expect(oldActualListOrder).toEqual(oldExpectedListOrder);

      // check new menu sections list order [0, 1, 2, 3, 4....]
      expect(newActualListOrder).toEqual(newExpectedListOrder);

      // check if list order last value n is equal to edited menu item
      expect(editedMenuItemEntity.list_order).toEqual(newExpectedListOrder.length - 1);

      // check new menu section list order update after moving menu item back to original
      const tempMovedMenuItems = await mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID(INSERTED_MENU_SECTION_ID[1]);
      const tempMovedExpectedListOrder = [];
      const tempMovedActualListOrder = [];
      tempMovedMenuItems
        .sort((itemA, itemB) => itemA.list_order - itemB.list_order)
        .map((item, index) => {
          tempMovedActualListOrder.push(item.list_order);
          tempMovedExpectedListOrder.push(index);
        });

      // check original menu section has correct list order 0...n index
      const originalMenuItems = await mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID(INSERTED_MENU_SECTION_ID[0]);
      const originalExpectedListOrder = [];
      const originalActualListOrder = [];
      originalMenuItems
        .sort((itemA, itemB) => itemA.list_order - itemB.list_order)
        .map((item, index) => {
          originalActualListOrder.push(item.list_order);
          originalExpectedListOrder.push(index);
        });

      // get edited menu item now moved back to original for latest list order value
      const originalEditedMenuItemEntity = await mockMenuItemModel.getMenuItemEntityByID(INSERTED_MENU_ITEM_ID_0);

      // check temporarily moved to menu sections list order [0, 1, 2, 3, 4....]
      expect(tempMovedActualListOrder).toEqual(tempMovedExpectedListOrder);

      // check original menu sections list order [0, 1, 2, 3, 4....]
      expect(originalActualListOrder).toEqual(originalExpectedListOrder);

      // check if list order last value n is equal to edited menu item
      expect(originalEditedMenuItemEntity.list_order).toEqual(originalExpectedListOrder.length - 1);

      // cleanup, remove both menu sections and menu items
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
  describe('PUT /menuItem/pair', () => {
    let INSERTED_DRINK_ITEM_ID;
    it('should successfully create menu item pairing', async () => {
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
      const res = await request(app.getServer())
        .post('/drinkItem')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createDrinkItemRequest)
        .expect(200);
      INSERTED_DRINK_ITEM_ID = res.body.menuItemID;
      const req = {
        menuItemID: INSERTED_MENU_ITEM_ID,
        pairingItemIDs: [INSERTED_DRINK_ITEM_ID],
      };
      mockVerify();
      await request(app.getServer()).put('/menuItem/pair').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should successfully delete menu item pairings for menu item', async () => {
      mockVerify();
      const req = {
        menuItemID: INSERTED_MENU_ITEM_ID,
        pairingItemIDs: [],
      };
      await request(app.getServer()).put('/menuItem/pair').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should throw 400 Bad Request when trying to pair drink item to another drink item', async () => {
      mockVerify();
      const req = {
        menuItemID: INSERTED_DRINK_ITEM_ID,
        pairingItemIDs: [INSERTED_DRINK_ITEM_ID],
      };
      await request(app.getServer()).put('/menuItem/pair').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should throw 400 Bad Request when drink item does not exist in database while pairing menu item to drink item', async () => {
      mockVerify();
      const req = {
        menuItemID: INSERTED_MENU_ITEM_ID,
        pairingItemIDs: [INSERTED_DRINK_ITEM_ID],
      };
      mockVerify();
      await request(app.getServer())
        .delete(`/drinkItem/${INSERTED_DRINK_ITEM_ID}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
      mockVerify();
      await request(app.getServer()).put('/menuItem/pair').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should throw 400 Bad Request when drink item ids provided are duplicates', async () => {
      mockVerify();
      const req = {
        menuItemID: INSERTED_MENU_ITEM_ID,
        pairingItemIDs: [1000, 1000],
      };
      await request(app.getServer()).put('/menuItem/pair').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
  });
  describe('PUT /menuItem/modifierGroups', () => {
    it('should successfully link modifier groups to menu item', async () => {
      const createModifierReq: CreateModifierRequestInterface = {
        name: 'Test_MODIFIER',
        price: 100,
        description: 'Blah',
      };
      mockVerify();
      const mRes = await request(app.getServer())
        .post('/modifier')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createModifierReq)
        .expect(200);
      const modifierID = mRes.body.modifierID;

      const createModifierGroup = {
        name: 'TEST_NAME',
        label: 'TEST_LABEL',
        modifierIDs: [modifierID],
      };
      mockVerify();
      const mGRes = await request(app.getServer())
        .post('/modifierGroup')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(createModifierGroup)
        .expect(200);

      const modifierGroupID = mGRes.body.modifierGroupID;

      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuItemID: INSERTED_MENU_ITEM_ID,
        modifierGroupIDs: [modifierGroupID],
      };
      await request(app.getServer()).put('/menuItem/modifierGroups').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);

      await removeModifierGroupAndModifier(modifierGroupID, modifierID);
    });
    it('should throw 404 Not Found when modifier group does not exist while linking menu item to modifier groups', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuItemID: INSERTED_MENU_ITEM_ID,
        modifierGroupIDs: [0],
      };
      await request(app.getServer()).put('/menuItem/modifierGroups').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(404);
    });
  });
  describe('PUT /menuItem/restrictions', () => {
    it('should successfully create menu item - restriction link', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuItemID: INSERTED_MENU_ITEM_ID,
        dietaryRestrictionIDs: [6, 4],
      };
      await request(app.getServer()).put('/menuItem/restrictions').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should throw 400 Bad Request when dietary restriction does not exist in database while linking menu item to restrictions', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuItemID: INSERTED_MENU_ITEM_ID,
        dietaryRestrictionIDs: [0],
      };
      await request(app.getServer()).put('/menuItem/restrictions').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
  });
  describe('DELETE /menuItem', () => {
    it('should delete menu item', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      await request(app.getServer()).delete(`/menuItem/${INSERTED_MENU_ITEM_ID}`).set('Authorization', 'token').set('restaurantID', '1').expect(200);
    });
  });
  describe('PATCH /menuItem/reorder', () => {
    const MENU_ID = 275;
    const req_menu_section = {
      menuID: MENU_ID,
      menuSections: [
        {
          name: 'INTEGRATION TEST REORDERING section 1',
          message: 'test message X',
        },
        {
          name: 'INTEGRATION TEST REORDERING section 2',
        },
      ],
    };
    it('should reorder menu items list order', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      const res = await request(app.getServer())
        .post('/menuSections')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send(req_menu_section)
        .expect(200);

      INSERTED_MENU_SECTION_ID = res.body.menuSections[0].menuSectionID; // save menu id of test insertion to use in test delete

      const req_1 = {
        name: 'MENU ITEM TEST 1',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: INSERTED_MENU_SECTION_ID,
        baseItemSize: {
          label: 'default',
          price: 100,
        },
        allItemSizes: [
          {
            label: 'small',
            price: 199,
            priceOverride: 'Market Price',
          },
          {
            label: 'default',
            price: 100,
          },
        ],
      };
      const req_2 = {
        name: 'MENU ITEM TEST 2',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: INSERTED_MENU_SECTION_ID,
        baseItemSize: {
          label: 'default_reorder_1',
          price: 499,
        },
        allItemSizes: [
          {
            label: 'small_reorder',
            price: 599,
            priceOverride: 'Market Price',
          },
          {
            label: 'default_reorder_1',
            price: 499,
          },
        ],
      };
      const req_3 = {
        name: 'MENU ITEM TEST 3',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: INSERTED_MENU_SECTION_ID,
        baseItemSize: {
          label: 'default_reorder_2',
          price: 699,
        },
        allItemSizes: [
          {
            label: 'small_reorder',
            price: 799,
            priceOverride: 'Market Price',
          },
          {
            label: 'default_reorder_2',
            price: 699,
          },
        ],
      };
      const res1 = await request(app.getServer()).post('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req_1).expect(200);
      const res2 = await request(app.getServer()).post('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req_2).expect(200);
      const res3 = await request(app.getServer()).post('/menuItem').set('Authorization', 'token').set('restaurantID', '1').send(req_3).expect(200);

      const MENU_ITEM_ID_1 = res1.body.menuItemID;
      const MENU_ITEM_ID_2 = res2.body.menuItemID;
      const MENU_ITEM_ID_3 = res3.body.menuItemID;

      const reorder_req = {
        menuSectionID: INSERTED_MENU_SECTION_ID,
        menuItemsOrder: [MENU_ITEM_ID_2, MENU_ITEM_ID_1, MENU_ITEM_ID_3],
      };

      await request(app.getServer()).patch('/menuItem/reorder').set('Authorization', 'token').set('restaurantID', '1').send(reorder_req).expect(200);
    });
    it('should return 400 bad request due to not including all menu items of a menu section', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuSectionID: 88,
        menuItemsOrder: [449, 447, 445, 448, 450],
      };
      await request(app.getServer()).patch('/menuItem/reorder').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should return 400 bad request due to having extra non existent menu items of a menu section in request', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuSectionID: 88,
        menuItemsOrder: [449, 447, 446, 445, 448, 450, 451],
      };
      await request(app.getServer()).patch('/menuItem/reorder').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should return 400 bad request due to having duplicate menu items of a menu section in request', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuSectionID: 88,
        menuItemsOrder: [449, 447, 447, 446, 445, 448, 450],
      };
      await request(app.getServer()).patch('/menuItem/reorder').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
    it('should return 400 bad request due to having menu items in request that dont exist in menu section', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuSectionID: 88,
        menuItemsOrder: [449, 447, 451, 445, 448, 450],
      };
      await request(app.getServer()).patch('/menuItem/reorder').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);

      // cleanup
      await request(app.getServer())
        .delete(`/menuSections/${INSERTED_MENU_SECTION_ID}`)
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .expect(200);
    });
  });
  describe('PUT /menuItem/hide', () => {
    it('should successfully hide menu item', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuItemID: 345,
        hide: true,
      };
      await request(app.getServer()).put('/menuItem/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should successfully un-hide menu item', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuItemID: 345,
        hide: false,
      };
      await request(app.getServer()).put('/menuItem/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should throw 401 HttpException error if menu item id doesnt exist', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuItemID: 9999999,
        hide: false,
      };
      await request(app.getServer()).put('/menuItem/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(401);
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
        menuItemID: 345,
      };
      await request(app.getServer()).put('/menuItem/hide').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
  });
  describe('PUT /menuItem/tags', () => {
    it('should successfully create menu item - tags link', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuItemID: 345,
        tagIDs: [1],
      };
      await request(app.getServer()).put('/menuItem/tag').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should successfully remove menu item - tags link', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuItemID: 345,
        tagIDs: [],
      };
      await request(app.getServer()).put('/menuItem/tag').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should throw 400 Bad Request when tags does not exist in database while linking menu item to a tag', async () => {
      mockVerify();
      const decoded = {
        managerID: 1,
      };
      (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
        callback(null, decoded);
      });
      (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValueOnce(true);
      const req = {
        menuItemID: 345,
        tagIDs: [9999],
      };
      await request(app.getServer()).put('/menuItem/tag').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(400);
    });
  });
  describe('POST /menuItems/media', () => {
    it('should successfully link menu item to media with image', async () => {
      mockVerify();
      const req = {
        menuItemID: 345,
        mediaIDs: [3],
        thumbnails: [],
      };
      await request(app.getServer()).post('/menuItems/media').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should successfully link menu item to media with video and thumbnail', async () => {
      mockVerify();
      const req = {
        menuItemID: 345,
        mediaIDs: [95],
        thumbnails: [
          {
            videoID: 95,
            thumbnailID: 3,
          },
        ],
      };
      await request(app.getServer()).post('/menuItems/media').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
    });
    it('should remove media for menu item with empty array', async () => {
      mockVerify();
      const req = {
        menuItemID: 345,
        mediaIDs: [],
        thumbnails: [],
      };
      await request(app.getServer()).post('/menuItems/media').set('Authorization', 'token').set('restaurantID', '1').send(req).expect(200);
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

const removeModifierGroupAndModifier = async (modifierGroupID: number, modifierID: number): Promise<void> => {
  const repository = await ormConnection();
  await repository.delete(ModifierGroupToMenuItemLinkEntity, { modifierGroupID });
  await repository.delete(ModifierToModifierGroupLinkEntity, { modifierGroupID });
  await repository.delete(ModifierGroupEntity, modifierGroupID);
  await repository.delete(ModifierEntity, modifierID);
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
