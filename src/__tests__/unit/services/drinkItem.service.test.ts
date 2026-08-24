import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import DrinkItemModel from '@/models/drinkItem.model';
import DrinkItemService from '@services/drinkItem.service';
import { MenuItemEntity } from '@/entities/menuItem.entity';
import { GetDrinkItemsInterface } from '@interfaces/drinkItem.interface';

jest.mock('@/models/drinkItem.model', () => {
  const mockDrinkItemModel = {
    getDrinkItemsByIDsAndRestaurantID: jest.fn(),
    getDrinkItemsByRestaurantID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDrinkItemModel) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});

const mockDrinkItemModel = new DrinkItemModel();

const drinkItemService = new DrinkItemService(mockDrinkItemModel);

describe('drinkItemService', () => {
  const RESTAURANT_ID = 1;
  const DRINK_ITEMS: MenuItemEntity[] = [
    {
      menu_item_id: 1000,
      name: 'Test Drink 1',
      menu_item_url_id: 'F0DF78',
      description: 'test description',
      image_url: 'image',
      category: 'drink',
      menu_section_id: 1,
      list_order: 0,
      created_at: null,
      updated_at: null,
      deleted: false,
      base_item_size_id: 1,
      is_hidden: false,
      is_featured: false,
      menu_item_restrictions: [],
      menu_item_sizes: [],
      menu_item_pairings: [],
      media: [],
    },
    {
      menu_item_id: 1001,
      name: 'Test Drink 2',
      menu_item_url_id: 'G0DF78',
      description: null,
      image_url: null,
      category: 'drink',
      menu_section_id: 1,
      list_order: 1,
      created_at: null,
      updated_at: null,
      deleted: false,
      base_item_size_id: 1,
      is_hidden: true,
      is_featured: false,
      menu_item_restrictions: [],
      menu_item_sizes: [],
      menu_item_pairings: [],
      media: [],
    },
  ];
  const DRINK_ITEM_IDS = [DRINK_ITEMS[0].menu_item_id, DRINK_ITEMS[1].menu_item_id];
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('getDrinkItemsByIDsAndRestaurantID', () => {
    it('should successfully get drink items by id and restaurant', async () => {
      (mockDrinkItemModel.getDrinkItemsByIDsAndRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(DRINK_ITEMS);

      const result = await drinkItemService.getDrinkItemsByIDsAndRestaurantID(DRINK_ITEM_IDS, RESTAURANT_ID);
      expect(mockDrinkItemModel.getDrinkItemsByIDsAndRestaurantID).toHaveBeenCalledTimes(1);
      expect(result).toEqual(DRINK_ITEMS);
    });
    it('should return empty array if not drinks are found when getting drink items by id and restaurant', async () => {
      (mockDrinkItemModel.getDrinkItemsByIDsAndRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      const result = await drinkItemService.getDrinkItemsByIDsAndRestaurantID([], RESTAURANT_ID);
      expect(mockDrinkItemModel.getDrinkItemsByIDsAndRestaurantID).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
    it('should throw HttpException if any error occurs while getting drink items by id and restaurant', async () => {
      (mockDrinkItemModel.getDrinkItemsByIDsAndRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await drinkItemService.getDrinkItemsByIDsAndRestaurantID(DRINK_ITEM_IDS, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw some HttpException if HttpException error occurs while getting drink items by id and restaurant', async () => {
      (mockDrinkItemModel.getDrinkItemsByIDsAndRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await drinkItemService.getDrinkItemsByIDsAndRestaurantID(DRINK_ITEM_IDS, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getDrinkItemsByRestaurantID', () => {
    it('should successfully get drink items for restaurant', async () => {
      const DRINK_ITEMS: MenuItemEntity[] = [
        {
          menu_item_id: 1000,
          name: 'Test Drink 1',
          menu_item_url_id: 'F0DF78',
          description: 'test description',
          image_url: 'image',
          category: 'drink',
          menu_section_id: 1,
          list_order: 0,
          created_at: null,
          updated_at: null,
          deleted: false,
          base_item_size_id: 1,
          is_hidden: false,
          is_featured: false,
          menu_item_restrictions: [],
          menu_item_sizes: [],
          menu_item_pairings: [],
        },
        {
          menu_item_id: 1001,
          name: 'Test Drink 2',
          menu_item_url_id: 'G0DF78',
          description: null,
          image_url: null,
          category: 'drink',
          menu_section_id: 1,
          list_order: 1,
          created_at: null,
          updated_at: null,
          deleted: false,
          base_item_size_id: 1,
          is_hidden: true,
          is_featured: false,
          menu_item_restrictions: [],
          menu_item_sizes: [],
          menu_item_pairings: [],
        },
      ];
      const expectedResponse: GetDrinkItemsInterface[] = [
        { name: DRINK_ITEMS[0].name, drinkItemID: DRINK_ITEMS[0].menu_item_id, isHidden: DRINK_ITEMS[0].is_hidden },
        { name: DRINK_ITEMS[1].name, drinkItemID: DRINK_ITEMS[1].menu_item_id, isHidden: DRINK_ITEMS[1].is_hidden },
      ];
      (mockDrinkItemModel.getDrinkItemsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(DRINK_ITEMS);

      const result = await drinkItemService.getDrinkItemsByRestaurantID(RESTAURANT_ID);
      expect(mockDrinkItemModel.getDrinkItemsByRestaurantID).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should return empty array if not drinks are found when getting drink items for restaurant', async () => {
      (mockDrinkItemModel.getDrinkItemsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      const result = await drinkItemService.getDrinkItemsByRestaurantID(RESTAURANT_ID);
      expect(mockDrinkItemModel.getDrinkItemsByRestaurantID).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
    it('should throw HttpException if any error occurs while getting drink items for restaurant', async () => {
      (mockDrinkItemModel.getDrinkItemsByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await drinkItemService.getDrinkItemsByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw some HttpException if HttpException error occurs while getting drink items for restaurant', async () => {
      (mockDrinkItemModel.getDrinkItemsByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await drinkItemService.getDrinkItemsByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('validatePairings', () => {
    it('should successfully validate menu item pairings ids with the drink items that exist for a restaurant', async () => {
      (mockDrinkItemModel.getDrinkItemsByIDsAndRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(DRINK_ITEMS);

      await drinkItemService.validatePairings(DRINK_ITEM_IDS, RESTAURANT_ID);
      expect(mockDrinkItemModel.getDrinkItemsByIDsAndRestaurantID).toHaveBeenCalledWith(DRINK_ITEM_IDS, RESTAURANT_ID);
    });
    it('should throw 400 Bad Request when drink item(s) provided does not exist while linking menu item and drink items', async () => {
      (mockDrinkItemModel.getDrinkItemsByIDsAndRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      try {
        await drinkItemService.validatePairings(DRINK_ITEM_IDS, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      expect(mockDrinkItemModel.getDrinkItemsByIDsAndRestaurantID).toHaveBeenCalledWith(DRINK_ITEM_IDS, RESTAURANT_ID);
    });
  });
});
