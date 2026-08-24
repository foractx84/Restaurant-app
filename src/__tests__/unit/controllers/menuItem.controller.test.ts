import MenuItemService from '@services/menuItem.service';
import { CreateMenuItemResponse, MenuItemModelInterface } from '@interfaces/menuItem.interface';
import { AggregateServiceInterface } from '@interfaces/aggregate.interface';
import { ItemSizeServiceInterface } from '@interfaces/itemSize.interface';
import MenuItemController from '@controllers/menuItem.controller';
import { DietaryRestrictionsServiceInterface } from '@interfaces/dietaryRestrictions.interface';
import { NextFunction, Request, Response } from 'express-serve-static-core';
import { deleteMediaIfExists } from '@utils/imageUtils';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import { TagsServiceInterface } from '@interfaces/tags.interface';
import { DrinkItemServiceInterface } from '@interfaces/drinkItem.interface';
import { MenuItemMediaServiceInterface } from '@interfaces/menuItemMedia.interface';

jest.mock('@/utils/imageUtils', () => {
  return { __esModule: true, deleteMediaIfExists: jest.fn() };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/services/menuItem.service', () => {
  const mockMenuItemService = {
    createMenuItem: jest.fn(),
    editMenuItem: jest.fn(),
    hideMenuItem: jest.fn(),
    linkDrinkItemsToMenuItem: jest.fn(),
    linkMediaToMenuItem: jest.fn(),
    linkModifierGroupsToMenuItem: jest.fn(),
    linkRestrictionsToMenuItem: jest.fn(),
    linkTagToMenuItem: jest.fn(),
    reorderMenuItems: jest.fn(),
    softDeleteMenuItemByID: jest.fn(),
    uploadMenuItemMedia: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuItemService) };
});

// mock menus service object
const mockMenuItemService = new MenuItemService(
  {} as AggregateServiceInterface,
  {} as DietaryRestrictionsServiceInterface,
  {} as DrinkItemServiceInterface,
  {} as ItemSizeServiceInterface,
  {} as MenuItemModelInterface,
  {} as RestaurantsServiceInterface,
  {} as TagsServiceInterface,
  {} as MenuItemMediaServiceInterface,
);

// create test controller object
const menuItemController = new MenuItemController(mockMenuItemService);

describe('menuItemController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('createMenuItem', () => {
    it('should successfully create menu item', async () => {
      const createMenuItem: CreateMenuItemResponse = {
        menuItemID: 1011,
        menuItemUrlID: '4c80b35c-20ee-4f2b-94cd-76af43b76a47',
        name: 'TEST 12',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: 88,
        baseItemSize: {
          id: 26,
          price: 199,
          label: 'Small',
          priceOverride: '',
        },
        allItemSizes: [
          {
            id: 26,
            price: 199,
            label: 'Small',
            priceOverride: '',
          },
        ],
        createdAt: '2022-05-09T23:55:25.093Z',
        calories: 100,
      };
      // set up mock menus service to return our mock response to controller
      (mockMenuItemService.createMenuItem as jest.MockedFunction<any>).mockResolvedValueOnce(createMenuItem);

      // mock a request needed by controller
      const mReq = {
        body: {
          name: 'TEST 12',
          description: 'DESCRIPTION',
          category: 'food',
          menuSectionID: 88,
          baseItemSize: {
            label: 'Small',
            price: 199,
          },
          allItemSizes: [
            {
              label: 'Small',
              price: 199,
            },
          ],
          calories: 100,
        },
      };

      // mock a response object for controller to return into
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
      };

      // call on controller as the router would
      await menuItemController.createMenuItem(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuItemService.createMenuItem).toHaveBeenCalledTimes(1);
      expect(responseObject).toEqual(createMenuItem);
    });
    it('should not create menu item because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuItemController.createMenuItem(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenuItemService.createMenuItem).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('deleteMenuItem', () => {
    it('should successfully delete menu item', async () => {
      // mock a request needed by controller
      const mReq = {
        params: {
          menuItemID: 1000,
        },
      } as unknown;

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      // call on controller as the router would
      await menuItemController.deleteMenuItem(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuItemService.softDeleteMenuItemByID).toHaveBeenCalledTimes(1);
    });
    it('should not delete menu item because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuItemController.deleteMenuItem(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenuItemService.softDeleteMenuItemByID).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('editMenuItem', () => {
    it('should successfully edit menu item', async () => {
      // mock a request needed by controller
      const mReq = {
        body: {
          name: 'TEST 12',
          description: 'DESCRIPTION',
          category: 'food',
          menuItemID: 88,
          baseItemSize: {
            label: 'Small',
            price: 199,
          },
          allItemSizes: [
            {
              label: 'Small',
              price: 199,
            },
          ],
          calories: 100,
        },
      };

      const mRes: Partial<Response> = {
        json: jest.fn(),
      };

      // call on controller as the router would
      await menuItemController.editMenuItem(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuItemService.editMenuItem).toHaveBeenCalledTimes(1);
    });
    it('should not edit menu item because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuItemController.editMenuItem(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenuItemService.editMenuItem).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('linkDrinkItemsToMenuItem', () => {
    it('should successfully link menu item - drink items', async () => {
      // mock a request needed by controller
      const mReq = {
        body: {
          menuItemID: 1000,
          pairingItemIDs: [1000, 1001],
        },
      } as unknown;

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      // call on controller as the router would
      await menuItemController.linkDrinkItemsToMenuItem(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuItemService.linkDrinkItemsToMenuItem).toHaveBeenCalledWith(1000, [1000, 1001], 1);
    });
    it('should not link menu item - drink items because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuItemController.linkDrinkItemsToMenuItem(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenuItemService.linkDrinkItemsToMenuItem).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('linkModifierGroupsToMenuItem', () => {
    it('should successfully link modifier groups to menu item', async () => {
      // mock a request needed by controller
      const mReq = {
        body: {
          menuItemID: 1000,
          modifierGroupIDs: [6],
        },
      } as unknown;

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      // call on controller as the router would
      await menuItemController.linkModifierGroupsToMenuItem(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuItemService.linkModifierGroupsToMenuItem).toHaveBeenCalledWith(1000, [6], 1);
    });
    it('should not link modifier groups to menu item because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuItemController.linkModifierGroupsToMenuItem(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenuItemService.linkModifierGroupsToMenuItem).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('linkRestrictionsToMenuItem', () => {
    it('should successfully create menu item - restrictions', async () => {
      // mock a request needed by controller
      const mReq = {
        body: {
          menuItemID: 1000,
          dietaryRestrictionIDs: [6],
        },
      } as unknown;

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      // call on controller as the router would
      await menuItemController.linkRestrictionsToMenuItem(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuItemService.linkRestrictionsToMenuItem).toHaveBeenCalledWith(1000, [6]);
    });
    it('should not create menu item - restrictions because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuItemController.linkRestrictionsToMenuItem(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenuItemService.linkRestrictionsToMenuItem).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('reorderMenuItems', () => {
    it('should successfully reorder menu items', async () => {
      const mReq: Partial<Request> = {
        body: {
          menuSectionID: '275',
          menuItemsOrder: [3, 1, 2],
        },
      };
      (mockMenuItemService.reorderMenuItems as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      let status = 0;
      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        sendStatus: jest.fn().mockImplementation(s => (status = s)),
        locals: { restaurantID: 1 },
      };

      const mNext = jest.fn();

      await menuItemController.reorderMenuItems(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMenuItemService.reorderMenuItems).toHaveBeenCalledTimes(1);
      expect(status).toEqual(200);
    });
    it('should not reorder menu items because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuItemController.reorderMenuItems(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenuItemService.reorderMenuItems).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('hideMenuItem', () => {
    it('should successfully hide menu item', async () => {
      const mReq: Partial<Request> = {
        body: {
          menuItemID: 345,
          hide: true,
        },
      };
      (mockMenuItemService.hideMenuItem as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      let status = 0;
      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        sendStatus: jest.fn().mockImplementation(s => (status = s)),
        locals: { restaurantID: 1 },
      };

      const mNext = jest.fn();

      await menuItemController.hideMenuItem(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMenuItemService.hideMenuItem).toHaveBeenCalledTimes(1);
      expect(status).toEqual(200);
    });
    it('should not hide menu items because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuItemController.hideMenuItem(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenuItemService.hideMenuItem).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('linkTagToMenuItem', () => {
    const RESTAURANT_ID = 1;
    it('should successfully create menu item - tags', async () => {
      // mock a request needed by controller
      const mReq = {
        body: {
          menuItemID: 1000,
          tagIDs: [1],
        },
      } as unknown;

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1 },
      };

      // call on controller as the router would
      await menuItemController.linkTagToMenuItem(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuItemService.linkTagToMenuItem).toHaveBeenCalledWith(1000, [1], RESTAURANT_ID);
    });
    it('should not create menu item - tags because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuItemController.linkTagToMenuItem(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenuItemService.linkTagToMenuItem).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('uploadMenuItemMedia', () => {
    const IMAGE0 = 'df94-34ds-23f3-dfsr.jpeg';
    const IMAGE1 = 'df94-34ds-23f3-dfsr2.jpeg';
    const MENU_ITEM_ID = 357;
    // mock a request needed by controller
    it('should successfully upload multiple menu item images', async () => {
      const mReq = {
        body: {
          mediaToRemove: '[]',
          mediaOrder: '[]',
          menuItemID: MENU_ITEM_ID,
        },
        files: {
          images: [{ filename: IMAGE0 }, { filename: IMAGE1 }],
        },
      } as unknown;
      const imageUploadResponse = {
        images: [
          {
            imageURL: IMAGE0,
            imageID: 76,
          },
          {
            imageURL: IMAGE1,
            imageID: 76,
          },
        ],
      };

      (mockMenuItemService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(imageUploadResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
      };

      await menuItemController.uploadMenuItemMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuItemService.uploadMenuItemMedia).toHaveBeenCalledWith([IMAGE0, IMAGE1], MENU_ITEM_ID, [], [], '', '');
      expect(deleteMediaIfExists).not.toHaveBeenCalled();
      expect(responseObject).toEqual(imageUploadResponse);
    });
    it('should successfully upload single menu item image', async () => {
      const mReq = {
        body: {
          mediaToRemove: '[]',
          mediaOrder: '[]',
          menuItemID: MENU_ITEM_ID,
        },
        files: {
          images: [{ filename: IMAGE0 }],
        },
      } as unknown;
      const imageUploadResponse = {
        images: [
          {
            imageURL: IMAGE0,
            imageID: 76,
          },
        ],
      };

      (mockMenuItemService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(imageUploadResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
      };

      await menuItemController.uploadMenuItemMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuItemService.uploadMenuItemMedia).toHaveBeenCalledWith([IMAGE0], MENU_ITEM_ID, [], [], '', '');
      expect(deleteMediaIfExists).not.toHaveBeenCalled();
      expect(responseObject).toEqual(imageUploadResponse);
    });
    it('should successfully delete menu item images when ids are provided in request and image is uploaded (response is not empty)', async () => {
      const mReq = {
        body: {
          mediaToRemove: '[1,2]',
          menuItemID: MENU_ITEM_ID,
        },
        files: {
          images: [{ filename: IMAGE0 }],
        },
      } as unknown;
      const imageUploadResponse = {
        images: [
          {
            imageURL: IMAGE0,
            imageID: 76,
          },
        ],
      };

      const mediaToRemove = [1, 2] as number[];

      (mockMenuItemService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(imageUploadResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
      };

      await menuItemController.uploadMenuItemMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuItemService.uploadMenuItemMedia).toHaveBeenCalledWith([IMAGE0], MENU_ITEM_ID, [], mediaToRemove, '', '');
      expect(deleteMediaIfExists).not.toHaveBeenCalled();
      expect(responseObject).toEqual(imageUploadResponse);
    });
    it('should successfully delete menu item images when ids are provided in request and empty response returned', async () => {
      const mReq = {
        body: {
          mediaToRemove: '[1,2]',
          menuItemID: MENU_ITEM_ID,
        },
        files: {
          images: [],
        },
      } as unknown;
      const imageUploadResponse = null;

      const mediaToRemove = [1, 2] as number[];

      (mockMenuItemService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(imageUploadResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
      };

      await menuItemController.uploadMenuItemMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuItemService.uploadMenuItemMedia).toHaveBeenCalledWith([], MENU_ITEM_ID, [], mediaToRemove, '', '');
      expect(deleteMediaIfExists).not.toHaveBeenCalled();
      expect(responseObject).toEqual({});
    });
    it('should successfully reorder menu item images when ids are provided in request with just ids', async () => {
      const mReq = {
        body: {
          mediaOrder: '["1","2"]',
          menuItemID: MENU_ITEM_ID,
        },
        files: {
          images: [],
        },
      } as unknown;
      const imageUploadResponse = null;

      const mediaOrder = ['1', '2'] as string[];

      (mockMenuItemService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(imageUploadResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
      };

      await menuItemController.uploadMenuItemMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuItemService.uploadMenuItemMedia).toHaveBeenCalledWith([], MENU_ITEM_ID, mediaOrder, [], '', '');
      expect(deleteMediaIfExists).not.toHaveBeenCalled();
      expect(responseObject).toEqual({});
    });
    it('should successfully reorder menu item images when ids and filename-N are provided in request with just ids', async () => {
      const mReq = {
        body: {
          mediaOrder: '["1","filename-0"]',
          menuItemID: MENU_ITEM_ID,
        },
        files: {
          images: [],
        },
      } as unknown;
      const imageUploadResponse = null;

      const mediaOrder = ['1', 'filename-0'] as string[];

      (mockMenuItemService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(imageUploadResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
      };

      await menuItemController.uploadMenuItemMedia(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuItemService.uploadMenuItemMedia).toHaveBeenCalledWith([], MENU_ITEM_ID, mediaOrder, [], '', '');
      expect(deleteMediaIfExists).not.toHaveBeenCalled();
      expect(responseObject).toEqual({});
    });
    it('should throw 400 Bad Request if imagesToDelete is not an array of numbers', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
      };
      const mNext = jest.fn();
      const mReq = {
        body: {
          mediaToRemove: '[test]',
          menuItemID: MENU_ITEM_ID,
        },
        files: {
          images: [],
        },
      } as unknown;

      await menuItemController.uploadMenuItemMedia(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMenuItemService.uploadMenuItemMedia).not.toHaveBeenCalled();
      expect(deleteMediaIfExists).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
    it('should throw 400 Bad Request if imagesToDelete is not an array of numbers and image is included in upload', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
      };
      const mNext = jest.fn();
      const mReq = {
        body: {
          mediaToRemove: '["test"]',
        },
        files: {
          images: [{ filename: IMAGE0 }],
        },
      } as unknown;

      await menuItemController.uploadMenuItemMedia(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMenuItemService.uploadMenuItemMedia).not.toHaveBeenCalled();
      //expect(deleteImageIfExists).toHaveBeenCalledWith(IMAGE0);
      expect(mNext).toHaveBeenCalled();
    });
    it('should throw 400 Bad Request if imagesOrder contains empty string element', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { menu_item_id: MENU_ITEM_ID },
      };
      const mNext = jest.fn();
      const mReq = {
        body: {
          mediaOrder: '[""]',
        },
        files: {},
      } as unknown;

      await menuItemController.uploadMenuItemMedia(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMenuItemService.uploadMenuItemMedia).not.toHaveBeenCalled();
      expect(deleteMediaIfExists).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
    it('should throw 400 Bad Request if imagesOrder contains a string that doesnt start with "filename-" and is not a number', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
      };
      const mNext = jest.fn();
      const mReq = {
        body: {
          mediaOrder: '["1", "test"]',
          menu_item_id: MENU_ITEM_ID,
        },
        files: {},
      } as unknown;

      await menuItemController.uploadMenuItemMedia(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMenuItemService.uploadMenuItemMedia).not.toHaveBeenCalled();
      expect(deleteMediaIfExists).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
    it('should throw 400 Bad Request if imagesOrder contains a string that starts with "filename-" but doesnt have numercial value afterwards (filename-test)', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
      };
      const mNext = jest.fn();
      const mReq = {
        body: {
          mediaOrder: '["filename-test"]',
          menu_item_id: MENU_ITEM_ID,
        },
        files: {},
      } as unknown;

      await menuItemController.uploadMenuItemMedia(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMenuItemService.uploadMenuItemMedia).not.toHaveBeenCalled();
      expect(deleteMediaIfExists).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
    it('should delete images for menu item if an exception occurs when uploading both images', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
      };
      const mNext = jest.fn();
      const mReq = {
        body: {
          mediaToRemove: '[]',
          mediaOrder: '[]',
          menu_item_id: MENU_ITEM_ID,
        },
        files: {
          images: [{ filename: IMAGE0 }, { filename: IMAGE1 }],
        },
      } as unknown;

      (mockMenuItemService.uploadMenuItemMedia as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      await menuItemController.uploadMenuItemMedia(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockMenuItemService.uploadMenuItemMedia).toHaveBeenCalledTimes(1);
      expect(deleteMediaIfExists).toHaveBeenCalledWith([IMAGE0, IMAGE1], '');
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('linkMediaToMenuItem', () => {
    it('should successfully link media to menu item', async () => {
      // mock a request needed by controller
      const mReq: Partial<Request> = {
        body: {
          menuItemID: 1000,
          mediaIDs: [2, 3],
          thumbnails: [
            {
              thumbnailID: 1,
              videoID: 2,
            },
          ],
        },
      } as unknown;

      // mock a response object for controller to return into
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: 1, media: [{ media_id: 123 }] },
      };

      // call on controller as the router would
      await menuItemController.linkMediaToMenuItem(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockMenuItemService.linkMediaToMenuItem).toHaveBeenCalledTimes(1);
    });
    it('should not link media to menu item because invalid request', async () => {
      const mReq = undefined; // request to force controller to throw error
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await menuItemController.linkMediaToMenuItem(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockMenuItemService.linkMediaToMenuItem).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
});
