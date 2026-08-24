import { AggregateModelInterface } from '@interfaces/aggregate.interface';
import { ItemSizeResponse, ItemSizeTypeModelInterface } from '@interfaces/itemSize.interface';
import AggregateService from '@services/aggregate.service';
import ItemSizeService from '@/services/itemSize.service';
import MenuItemModel from '@/models/menuItem.model';
import MenuItemService from '@services/menuItem.service';
import {
  CreateMenuItemRequestInterface,
  CreateMenuItemResponse,
  EditMenuItemRequestInterface,
  MenuItemDBInterface,
} from '@interfaces/menuItem.interface';
import RestaurantsService from '@services/restaurants.service';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import DietaryRestrictionsService from '@services/dietaryRestrictions.service';
import { DietaryRestrictionsModelInterface } from '@interfaces/dietaryRestrictions.interface';
import { MenuItemEntity } from '@/entities/menuItem.entity';
import { ormConnection } from '@utils/dbUtils';
import TagsService from '@/services/tags.service';
import { TagsModelInterface } from '@/interfaces/tags.interface';
import DrinkItemService from '@services/drinkItem.service';
import { DrinkItemModelInterface, GetDrinkItemsInterface } from '@interfaces/drinkItem.interface';
import { RestaurantImagesServiceInterface } from '@interfaces/restaurantImages.interface';
import { RestaurantsModelInterface } from '@/interfaces/restaurants.interface';
import { CuisinesServiceInterface } from '@/interfaces/cuisines.interface';
import { CountryServiceInterface } from '@/interfaces/country.interface';
import { RestaurantAddressServiceInterface } from '@/interfaces/restaurantAddress.interface';
import { ManagerRestaurantServiceInterface } from '@/interfaces/managerRestaurant.interface';
import MenuItemMediaService from '@/services/menuItemMedia.service';
import { LinkMenuItemAndMediaInterface, MenuItemMediaModelInterface } from '@/interfaces/menuItemMedia.interface';
import { MenuItemVideoThumbnailsServiceInterface } from '@/interfaces/menuItemVideoThumbnail.interface';
import { RestaurantSocialsServiceInterface } from '@/interfaces/restaurantSocials.interface';
import { RestaurantHoursServiceInterface } from '@/interfaces/restaurantHours.interface';
import { RestaurantProfileAlbumsServiceInterface } from '@/interfaces/restaurantProfileAlbums.interface';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { GetMenuDetailsModifierGroupsResponseInterface } from '@/interfaces/modifierGroup.interface';
import { GetMenuDetailsModifiersResponseInterface } from '@/interfaces/modifier.interface';
import { MediaType } from '@/enums/mediaType';
import { MediaEntity } from '@entities/media.entity';
import { MenuItemMediaEntity } from '@entities/menuItemMedia.entity';
import { IMAGE_TYPE_ID } from '@constants/media.constants';
import { StripeConnectServiceInterface } from '@/services/stripeConnect.service';

const IMAGE_HOSTING_URL = 'www.test.com/';

jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/configs/config', () => {
  const MOCKED_APP_CONFIG = {
    SERVER: 'localhost',
    IMAGE_BUCKET: 'dummy',
    IMAGE_HOSTING_URL: 'www.test.com',
  };

  const MOCK_MENU_ITEM_IMAGES = {
    MAX_MENU_ITEM_IMAGES_VALUE: 3,
    MAX_MENU_ITEM_VIDEOS_VALUE: 1,
  };

  return {
    __esModule: true,
    APP_CONFIG: MOCKED_APP_CONFIG,
    MENU_ITEM_MEDIA: MOCK_MENU_ITEM_IMAGES,
    default: MOCKED_APP_CONFIG,
  };
});
jest.mock('@/utils/imageUtils', () => {
  const originalModule = jest.requireActual('@/utils/imageUtils');
  return { __esModule: true, ...originalModule, deleteImageIfExists: jest.fn() };
});
jest.mock('@/services/aggregate.service', () => {
  const mockAggregateService = {
    createMenuItemDietaryRestrictions: jest.fn(),
    deleteMenuItemSizesByMenuItemID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAggregateService) };
});
jest.mock('@/services/dietaryRestrictions.service', () => {
  const mockDietaryRestrictionsService = {
    validateDietaryRestrictions: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDietaryRestrictionsService) };
});
jest.mock('@/services/drinkItem.service', () => {
  const mockDrinkItemService = {
    validatePairings: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDrinkItemService) };
});
jest.mock('@/services/itemSize.service', () => {
  const mockItemSizeService = {
    createItemSizeType: jest.fn(),
    createAllItemSizesForMenuItem: jest.fn(),
    getBaseItemSizeFromAllItemSizes: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockItemSizeService) };
});
jest.mock('@/services/restaurants.service', () => {
  const mockRestaurantService = {
    findRestaurantEntityByID: jest.fn(),
    findRestaurantEntityWithModifiersByID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantService) };
});
jest.mock('@/models/menuItem.model', () => {
  const mockMenuItemModel = {
    deleteMenuItemByID: jest.fn(),
    getLargestListOrderInMenuSection: jest.fn(),
    getMenuItemEntityByID: jest.fn(),
    getMenuItemEntityWithMediaByID: jest.fn(),
    getMenuItemsByMenuSection: jest.fn(),
    getMenuItemsEntitiesByMenuSectionID: jest.fn(),
    getMenuItemsOfMenuSectionByMenuItemID: jest.fn(),
    hideMenuItem: jest.fn(),
    insertMenuItem: jest.fn(),
    softDeleteMenuItemByID: jest.fn(),
    updateMenuItem: jest.fn(),
    patchMenuItem: jest.fn(),
    updateMenuItemsListOrder: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuItemModel) };
});
jest.mock('@/services/tags.service', () => {
  const mockTagsService = {
    validateTagsByRestaurantID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockTagsService) };
});
jest.mock('@/services/menuItemMedia.service', () => {
  const mockMenuItemMediaService = {
    getMenuItemMediaByMenuItemID: jest.fn(),
    uploadMenuItemMedia: jest.fn(),
    validateIDsIncluded: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuItemMediaService) };
});

const mockAggregateService = new AggregateService({} as AggregateModelInterface);
const mockDietaryRestrictionsService = new DietaryRestrictionsService({} as DietaryRestrictionsModelInterface);
const mockDrinkItemService = new DrinkItemService({} as DrinkItemModelInterface);
const mockItemSizeService = new ItemSizeService(mockAggregateService, {} as ItemSizeTypeModelInterface);
const mockItemMediaService = new MenuItemMediaService({} as MenuItemMediaModelInterface, {} as MenuItemVideoThumbnailsServiceInterface);

const mockRestaurantService = new RestaurantsService(
  {} as CountryServiceInterface,
  {} as CuisinesServiceInterface,
  {} as ManagerRestaurantServiceInterface,
  {} as RestaurantAddressServiceInterface,
  {} as RestaurantImagesServiceInterface,
  {} as RestaurantsModelInterface,
  {} as RestaurantSocialsServiceInterface,
  {} as RestaurantHoursServiceInterface,
  {} as RestaurantProfileAlbumsServiceInterface,
  { createConnectedAccountForRestaurant: jest.fn(), linkExistingConnectAccount: jest.fn() } as StripeConnectServiceInterface,
);
const mockTagsService = new TagsService({} as TagsModelInterface);
const mockMenuItemModel = new MenuItemModel();

const menuItemService = new MenuItemService(
  mockAggregateService,
  mockDietaryRestrictionsService,
  mockDrinkItemService,
  mockItemSizeService,
  mockMenuItemModel,
  mockRestaurantService,
  mockTagsService,
  mockItemMediaService,
);

describe('menuItemService', () => {
  const RESTAURANT_ID = 1;
  const BASE_ITEM_SIZE_ID = 123;
  const MENU_SECTION_ID = 1;
  const MENU_ITEM_ID = 321;
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('createMenuItem', () => {
    const CREATED_BASE_ITEM_SIZE: ItemSizeResponse = {
      id: BASE_ITEM_SIZE_ID,
      label: 'default',
      price: 199,
      priceOverride: '',
    };
    const CREATED_MENU_ITEM: MenuItemDBInterface = {
      menu_item_id: MENU_ITEM_ID,
      menu_item_url_id: 'fjd-0dsf30d-fsdf',
      name: 'TEST ITEM',
      description: 'DESCRIPTION',
      image_url: null,
      category: 'food',
      menu_section_id: MENU_SECTION_ID,
      list_order: 0,
      calories: 100,
      created_at: '2022-02-02T02:44:11.950Z',
      updated_at: '2022-02-02T02:44:11.950Z',
      deleted: false,
      base_item_size_id: BASE_ITEM_SIZE_ID,
      is_hidden: false,
      is_featured: false,
    };
    it('should successfully create a single menu item', async () => {
      const mockMenuItemRequest: CreateMenuItemRequestInterface = {
        name: 'TEST ITEM',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: MENU_SECTION_ID,
        baseItemSize: {
          label: 'default',
          price: 199,
          priceOverride: '',
        },
        allItemSizes: [
          {
            label: 'default',
            price: 199,
            priceOverride: '',
          },
        ],
        calories: 100,
      };

      const expectedResponse: CreateMenuItemResponse = {
        menuItemID: MENU_ITEM_ID,
        name: mockMenuItemRequest.name,
        description: mockMenuItemRequest.description,
        category: mockMenuItemRequest.category,
        menuSectionID: MENU_SECTION_ID,
        menuItemUrlID: 'fjd-0dsf30d-fsdf',
        baseItemSize: CREATED_BASE_ITEM_SIZE,
        allItemSizes: [CREATED_BASE_ITEM_SIZE],
        createdAt: '2022-02-02T02:44:11.950Z',
        isHidden: false,
        isFeatured: false,
        calories: 100,
      };

      (mockItemSizeService.createItemSizeType as jest.MockedFunction<any>).mockResolvedValueOnce(CREATED_BASE_ITEM_SIZE);
      (mockMenuItemModel.insertMenuItem as jest.MockedFunction<any>).mockResolvedValueOnce(CREATED_MENU_ITEM);
      (mockItemSizeService.createAllItemSizesForMenuItem as jest.MockedFunction<any>).mockResolvedValueOnce([CREATED_BASE_ITEM_SIZE]);

      const result = await menuItemService.createMenuItem(mockMenuItemRequest);

      expect(mockItemSizeService.createItemSizeType).toHaveBeenCalledWith(
        mockMenuItemRequest.baseItemSize.label,
        mockMenuItemRequest.baseItemSize.price,
        mockMenuItemRequest.baseItemSize.priceOverride,
        undefined,
      );
      expect(mockMenuItemModel.insertMenuItem).toHaveBeenCalledTimes(1);
      expect(mockItemSizeService.createAllItemSizesForMenuItem).toHaveBeenCalledWith(MENU_ITEM_ID, mockMenuItemRequest.allItemSizes, undefined);

      expect(result).toEqual(expectedResponse);
    });
    it('should successfully create a single menu item with multiple item sizes of all values provided', async () => {
      const mockMenuItemRequest: CreateMenuItemRequestInterface = {
        name: 'TEST ITEM',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: MENU_SECTION_ID,
        baseItemSize: {
          label: 'default',
          price: 199,
          priceOverride: '',
        },
        allItemSizes: [
          {
            label: 'default',
            price: 199,
            priceOverride: '',
          },
          {
            label: 'large',
            price: 300,
            priceOverride: '',
          },
        ],
        calories: 100,
      };
      const CREATED_ALL_ITEM_SIZE: ItemSizeResponse = {
        id: 11,
        label: 'large',
        price: 300,
        priceOverride: '',
      };
      const expectedResponse: CreateMenuItemResponse = {
        menuItemID: MENU_ITEM_ID,
        name: mockMenuItemRequest.name,
        description: mockMenuItemRequest.description,
        category: mockMenuItemRequest.category,
        menuSectionID: MENU_SECTION_ID,
        menuItemUrlID: 'fjd-0dsf30d-fsdf',
        baseItemSize: CREATED_BASE_ITEM_SIZE,
        allItemSizes: [CREATED_BASE_ITEM_SIZE, CREATED_ALL_ITEM_SIZE],
        createdAt: '2022-02-02T02:44:11.950Z',
        isHidden: false,
        isFeatured: false,
        calories: 100,
      };

      (mockItemSizeService.createItemSizeType as jest.MockedFunction<any>).mockResolvedValueOnce(CREATED_BASE_ITEM_SIZE);
      (mockMenuItemModel.insertMenuItem as jest.MockedFunction<any>).mockResolvedValueOnce(CREATED_MENU_ITEM);
      (mockItemSizeService.createAllItemSizesForMenuItem as jest.MockedFunction<any>).mockResolvedValueOnce([
        CREATED_BASE_ITEM_SIZE,
        CREATED_ALL_ITEM_SIZE,
      ]);

      const result = await menuItemService.createMenuItem(mockMenuItemRequest);

      expect(mockItemSizeService.createItemSizeType).toHaveBeenCalledWith(
        mockMenuItemRequest.baseItemSize.label,
        mockMenuItemRequest.baseItemSize.price,
        mockMenuItemRequest.baseItemSize.priceOverride,
        undefined,
      );
      expect(mockMenuItemModel.insertMenuItem).toHaveBeenCalledTimes(1);
      expect(mockItemSizeService.createAllItemSizesForMenuItem).toHaveBeenCalledWith(MENU_ITEM_ID, mockMenuItemRequest.allItemSizes, undefined);

      expect(result).toEqual(expectedResponse);
    });
    it('should successfully create a single menu item with price override provided', async () => {
      const CREATED_PRICE_OVERRIDE_ITEM_SIZE: ItemSizeResponse = {
        id: BASE_ITEM_SIZE_ID,
        label: 'default',
        price: 0,
        priceOverride: 'Market Price',
      };
      const mockMenuItemRequest: CreateMenuItemRequestInterface = {
        name: 'TEST ITEM',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: MENU_SECTION_ID,
        baseItemSize: {
          label: 'default',
          price: 199,
          priceOverride: 'Market Price',
        },
        allItemSizes: [
          {
            label: 'default',
            price: 199,
            priceOverride: 'Market Price',
          },
        ],
        calories: 100,
      };

      const expectedResponse: CreateMenuItemResponse = {
        menuItemID: MENU_ITEM_ID,
        name: mockMenuItemRequest.name,
        description: mockMenuItemRequest.description,
        category: mockMenuItemRequest.category,
        menuSectionID: MENU_SECTION_ID,
        menuItemUrlID: 'fjd-0dsf30d-fsdf',
        baseItemSize: CREATED_PRICE_OVERRIDE_ITEM_SIZE,
        allItemSizes: [CREATED_PRICE_OVERRIDE_ITEM_SIZE],
        createdAt: '2022-02-02T02:44:11.950Z',
        isHidden: false,
        isFeatured: false,
        calories: 100,
      };

      (mockItemSizeService.createItemSizeType as jest.MockedFunction<any>).mockResolvedValueOnce(CREATED_PRICE_OVERRIDE_ITEM_SIZE);
      (mockMenuItemModel.insertMenuItem as jest.MockedFunction<any>).mockResolvedValueOnce(CREATED_MENU_ITEM);
      (mockItemSizeService.createAllItemSizesForMenuItem as jest.MockedFunction<any>).mockResolvedValueOnce([CREATED_PRICE_OVERRIDE_ITEM_SIZE]);

      const result = await menuItemService.createMenuItem(mockMenuItemRequest);

      expect(mockItemSizeService.createItemSizeType).toHaveBeenCalledWith(
        mockMenuItemRequest.baseItemSize.label,
        mockMenuItemRequest.baseItemSize.price,
        mockMenuItemRequest.baseItemSize.priceOverride,
        undefined,
      );
      expect(mockMenuItemModel.insertMenuItem).toHaveBeenCalledTimes(1);
      expect(mockItemSizeService.createAllItemSizesForMenuItem).toHaveBeenCalledWith(MENU_ITEM_ID, mockMenuItemRequest.allItemSizes, undefined);

      expect(result).toEqual(expectedResponse);
    });
    it('should delete created Menu Item and throw 500 Server Error if any exception occurs after item creation', async () => {
      const mockMenuItemRequest: CreateMenuItemRequestInterface = {
        name: 'TEST ITEM',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: MENU_SECTION_ID,
        baseItemSize: {
          label: 'default',
          price: 199,
          priceOverride: '',
        },
        allItemSizes: [
          {
            label: 'default',
            price: 199,
            priceOverride: '',
          },
        ],
      };

      (mockItemSizeService.createItemSizeType as jest.MockedFunction<any>).mockResolvedValueOnce(CREATED_BASE_ITEM_SIZE);
      (mockMenuItemModel.insertMenuItem as jest.MockedFunction<any>).mockResolvedValueOnce(CREATED_MENU_ITEM);
      (mockItemSizeService.createAllItemSizesForMenuItem as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await menuItemService.createMenuItem(mockMenuItemRequest);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemSizeService.createItemSizeType).toHaveBeenCalled();
      expect(mockMenuItemModel.insertMenuItem).toHaveBeenCalledTimes(1);
      expect(mockItemSizeService.createAllItemSizesForMenuItem).toHaveBeenCalled();
      expect(mockMenuItemModel.deleteMenuItemByID).toHaveBeenCalledWith(MENU_ITEM_ID, undefined);
    });
    it('should delete created Menu Item and throw HTTP Exception if prior exception occurs after item creation', async () => {
      const mockMenuItemRequest: CreateMenuItemRequestInterface = {
        name: 'TEST ITEM',
        description: 'DESCRIPTION',
        category: 'food',
        menuSectionID: MENU_SECTION_ID,
        baseItemSize: {
          label: 'default',
          price: 199,
          priceOverride: '',
        },
        allItemSizes: [
          {
            label: 'default',
            price: 199,
            priceOverride: '',
          },
        ],
      };

      (mockItemSizeService.createItemSizeType as jest.MockedFunction<any>).mockResolvedValueOnce(CREATED_BASE_ITEM_SIZE);
      (mockMenuItemModel.insertMenuItem as jest.MockedFunction<any>).mockResolvedValueOnce(CREATED_MENU_ITEM);
      (mockItemSizeService.createAllItemSizesForMenuItem as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(409, getErrorPayload(InternalErrorCode.resourceConflict, 'Error'));
      });
      try {
        await menuItemService.createMenuItem(mockMenuItemRequest);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemSizeService.createItemSizeType).toHaveBeenCalled();
      expect(mockMenuItemModel.insertMenuItem).toHaveBeenCalledTimes(1);
      expect(mockItemSizeService.createAllItemSizesForMenuItem).toHaveBeenCalled();
      expect(mockMenuItemModel.deleteMenuItemByID).toHaveBeenCalledWith(MENU_ITEM_ID, undefined);
    });
  });
  describe('deleteMenuItemByID', () => {
    it('should successfully call deleteMenuItemByID', async () => {
      await menuItemService.deleteMenuItemByID(MENU_ITEM_ID);

      expect(mockMenuItemModel.deleteMenuItemByID).toHaveBeenCalledWith(MENU_ITEM_ID, undefined);
    });
  });
  describe('editMenuItem', () => {
    const CREATED_BASE_ITEM_SIZE: ItemSizeResponse = {
      id: BASE_ITEM_SIZE_ID,
      label: 'default',
      price: 199,
      priceOverride: '',
    };
    const mockMenuItemRequest: EditMenuItemRequestInterface = {
      name: 'TEST ITEM',
      description: 'DESCRIPTION',
      category: 'food',
      menuItemID: MENU_ITEM_ID,
      menuSectionID: MENU_SECTION_ID,
      baseItemSize: {
        label: 'default',
        price: 199,
        priceOverride: '',
      },
      allItemSizes: [
        {
          label: 'default',
          price: 199,
          priceOverride: '',
        },
      ],
      calories: 100,
    };
    it('should successfully edit a single menu item and move it to new menu section', async () => {
      const MENU_ITEMS = [
        {
          menu_section_id: {
            menu_section_id: 2,
          },
        },
      ] as unknown;
      (mockMenuItemModel.getMenuItemEntityByID as jest.MockedFunction<any>).mockResolvedValue({
        menu_item_id: MENU_ITEM_ID,
        menu_section_id: { menu_section_id: 2 },
      });
      (mockMenuItemModel.getMenuItemsOfMenuSectionByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_ITEMS as MenuItemEntity[]);
      (mockMenuItemModel.getLargestListOrderInMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce(2);
      (mockItemSizeService.createItemSizeType as jest.MockedFunction<any>).mockResolvedValueOnce(CREATED_BASE_ITEM_SIZE);
      (mockMenuItemModel.updateMenuItemsListOrder as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (mockAggregateService.deleteMenuItemSizesByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (mockItemSizeService.createAllItemSizesForMenuItem as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      const transaction = jest.fn().mockImplementation(async cb => await cb({}));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menuItemService.editMenuItem(mockMenuItemRequest);

      expect(mockMenuItemModel.getMenuItemsOfMenuSectionByMenuItemID).toHaveBeenCalledWith(mockMenuItemRequest.menuItemID);
      expect(mockMenuItemModel.getLargestListOrderInMenuSection).toHaveBeenCalledWith(mockMenuItemRequest.menuSectionID);
      expect(mockItemSizeService.createItemSizeType).toHaveBeenCalledWith(
        mockMenuItemRequest.baseItemSize.label,
        mockMenuItemRequest.baseItemSize.price,
        mockMenuItemRequest.baseItemSize.priceOverride,
        {},
      );
    });
    it('should successfully edit a single menu item and keep in same menu section', async () => {
      const MENU_ITEMS = [
        {
          menu_section_id: {
            menu_section_id: 1,
          },
        },
      ] as unknown;
      (mockMenuItemModel.getMenuItemEntityByID as jest.MockedFunction<any>).mockResolvedValue({
        menu_item_id: MENU_ITEM_ID,
        menu_section_id: { menu_section_id: MENU_SECTION_ID },
      });
      (mockMenuItemModel.getMenuItemsOfMenuSectionByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_ITEMS as MenuItemEntity[]);
      (mockItemSizeService.createItemSizeType as jest.MockedFunction<any>).mockResolvedValueOnce(CREATED_BASE_ITEM_SIZE);
      const transaction = jest.fn().mockImplementation(async cb => await cb({}));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menuItemService.editMenuItem(mockMenuItemRequest);

      expect(mockMenuItemModel.getMenuItemsOfMenuSectionByMenuItemID).toHaveBeenCalledWith(mockMenuItemRequest.menuItemID);
      expect(mockMenuItemModel.getLargestListOrderInMenuSection).not.toHaveBeenCalled();
      expect(mockItemSizeService.createItemSizeType).toHaveBeenCalledWith(
        mockMenuItemRequest.baseItemSize.label,
        mockMenuItemRequest.baseItemSize.price,
        mockMenuItemRequest.baseItemSize.priceOverride,
        {},
      );
    });
    it('should patch only isFeatured when that is the only field provided', async () => {
      (mockMenuItemModel.getMenuItemEntityByID as jest.MockedFunction<any>).mockResolvedValue({
        menu_item_id: MENU_ITEM_ID,
        menu_section_id: { menu_section_id: MENU_SECTION_ID },
      });
      (mockMenuItemModel.getMenuItemsOfMenuSectionByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce([
        { menu_section_id: { menu_section_id: MENU_SECTION_ID } },
      ] as unknown as MenuItemEntity[]);
      const transaction = jest.fn().mockImplementation(async cb => await cb({}));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ transaction });

      await menuItemService.editMenuItem({ menuItemID: MENU_ITEM_ID, isFeatured: true });

      expect(mockItemSizeService.createItemSizeType).not.toHaveBeenCalled();
      expect(mockAggregateService.deleteMenuItemSizesByMenuItemID).not.toHaveBeenCalled();
      expect(mockMenuItemModel.patchMenuItem).toHaveBeenCalledWith(MENU_ITEM_ID, { is_featured: true }, {});
    });
    it('should throw HTTPException if any error occurs when editing menu item', async () => {
      const MENU_ITEMS = [
        {
          menu_section_id: {
            menu_section_id: 2,
          },
        },
      ] as unknown;
      (mockMenuItemModel.getMenuItemEntityByID as jest.MockedFunction<any>).mockResolvedValue({
        menu_item_id: MENU_ITEM_ID,
        menu_section_id: { menu_section_id: 2 },
      });
      (mockMenuItemModel.getMenuItemsOfMenuSectionByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_ITEMS as MenuItemEntity[]);
      (mockMenuItemModel.getLargestListOrderInMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce(2);
      (mockItemSizeService.createItemSizeType as jest.MockedFunction<any>).mockResolvedValueOnce(CREATED_BASE_ITEM_SIZE);
      const transaction = jest.fn().mockImplementation(async cb => await cb({}));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      try {
        await menuItemService.editMenuItem(mockMenuItemRequest);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenuItemModel.getMenuItemsOfMenuSectionByMenuItemID).toHaveBeenCalledWith(mockMenuItemRequest.menuItemID);
      expect(mockMenuItemModel.getLargestListOrderInMenuSection).toHaveBeenCalledWith(mockMenuItemRequest.menuSectionID);
      expect(mockItemSizeService.createItemSizeType).toHaveBeenCalledWith(
        mockMenuItemRequest.baseItemSize.label,
        mockMenuItemRequest.baseItemSize.price,
        mockMenuItemRequest.baseItemSize.priceOverride,
        {},
      );
    });
  });
  describe('linkDrinkItemsToMenuItem', () => {
    const DRINK_ITEM_IDS = [1000, 1001];
    it('should successfully link menu item to drink items after validating', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menuItemService.linkDrinkItemsToMenuItem(MENU_ITEM_ID, DRINK_ITEM_IDS, RESTAURANT_ID);

      expect(mockDrinkItemService.validatePairings).toHaveBeenCalledWith(DRINK_ITEM_IDS, RESTAURANT_ID);
    });
    it('should not validate drink items if none provided when linking menu item to drink items', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menuItemService.linkDrinkItemsToMenuItem(MENU_ITEM_ID, [], RESTAURANT_ID);

      expect(mockDrinkItemService.validatePairings).toHaveBeenCalledWith([], RESTAURANT_ID);
    });
    it('should throw HttpException if any error occurs while linking menu item and drink item', async () => {
      const transaction = jest.fn().mockImplementation(() => {
        throw Error;
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });
      try {
        await menuItemService.linkDrinkItemsToMenuItem(MENU_ITEM_ID, DRINK_ITEM_IDS, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockDrinkItemService.validatePairings).toHaveBeenCalledWith(DRINK_ITEM_IDS, RESTAURANT_ID);
    });
    it('should throw some HttpException if HttpException error occurs while linking menu item and drink items', async () => {
      const transaction = jest.fn().mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      try {
        await menuItemService.linkDrinkItemsToMenuItem(MENU_ITEM_ID, DRINK_ITEM_IDS, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      expect(mockDrinkItemService.validatePairings).toHaveBeenCalledWith(DRINK_ITEM_IDS, RESTAURANT_ID);
    });
  });
  describe('linkModifierGroupsToMenuItem', () => {
    const MODIFIER_GROUPS = [53, 54];
    const RESTAURANT = {
      restaurant_id: RESTAURANT_ID,
      modifierGroups: [{ modifierGroupID: 53 }, { modifierGroupID: 54 }],
    } as Partial<RestaurantEntity>;
    it('should successfully link modifier groups to menu item after validating successfully', async () => {
      (mockRestaurantService.findRestaurantEntityWithModifiersByID as jest.MockedFunction<any>).mockResolvedValueOnce(RESTAURANT);
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menuItemService.linkModifierGroupsToMenuItem(MENU_ITEM_ID, MODIFIER_GROUPS, RESTAURANT_ID);
    });
    it('should throw 404 Not Found when restaurant provided does not exist while linking modifier groups to menu item', async () => {
      (mockRestaurantService.findRestaurantEntityWithModifiersByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await menuItemService.linkModifierGroupsToMenuItem(MENU_ITEM_ID, MODIFIER_GROUPS, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantService.findRestaurantEntityWithModifiersByID).toHaveBeenCalledWith(RESTAURANT_ID, undefined);
    });
    it('should throw 404 Not Found when modifier group id provided does not exist for restaurant while linking modifier groups to menu item', async () => {
      (mockRestaurantService.findRestaurantEntityWithModifiersByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        ...RESTAURANT,
        modifierGroups: [RESTAURANT.modifierGroups[0].modifierGroupID],
      });

      try {
        await menuItemService.linkModifierGroupsToMenuItem(MENU_ITEM_ID, MODIFIER_GROUPS, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantService.findRestaurantEntityWithModifiersByID).toHaveBeenCalledWith(RESTAURANT_ID, undefined);
    });
  });
  describe('linkRestrictionsToMenuItem', () => {
    const DIETARY_RESTRICTIONS = [6, 4];
    it('should successfully create menu item restrictions after validating successfully', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menuItemService.linkRestrictionsToMenuItem(MENU_ITEM_ID, DIETARY_RESTRICTIONS);

      expect(mockDietaryRestrictionsService.validateDietaryRestrictions).toHaveBeenCalledWith(DIETARY_RESTRICTIONS);
    });
    it('should throw HttpException if any error occurs while creating menu item - restrictions', async () => {
      (mockDietaryRestrictionsService.validateDietaryRestrictions as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      try {
        await menuItemService.linkRestrictionsToMenuItem(MENU_ITEM_ID, DIETARY_RESTRICTIONS);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockDietaryRestrictionsService.validateDietaryRestrictions).toHaveBeenCalledWith(DIETARY_RESTRICTIONS);
    });
    it('should throw some HttpException if HttpException error occurs while creating menu item - restrictions', async () => {
      (mockDietaryRestrictionsService.validateDietaryRestrictions as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      try {
        await menuItemService.linkRestrictionsToMenuItem(MENU_ITEM_ID, DIETARY_RESTRICTIONS);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      expect(mockDietaryRestrictionsService.validateDietaryRestrictions).toHaveBeenCalledWith(DIETARY_RESTRICTIONS);
    });
  });
  describe('softDeleteMenuItemByID', () => {
    it('should successfully call softDeleteMenuItemByID', async () => {
      (mockMenuItemModel.softDeleteMenuItemByID as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menuItemService.softDeleteMenuItemByID(MENU_ITEM_ID);

      expect(mockMenuItemModel.softDeleteMenuItemByID).toHaveBeenCalledWith(MENU_ITEM_ID, undefined);
    });
  });
  describe('getMenuItemsByMenuSection', () => {
    const MODIFIERS: GetMenuDetailsModifiersResponseInterface[] = [
      {
        name: 'modifier_name1',
        isHidden: false,
        listOrder: 0,
        modifierID: 1,
        price: 100,
        description: 'Blah',
        media: [
          {
            mediaURL: 'https://resources.trytaptab.com/images/menu_items/13.jpg',
            type: MediaType.IMAGE,
            listOrder: 0,
          },
        ],
      },
      {
        name: 'modifier_name2',
        isHidden: false,
        listOrder: 1,
        modifierID: 2,
        media: [
          {
            mediaURL: 'https://resources.trytaptab.com/images/menu_items/13.jpg',
            type: MediaType.IMAGE,
            listOrder: 0,
          },
        ],
      },
    ];
    const MODIFIER_GROUPS: GetMenuDetailsModifierGroupsResponseInterface[] = [
      {
        name: 'modifier_group_name1',
        label: 'modifier_group_label1',
        modifierGroupID: 1,
        listOrder: 0,
        modifiers: [MODIFIERS[0], MODIFIERS[1]],
      },
      {
        name: 'modifier_group_name2',
        label: 'modifier_group_label2',
        modifierGroupID: 2,
        listOrder: 1,
        modifiers: [],
      },
    ];
    const MODIFIER_RESPONSE = [
      {
        name: 'modifier_name1',
        isHidden: false,
        modifierID: 1,
        price: 100,
        imageURL: 'https://resources.trytaptab.com/images/menu_items/13.jpg',
        description: 'Blah',
      },
      {
        name: 'modifier_name2',
        isHidden: false,
        modifierID: 2,
        price: 0,
        imageURL: 'https://resources.trytaptab.com/images/menu_items/13.jpg',
        description: '',
      },
    ];
    const MODIFIER_GROUPS_RESPONSE = [
      {
        name: 'modifier_group_name1',
        label: 'modifier_group_label1',
        modifierGroupID: 1,
        modifiers: [MODIFIER_RESPONSE[0], MODIFIER_RESPONSE[1]],
      },
      {
        name: 'modifier_group_name2',
        label: 'modifier_group_label2',
        modifierGroupID: 2,
        modifiers: [],
      },
    ];

    const BASE_ITEM_SIZE: ItemSizeResponse = {
      id: BASE_ITEM_SIZE_ID,
      label: 'default',
      price: 199,
      priceOverride: '',
    };
    const ALL_ITEM_SIZES = [
      {
        id: 1,
        label: 'default',
        price: 199,
        priceOverride: '',
      },
      {
        id: 2,
        label: 'large',
        price: 500,
        priceOverride: '',
      },
    ];
    const DIETARY_RESTRICTIONS = [
      {
        restrictionID: 4,
        name: 'Fish',
      },
      {
        restrictionID: 5,
        name: 'Shellfish',
      },
    ];
    const TAGS = [
      {
        name: "Chef's Recommendation",
        color: null,
        tagID: 2,
      },
    ];
    const PAIRINGS = [
      {
        drinkItemID: 1,
        name: 'Test Drink',
        isHidden: false,
      },
    ] as GetDrinkItemsInterface[];
    const MENU_ITEM_MEDIA = [
      {
        mediaID: 56,
        mediaURL: 'https://resources.trytaptab.com/images/menu_items/13.jpg',
        type: 'image',
        thumbnail: {},
        listOrder: 0,
      },
      {
        mediaID: 57,
        mediaURL: 'https://resources.trytaptab.com/images/menu_items/video1.mp4',
        type: 'video',
        thumbnail: {
          thumbnailID: 1,
          thumbnailURL: 'https://resources.trytaptab.com/images/menu_items/14.jpg',
        },
        listOrder: 1,
      },
    ];
    const MENU_ITEMS = [
      {
        menuItems: [
          {
            allItemSizes: ALL_ITEM_SIZES,
            dietaryRestrictions: DIETARY_RESTRICTIONS,
            tags: TAGS,
            baseItemSizeID: BASE_ITEM_SIZE_ID,
            pairings: PAIRINGS,
            modifierGroups: MODIFIER_GROUPS,
            description: 'menu item 1',
            menuItemID: 1,
            listOrder: 0,
            imageUrl: 'https://backend-dev.trytaptab.com/images/menu_items/57.jpg',
            calories: 100,
            category: 'food',
            createdAt: '2022-02-02T02:44:11.950Z',
            updatedAt: '2022-02-03T02:44:11.950Z',
            name: 'TEST menu item 1',
            media: MENU_ITEM_MEDIA,
          },
        ],
      },
    ];
    const EMPTY_MENU_ITEMS = [
      {
        menuItems: [
          {
            allItemSizes: ALL_ITEM_SIZES,
            baseItemSize: BASE_ITEM_SIZE,
            dietaryRestrictions: [],
            tags: [],
            pairings: [],
            media: [],
            modifierGroups: [],
            baseItemSizeID: BASE_ITEM_SIZE_ID,
            description: 'menu item 1',
            menuItemID: 2,
            listOrder: 0,
            imageUrl: 'https://backend-dev.trytaptab.com/images/menu_items/57.jpg',
            calories: null,
            category: 'food',
            createdAt: '2022-02-02T02:44:11.950Z',
            updatedAt: '2022-02-03T02:44:11.950Z',
            name: 'TEST menu item 1',
          },
        ],
      },
    ];
    it('should successfully get menu items by menu section with prix fixe = false', async () => {
      const expectedResponse = [
        {
          name: 'TEST menu item 1',
          description: 'menu item 1',
          menuItemID: 1,
          calories: 100,
          category: 'food',
          createdAt: '2022-02-02T02:44:11.950Z',
          updatedAt: '2022-02-03T02:44:11.950Z',
          imageURL: 'https://backend-dev.trytaptab.com/images/menu_items/57.jpg',
          isHidden: false,
          isFeatured: false,
          modifierGroups: MODIFIER_GROUPS_RESPONSE,
          media: [
            {
              mediaID: 56,
              mediaURL: 'https://resources.trytaptab.com/images/menu_items/13.jpg',
              type: 'image',
              thumbnail: {},
            },
            {
              mediaID: 57,
              mediaURL: 'https://resources.trytaptab.com/images/menu_items/video1.mp4',
              type: 'video',
              thumbnail: {
                thumbnailID: 1,
                thumbnailURL: 'https://resources.trytaptab.com/images/menu_items/14.jpg',
              },
            },
          ],
          dietaryRestrictions: [
            {
              restrictionID: 4,
              name: 'Fish',
            },
            {
              restrictionID: 5,
              name: 'Shellfish',
            },
          ],
          tags: [
            {
              name: "Chef's Recommendation",
              color: null,
              tagID: 2,
            },
          ],
          baseItemSize: {
            id: 123,
            label: 'default',
            price: 199,
            priceOverride: '',
          },
          allItemSizes: [
            {
              id: 1,
              label: 'default',
              price: 199,
              priceOverride: '',
            },
            {
              id: 2,
              label: 'large',
              price: 500,
              priceOverride: '',
            },
          ],
          pairings: [
            {
              drinkItemID: 1,
              name: 'Test Drink',
              isHidden: false,
            },
          ],
        },
      ];
      (mockMenuItemModel.getMenuItemsByMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_ITEMS);
      (mockItemSizeService.getBaseItemSizeFromAllItemSizes as jest.MockedFunction<any>).mockReturnValueOnce(BASE_ITEM_SIZE);

      const result = await menuItemService.getMenuItemsByMenuSection(MENU_SECTION_ID);

      expect(result).toEqual(expectedResponse);
      expect(mockMenuItemModel.getMenuItemsByMenuSection).toHaveBeenCalledWith(MENU_SECTION_ID, false);
      expect(mockItemSizeService.getBaseItemSizeFromAllItemSizes).toHaveBeenCalledWith(BASE_ITEM_SIZE_ID, ALL_ITEM_SIZES);
    });
    it('should successfully get menu items with empty arrays of modifierGroups and dietaryRestrictions', async () => {
      const expectedResponse = [
        {
          name: 'TEST menu item 1',
          description: 'menu item 1',
          menuItemID: 2,
          calories: null,
          category: 'food',
          createdAt: '2022-02-02T02:44:11.950Z',
          updatedAt: '2022-02-03T02:44:11.950Z',
          imageURL: 'https://backend-dev.trytaptab.com/images/menu_items/57.jpg',
          dietaryRestrictions: [],
          modifierGroups: [],
          tags: [],
          isHidden: false,
          isFeatured: false,
          baseItemSize: {
            id: 123,
            label: 'default',
            price: 199,
            priceOverride: '',
          },
          allItemSizes: [
            {
              id: 1,
              label: 'default',
              price: 199,
              priceOverride: '',
            },
            {
              id: 2,
              label: 'large',
              price: 500,
              priceOverride: '',
            },
          ],
          pairings: [],
          media: [],
        },
      ];

      (mockMenuItemModel.getMenuItemsByMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce(EMPTY_MENU_ITEMS);
      (mockItemSizeService.getBaseItemSizeFromAllItemSizes as jest.MockedFunction<any>).mockReturnValueOnce(BASE_ITEM_SIZE);

      const result = await menuItemService.getMenuItemsByMenuSection(MENU_SECTION_ID);

      expect(result).toEqual(expectedResponse);
      expect(mockMenuItemModel.getMenuItemsByMenuSection).toHaveBeenCalledWith(MENU_SECTION_ID, false);
      expect(mockItemSizeService.getBaseItemSizeFromAllItemSizes).toHaveBeenCalledWith(BASE_ITEM_SIZE_ID, ALL_ITEM_SIZES);
    });
    it('should successfully get menu items by menu section with prix fixe = true and priceOverride = prix', async () => {
      const expectedResponsePrix = [
        {
          name: 'TEST menu item 1',
          description: 'menu item 1',
          menuItemID: 1,
          calories: 100,
          category: 'food',
          isHidden: false,
          isFeatured: false,
          createdAt: '2022-02-02T02:44:11.950Z',
          updatedAt: '2022-02-03T02:44:11.950Z',
          imageURL: 'https://backend-dev.trytaptab.com/images/menu_items/57.jpg',
          media: MENU_ITEM_MEDIA,
          dietaryRestrictions: [
            {
              restrictionID: 4,
              name: 'Fish',
            },
            {
              restrictionID: 5,
              name: 'Shellfish',
            },
          ],
          tags: [
            {
              name: "Chef's Recommendation",
              color: null,
              tagID: 2,
            },
          ],
          baseItemSize: {
            id: 123,
            label: 'default',
            price: 199,
            priceOverride: 'prix',
          },
          allItemSizes: [
            {
              id: 1,
              label: 'default',
              price: 199,
              priceOverride: 'prix',
            },
            {
              id: 2,
              label: 'large',
              price: 500,
              priceOverride: 'prix',
            },
          ],
          pairings: [
            {
              drinkItemID: 1,
              name: 'Test Drink',
              isHidden: false,
            },
          ],
          modifierGroups: MODIFIER_GROUPS_RESPONSE,
        },
      ];
      (mockMenuItemModel.getMenuItemsByMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_ITEMS);
      (mockItemSizeService.getBaseItemSizeFromAllItemSizes as jest.MockedFunction<any>).mockReturnValueOnce(BASE_ITEM_SIZE);

      const result = await menuItemService.getMenuItemsByMenuSection(MENU_SECTION_ID, true);

      expect(result).toEqual(expectedResponsePrix);
      expect(mockMenuItemModel.getMenuItemsByMenuSection).toHaveBeenCalledWith(MENU_SECTION_ID, false);
      expect(mockItemSizeService.getBaseItemSizeFromAllItemSizes).toHaveBeenCalledWith(BASE_ITEM_SIZE_ID, ALL_ITEM_SIZES);
    });
    it('should successfully send back empty array if no menu items exist for a menu section', async () => {
      const expectedEmptyResponse = [];
      (mockMenuItemModel.getMenuItemsByMenuSection as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      const result = await menuItemService.getMenuItemsByMenuSection(MENU_SECTION_ID);
      expect(result).toEqual(expectedEmptyResponse);
      expect(mockMenuItemModel.getMenuItemsByMenuSection).toHaveBeenCalledWith(MENU_SECTION_ID, false);
    });
    it('should send back HttpException 500 status code runtime error when any error occurs  ', async () => {
      (mockMenuItemModel.getMenuItemsByMenuSection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw new Error();
      });

      try {
        await menuItemService.getMenuItemsByMenuSection(MENU_SECTION_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
      expect(mockMenuItemModel.getMenuItemsByMenuSection).toHaveBeenCalledWith(MENU_SECTION_ID, false);
      expect(mockItemSizeService.getBaseItemSizeFromAllItemSizes).not.toHaveBeenCalled();
    });
  });
  describe('reorderMenuItems', () => {
    const MENU_SECTION_ID = 88;
    const correctMenuItemsOrder = [4, 1, 3, 2];
    const wrongValuesMenuItemsOrder = [4, 1, 3, 5];
    const missingValuesMenuItemsOrder = [4, 3, 4];
    const extraValuesMenuItemsOrder = [4, 1, 3, 5, 2];
    const duplicateValuesMenuItemsOrder = [4, 1, 3, 3, 2];
    const mockExistingMenuItems = [
      {
        menu_item_id: 1,
        section_name: 'Pasta',
      },
      {
        menu_item_id: 2,
        section_name: 'Pizza',
      },
      {
        menu_item_id: 3,
        section_name: 'Entrees',
      },
      {
        menu_item_id: 4,
        section_name: 'Appetizers',
      },
    ];
    it('should successfully reorder menu items of menuSectionID by calling transaction', async () => {
      (mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenuItems);

      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menuItemService.reorderMenuItems(MENU_SECTION_ID, correctMenuItemsOrder);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException 500 status code if any error occurs while reordering menu items of a menu section', async () => {
      (mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuItemService.reorderMenuItems(MENU_SECTION_ID, correctMenuItemsOrder);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 400 status code if menu items in request body have less than exist in menu section', async () => {
      (mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenuItems);

      try {
        await menuItemService.reorderMenuItems(MENU_SECTION_ID, missingValuesMenuItemsOrder);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 400 status code if menu items in request body have extra menu items than exist in menu section', async () => {
      (mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenuItems);

      try {
        await menuItemService.reorderMenuItems(MENU_SECTION_ID, extraValuesMenuItemsOrder);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 400 status code if duplicate menu items', async () => {
      (mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenuItems);

      try {
        await menuItemService.reorderMenuItems(MENU_SECTION_ID, duplicateValuesMenuItemsOrder);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 400 status code if menu items in body request dont match with menu items of a menu section', async () => {
      (mockMenuItemModel.getMenuItemsEntitiesByMenuSectionID as jest.MockedFunction<any>).mockResolvedValueOnce(mockExistingMenuItems);

      try {
        await menuItemService.reorderMenuItems(MENU_SECTION_ID, wrongValuesMenuItemsOrder);
      } catch (err) {
        expect(err.status).toEqual(400);
      }
    });
  });
  describe('hideMenuItem', () => {
    const MENU_ITEM_ID = 345;
    const HIDE = true;
    it('should successfully hide menu item of menuItemID', async () => {
      (mockMenuItemModel.hideMenuItem as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await menuItemService.hideMenuItem(MENU_ITEM_ID, HIDE);
      expect(mockMenuItemModel.hideMenuItem).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException 500 status code if any error occurs while hiding menu item', async () => {
      (mockMenuItemModel.hideMenuItem as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await menuItemService.hideMenuItem(MENU_ITEM_ID, HIDE);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('linkMediaToMenuItem', () => {
    const MEDIA_ID = 3;
    const MEDIA: MediaEntity[] = [new MediaEntity('test.jpeg', 1, RESTAURANT_ID, 'some_image', MEDIA_ID)];
    const LINK_REQUEST: LinkMenuItemAndMediaInterface = {
      menuItemID: MENU_ITEM_ID,
      mediaIDs: [MEDIA_ID],
      thumbnails: [],
    };
    const MENU_ITEM_MEDIA: MenuItemMediaEntity[] = [
      {
        ...new MenuItemMediaEntity(MENU_ITEM_ID, 56, 'https://resources.trytaptab.com/images/menu_items/13.jpg', 1),
        menu_item_video_thumbnail: {},
        media: {
          ...new MediaEntity('test_url.jpg', IMAGE_TYPE_ID, RESTAURANT_ID, 'some_image', MEDIA_ID),
        } as MediaEntity,
      },
      {
        ...new MenuItemMediaEntity(MENU_ITEM_ID, 57, 'https://resources.trytaptab.com/images/menu_items/14.jpg', 1),
        menu_item_video_thumbnail: {},
        media: {
          ...new MediaEntity('test_url2.jpg', IMAGE_TYPE_ID, RESTAURANT_ID, 'some_image', 4),
        } as MediaEntity,
      },
    ];
    const MENU_ITEMS_WITH_MEDIA: MenuItemEntity = {
      ...new MenuItemEntity('TEST menu item 1', 'food', MENU_ITEM_ID, 'menu item 1'),
      media: MENU_ITEM_MEDIA,
    };

    it('should successfully link media and menu item', async () => {
      (mockMenuItemModel.getMenuItemEntityWithMediaByID as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_ITEMS_WITH_MEDIA);

      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menuItemService.linkMediaToMenuItem(MEDIA, LINK_REQUEST);

      expect(mockMenuItemModel.getMenuItemEntityWithMediaByID).toHaveBeenCalledWith(MENU_ITEM_ID);
    });
    it('should successfully remove media for menu item via empty array', async () => {
      (mockMenuItemModel.getMenuItemEntityWithMediaByID as jest.MockedFunction<any>).mockResolvedValueOnce(MENU_ITEMS_WITH_MEDIA);

      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menuItemService.linkMediaToMenuItem(MEDIA, { ...LINK_REQUEST, mediaIDs: [] });

      expect(mockMenuItemModel.getMenuItemEntityWithMediaByID).toHaveBeenCalledWith(MENU_ITEM_ID);
    });
    it('should throw HttpException if any error occurs while linking media to menu item', async () => {
      (mockMenuItemModel.getMenuItemEntityWithMediaByID as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      try {
        await menuItemService.linkMediaToMenuItem(MEDIA, LINK_REQUEST);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenuItemModel.getMenuItemEntityWithMediaByID).toHaveBeenCalledTimes(1);
    });
    it('should throw 400 Bad Request HttpException if number of thumbnails provided do not match videos provided while linking media and menu item', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      try {
        await menuItemService.linkMediaToMenuItem(MEDIA, { ...LINK_REQUEST, thumbnails: [{ videoID: 1, thumbnailID: 1 }] });
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
  });

  describe('linkTagToMenuItem', () => {
    const TAG_IDS = [1, 4];
    const NO_IDS = [];
    it('should successfully create menu item tags after validating successfully', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menuItemService.linkTagToMenuItem(MENU_ITEM_ID, TAG_IDS, RESTAURANT_ID);

      expect(mockTagsService.validateTagsByRestaurantID).toHaveBeenCalledWith(TAG_IDS, RESTAURANT_ID);
    });
    it('should successfully remove menu item tags via empty array', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await menuItemService.linkTagToMenuItem(MENU_ITEM_ID, NO_IDS, RESTAURANT_ID);

      expect(mockTagsService.validateTagsByRestaurantID).toHaveBeenCalledWith(NO_IDS, RESTAURANT_ID);
    });
    it('should throw HttpException if any error occurs while creating menu item - tags', async () => {
      (mockTagsService.validateTagsByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      try {
        await menuItemService.linkTagToMenuItem(MENU_ITEM_ID, TAG_IDS, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockTagsService.validateTagsByRestaurantID).toHaveBeenCalledWith(TAG_IDS, RESTAURANT_ID);
    });
    it('should throw some HttpException if HttpException error occurs while creating menu item - tags', async () => {
      (mockTagsService.validateTagsByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      try {
        await menuItemService.linkTagToMenuItem(MENU_ITEM_ID, TAG_IDS, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      expect(mockTagsService.validateTagsByRestaurantID).toHaveBeenCalledWith(TAG_IDS, RESTAURANT_ID);
    });
  });
  describe('uploadMenuItemMedia', () => {
    const MENU_ITEM_ID = 357;
    const IMAGES_TO_DELETE = [74];
    const IMAGE0 = 'image0.jpeg';
    const IMAGE1 = 'image1.jpeg';
    const UPLOAD_ONE_IMAGE = [IMAGE0];
    const UPLOAD_TWO_IMAGES = [IMAGE0, IMAGE1];
    const MENU_ITEM_IMAGE_TYPE = 1;

    const UPLOAD_ONE_VIDEO = 'video0.mov';
    const UPLOAD_ONE_THUMBNAIL = 'thumbnail0.jpeg';

    const mockGetMenuItemMediaImages = [
      {
        menu_item_media_id: 74,
        media_url: 'bab14c40-9f83-4d40-b9a3-6ee2f6b1a0fe.jpeg',
        list_order: 0,
        menu_item_media_type_id: {
          menu_item_media_type_id: 1,
          type: 'image',
          description: 'standard image displayed from menu item',
        },
      },
    ];
    const mockGetTwoMenuItemMediaImages = [
      {
        menu_item_media_id: 74,
        media_url: 'bab14c40-9f83-4d40-b9a3-6ee2f6b1a0fe.jpeg',
        list_order: 0,
        menu_item_media_type_id: {
          menu_item_media_type_id: 1,
          type: 'image',
          description: 'standard image displayed from menu item',
        },
      },
      {
        menu_item_media_id: 75,
        media_url: 'bab14c40-9f83-4d40-b9a3-6ee2f6b1a0fe2.jpeg',
        list_order: 1,
        menu_item_media_type_id: {
          menu_item_media_type_id: 1,
          type: 'image',
          description: 'standard image displayed from menu item',
        },
      },
    ];
    const mockOneInsertedMenuItemMediaImages = [
      {
        menu_item_media_id: 74,
        menu_item_id: 357,
        media_url: IMAGE0,
        menu_item_media_type_id: 1,
        list_order: 1,
        deleted_at: null,
        created_at: '2022-12-20T13:36:13.755Z',
        updated_at: '2022-12-20T13:36:13.755Z',
      },
    ];
    const FULL_PATH_IMAGE0 = `${IMAGE_HOSTING_URL}${IMAGE0}`;
    const FULL_PATH_IMAGE1 = `${IMAGE_HOSTING_URL}${IMAGE1}`;

    const insertedTwoMenuItemImagesResponse = {
      media: [
        {
          mediaURL: FULL_PATH_IMAGE0,
          mediaID: 74,
          thumbnail: {},
          type: 'image',
        },
        {
          mediaURL: FULL_PATH_IMAGE1,
          mediaID: 75,
          thumbnail: {},
          type: 'image',
        },
      ],
    };
    const insertedOneMenuItemImagesResponse = {
      media: [
        {
          mediaURL: FULL_PATH_IMAGE0,
          mediaID: 74,
          thumbnail: {},
          type: 'image',
        },
      ],
    };
    const mockInsertedOneMenuItemImage = [
      {
        media_url: IMAGE0,
        menu_item_media_id: 74,
        menu_item_media_type_id: MENU_ITEM_IMAGE_TYPE,
      },
    ];
    const mockInsertedTwoMenuItemImage = [
      {
        media_url: IMAGE0,
        menu_item_media_id: 74,
        menu_item_media_type_id: MENU_ITEM_IMAGE_TYPE,
      },
      {
        media_url: IMAGE1,
        menu_item_media_id: 75,
        menu_item_media_type_id: MENU_ITEM_IMAGE_TYPE,
      },
    ];
    const mockGetMenuItemMediaVideo = [
      {
        menu_item_media_id: 74,
        media_url: 'bab14c40-9f83-4d40-b9a3-6ee2f6b1a0fe.jpeg',
        list_order: 0,
        media_id: 100,
        menu_item_media_type_id: {
          menu_item_media_type_id: 3,
          type: 'video',
          description: 'standard video displayed from menu item',
        },
        menu_item_video_thumbnail: {
          menu_item_video_thumbnail_id: 1,
          thumbnail_url: 'thumbnail1.jpeg',
          media_id: 100,
        },
      },
    ];
    it('should successfully upload multiple menu item images after validating successfully', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuItemMediaImages);

      (mockItemMediaService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertedTwoMenuItemImage);

      const result = await menuItemService.uploadMenuItemMedia(UPLOAD_TWO_IMAGES, MENU_ITEM_ID, ['74'], []);

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
      expect(mockItemMediaService.uploadMenuItemMedia).toHaveBeenCalledWith(UPLOAD_TWO_IMAGES, [], MENU_ITEM_ID, ['74'], '', 0, '', 0, '');

      expect(result).toEqual(insertedTwoMenuItemImagesResponse);
    });
    it('should successfully upload one single menu item image after validating successfully', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuItemMediaImages);

      (mockItemMediaService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(mockOneInsertedMenuItemMediaImages);

      const result = await menuItemService.uploadMenuItemMedia(UPLOAD_ONE_IMAGE, MENU_ITEM_ID, ['74'], []);

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
      expect(mockItemMediaService.uploadMenuItemMedia).toHaveBeenCalledWith(UPLOAD_ONE_IMAGE, [], MENU_ITEM_ID, ['74'], '', 0, '', 0, '');

      expect(result).toEqual(insertedOneMenuItemImagesResponse);
    });
    it('should successfully delete one single menu item image and upload multiple images after validating successfully', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuItemMediaImages);

      (mockItemMediaService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertedTwoMenuItemImage);

      const result = await menuItemService.uploadMenuItemMedia(UPLOAD_TWO_IMAGES, MENU_ITEM_ID, [], IMAGES_TO_DELETE);

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
      expect(mockItemMediaService.uploadMenuItemMedia).toHaveBeenCalledWith(UPLOAD_TWO_IMAGES, [74], MENU_ITEM_ID, [], '', 0, '', 0, '');

      expect(result).toEqual(insertedTwoMenuItemImagesResponse);
    });
    it('should successfully delete one single menu item image after validating successfully', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuItemMediaImages);

      (mockItemMediaService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      const result = await menuItemService.uploadMenuItemMedia([], MENU_ITEM_ID, [], IMAGES_TO_DELETE);

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
      expect(mockItemMediaService.uploadMenuItemMedia).toHaveBeenCalledWith([], IMAGES_TO_DELETE, MENU_ITEM_ID, [], '', 0, '', 0, '');

      expect(result).toEqual(null);
    });
    it('should successfully reorder menu item images after validating successfully', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetTwoMenuItemMediaImages);

      (mockItemMediaService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(null);

      const result = await menuItemService.uploadMenuItemMedia([], MENU_ITEM_ID, ['75', '74'], []);

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
      expect(mockItemMediaService.uploadMenuItemMedia).toHaveBeenCalledWith([], [], MENU_ITEM_ID, ['75', '74'], '', 0, '', 0, '');

      expect(result).toEqual(null);
    });
    it('should successfully reorder menu item images without including uploaded image passed in request', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetTwoMenuItemMediaImages);

      (mockItemMediaService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertedOneMenuItemImage);

      const result = await menuItemService.uploadMenuItemMedia(UPLOAD_ONE_IMAGE, MENU_ITEM_ID, ['75', '74'], []);

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
      expect(mockItemMediaService.uploadMenuItemMedia).toHaveBeenCalledWith(UPLOAD_ONE_IMAGE, [], MENU_ITEM_ID, ['75', '74'], '', 0, '', 0, '');

      expect(result).toEqual(insertedOneMenuItemImagesResponse);
    });
    it('should successfully reorder menu item images with included uploaded image passed in request', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetTwoMenuItemMediaImages);

      (mockItemMediaService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertedOneMenuItemImage);

      const result = await menuItemService.uploadMenuItemMedia(UPLOAD_ONE_IMAGE, MENU_ITEM_ID, ['75', 'filename-0', '74'], []);

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
      expect(mockItemMediaService.uploadMenuItemMedia).toHaveBeenCalledWith(
        UPLOAD_ONE_IMAGE,
        [],
        MENU_ITEM_ID,
        ['75', 'filename-0', '74'],
        '',
        0,
        '',
        0,
        '',
      );

      expect(result).toEqual(insertedOneMenuItemImagesResponse);
    });
    it('should successfully reorder menu item image with two included uploaded image passed in request', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuItemMediaImages);

      (mockItemMediaService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertedTwoMenuItemImage);

      const result = await menuItemService.uploadMenuItemMedia(UPLOAD_TWO_IMAGES, MENU_ITEM_ID, ['filename-1', '74', 'filename-0'], []);

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
      expect(mockItemMediaService.uploadMenuItemMedia).toHaveBeenCalledWith(
        UPLOAD_TWO_IMAGES,
        [],
        MENU_ITEM_ID,
        ['filename-1', '74', 'filename-0'],
        '',
        0,
        '',
        0,
        '',
      );

      expect(result).toEqual(insertedTwoMenuItemImagesResponse);
    });
    it('should successfully delete one menu item image, upload menu item imagge, and reorder menu items images', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetTwoMenuItemMediaImages);

      (mockItemMediaService.uploadMenuItemMedia as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertedOneMenuItemImage);

      const result = await menuItemService.uploadMenuItemMedia(UPLOAD_ONE_IMAGE, MENU_ITEM_ID, ['filename-0', '75'], IMAGES_TO_DELETE);

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
      expect(mockItemMediaService.uploadMenuItemMedia).toHaveBeenCalledWith(
        UPLOAD_ONE_IMAGE,
        IMAGES_TO_DELETE,
        MENU_ITEM_ID,
        ['filename-0', '75'],
        '',
        0,
        '',
        0,
        '',
      );

      expect(result).toEqual(insertedOneMenuItemImagesResponse);
    });
    it('should throw 400 HttpException if uploaded images are in imagesOrder array but no images are being uploaded in the request', async () => {
      try {
        await menuItemService.uploadMenuItemMedia([], MENU_ITEM_ID, ['filename-0'], []);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw 400 HttpException if there are more uploaded images in mediaOrder array than images being uploaded in the request', async () => {
      try {
        await menuItemService.uploadMenuItemMedia(UPLOAD_ONE_IMAGE, MENU_ITEM_ID, ['filename-0', 'filename-1'], []);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw 400 HttpException if uploaded video(s) are in mediaOrder array but no video are being uploaded in the request', async () => {
      try {
        await menuItemService.uploadMenuItemMedia([], MENU_ITEM_ID, ['video-0'], []);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw 400 HttpException if there are more uploaded video(s) in mediaOrder array than video being uploaded in the request', async () => {
      try {
        await menuItemService.uploadMenuItemMedia([], MENU_ITEM_ID, ['video-0', 'video-1'], [], UPLOAD_ONE_THUMBNAIL, UPLOAD_ONE_VIDEO);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw HttpException if any error occurs while uploading menu item images', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await menuItemService.uploadMenuItemMedia([], MENU_ITEM_ID, ['74'], []);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
    });
    it('should throw 404 HttpException if an image that doesnt exist is being deleted', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      try {
        await menuItemService.uploadMenuItemMedia([], MENU_ITEM_ID, ['74'], [99999]);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
    });
    it('should throw 400 HttpException if an image being deleted is also in images to be reordered array', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuItemMediaImages);

      try {
        await menuItemService.uploadMenuItemMedia([], MENU_ITEM_ID, ['74'], IMAGES_TO_DELETE);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw 409 HttpException if there are more images being uploaded and aleady existing than max images number', async () => {
      const UPLOAD_THREE_IMAGES = [IMAGE0, IMAGE1, 'image2.jpeg'];

      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuItemMediaImages);

      try {
        await menuItemService.uploadMenuItemMedia(UPLOAD_THREE_IMAGES, MENU_ITEM_ID, ['74'], []);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
    });
    it('should throw 409 HttpException if there are more videos being uploaded and aleady existing than max video number', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuItemMediaVideo);

      try {
        await menuItemService.uploadMenuItemMedia([], MENU_ITEM_ID, ['74'], [], UPLOAD_ONE_THUMBNAIL, UPLOAD_ONE_VIDEO);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
    });
    it('should throw 404 HttpException if image ids to be reordered dont exist in database', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuItemMediaImages);
      (mockItemMediaService.validateIDsIncluded as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB));
      });

      try {
        await menuItemService.uploadMenuItemMedia(UPLOAD_TWO_IMAGES, MENU_ITEM_ID, ['9999'], []);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
    });
    it('should throw 400 HttpException if current existing images are not included in imagesOrder (unless they are being deleted)', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuItemMediaImages);

      try {
        await menuItemService.uploadMenuItemMedia(UPLOAD_TWO_IMAGES, MENU_ITEM_ID, [], []);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
    });
    it('should throw 409 HttpException if imagesOrder has more images than maxed allowed amount of images', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetTwoMenuItemMediaImages);

      try {
        await menuItemService.uploadMenuItemMedia(UPLOAD_TWO_IMAGES, MENU_ITEM_ID, ['75', 'filename-0', '74', 'filename-1'], []);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
    });
    it('should throw 400 HttpException if mediaOrder is missing existing mediaIDs video', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuItemMediaVideo);

      try {
        await menuItemService.uploadMenuItemMedia([], MENU_ITEM_ID, [], [], '', '');
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
    });
    it('should throw 400 HttpException if video is being uploaded but thumbnail doesnt already exist and is not beinb uploaded', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      try {
        await menuItemService.uploadMenuItemMedia([], MENU_ITEM_ID, [], [], '', UPLOAD_ONE_VIDEO);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
    });
    it('should throw 400 HttpException if thumbnail is being uploaded but video doesnt already exist and video is not being uploaded', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      try {
        await menuItemService.uploadMenuItemMedia([], MENU_ITEM_ID, [], [], UPLOAD_ONE_THUMBNAIL, '');
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
    });
    it('should throw 400 HttpException if thumbnail is being uploaded but video is not being uploaded and existing video is being deleted', async () => {
      (mockItemMediaService.getMenuItemMediaByMenuItemID as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuItemMediaVideo);
      const videoToRemoveID = mockGetMenuItemMediaVideo[0].menu_item_media_id;
      try {
        await menuItemService.uploadMenuItemMedia([], MENU_ITEM_ID, [], [videoToRemoveID], UPLOAD_ONE_THUMBNAIL, '');
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemMediaService.getMenuItemMediaByMenuItemID).toHaveBeenCalledWith(MENU_ITEM_ID);
    });
  });
});
