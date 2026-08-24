import { MenuLayoutEntity } from '@/entities/menuLayout.entity';
import { RestaurantMenuLayoutEntity } from '@/entities/restaurantMenuLayout.entity';
import { MenuLayout } from '@/enums/menuLayout';
import { MenuLayoutInterface } from '@/interfaces/menuLayout.interface';
import MenuLayoutsModel from '@/models/menuLayouts.model';
import MenuLayoutsService from '@/services/menuLayouts.service';
import { HttpException } from '@exceptions/HttpException';

jest.mock('@/models/menuLayouts.model', () => {
  const mockMenuLayoutsModel = {
    getAllMenuLayouts: jest.fn(),
    getMenuLayoutByRestaurantID: jest.fn(),
    updateMenuLayoutOfRestaurant: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMenuLayoutsModel) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});

const mockMenuLayoutsModel = new MenuLayoutsModel();
const menuLayoutsService = new MenuLayoutsService(mockMenuLayoutsModel);

describe('menuLayoutsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('updateRestaurantMenuLayout', () => {
    const mockModelResponse: RestaurantMenuLayoutEntity = {
      id: 1,
      menu_layout_id: 2,
      restaurant_id: 1,
      created_at: '2022-02-02T02:44:11.950Z',
      updated_at: '2022-02-02T02:44:11.950Z',
    };
    const existingMenuLayoutIDs: MenuLayoutEntity[] = [
      {
        menu_layout_id: 2,
        layout: MenuLayout.column,
        restaurant_menu_layouts: [],
      },
      {
        menu_layout_id: 1,
        layout: MenuLayout.column,
        restaurant_menu_layouts: [],
      },
    ];
    it('should successfully update menu layout of restaurant in table', async () => {
      (mockMenuLayoutsModel.getAllMenuLayouts as jest.MockedFunction<any>).mockResolvedValueOnce(existingMenuLayoutIDs);
      (mockMenuLayoutsModel.getMenuLayoutByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      await menuLayoutsService.updateRestaurantMenuLayout(1, 1);
      expect(mockMenuLayoutsModel.getAllMenuLayouts).toHaveBeenCalledTimes(1);
      expect(mockMenuLayoutsModel.getMenuLayoutByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockMenuLayoutsModel.updateMenuLayoutOfRestaurant).toHaveBeenCalledTimes(1);
    });
    it('should avoid updating menu layout of restaurant in table because layoutID is the same id as already in the database', async () => {
      (mockMenuLayoutsModel.getAllMenuLayouts as jest.MockedFunction<any>).mockResolvedValueOnce(existingMenuLayoutIDs);
      (mockMenuLayoutsModel.getMenuLayoutByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      await menuLayoutsService.updateRestaurantMenuLayout(2, 1);
      expect(mockMenuLayoutsModel.getAllMenuLayouts).toHaveBeenCalledTimes(1);
      expect(mockMenuLayoutsModel.getMenuLayoutByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockMenuLayoutsModel.updateMenuLayoutOfRestaurant).not.toHaveBeenCalled();
    });
    it('should not update menu layout due to 404 menuLayoutID does not exist', async () => {
      (mockMenuLayoutsModel.getAllMenuLayouts as jest.MockedFunction<any>).mockResolvedValueOnce(existingMenuLayoutIDs);

      try {
        await menuLayoutsService.updateRestaurantMenuLayout(8, 1);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenuLayoutsModel.getAllMenuLayouts).toHaveBeenCalledTimes(1);
      expect(mockMenuLayoutsModel.getMenuLayoutByRestaurantID).not.toHaveBeenCalled();
      expect(mockMenuLayoutsModel.updateMenuLayoutOfRestaurant).not.toHaveBeenCalled();
    });
    it('should throw 500 Bad Request HttpException if any error exists', async () => {
      (mockMenuLayoutsModel.getAllMenuLayouts as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await menuLayoutsService.updateRestaurantMenuLayout(1, 1);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenuLayoutsModel.getAllMenuLayouts).toHaveBeenCalledTimes(1);
      expect(mockMenuLayoutsModel.getMenuLayoutByRestaurantID).not.toHaveBeenCalled();
      expect(mockMenuLayoutsModel.updateMenuLayoutOfRestaurant).not.toHaveBeenCalled();
    });
  });
  describe('getAllMenuLayouts', () => {
    const mockModelResponse: MenuLayoutEntity[] = [
      {
        menu_layout_id: 1,
        layout: MenuLayout.grid_with_text,
        restaurant_menu_layouts: [],
      },
      {
        menu_layout_id: 2,
        layout: MenuLayout.grid,
        restaurant_menu_layouts: [],
      },
      {
        menu_layout_id: 3,
        layout: MenuLayout.column,
        restaurant_menu_layouts: [],
      },
      {
        menu_layout_id: 4,
        layout: MenuLayout.text_only,
        restaurant_menu_layouts: [],
      },
    ];
    it('should successfully get all menu layouts in table', async () => {
      const expectedResponse: MenuLayoutInterface[] = [
        {
          layoutID: 1,
          name: 'grid with text',
        },
        {
          layoutID: 2,
          name: 'grid no text',
        },
        {
          layoutID: 3,
          name: 'column with text',
        },
        {
          layoutID: 4,
          name: 'text only',
        },
      ];

      (mockMenuLayoutsModel.getAllMenuLayouts as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await menuLayoutsService.getAllMenuLayouts();

      expect(mockMenuLayoutsModel.getAllMenuLayouts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw 500 Bad Request HttpException if any error exists', async () => {
      (mockMenuLayoutsModel.getAllMenuLayouts as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await menuLayoutsService.getAllMenuLayouts();
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockMenuLayoutsModel.getAllMenuLayouts).toHaveBeenCalledTimes(1);
    });
  });
});
