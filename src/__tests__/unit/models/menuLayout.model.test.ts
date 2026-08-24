import { ormConnection } from '@utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import { EntityManager } from 'typeorm';
import MenuLayoutsModel from '@/models/menuLayouts.model';
import { RestaurantMenuLayoutEntity } from '@/entities/restaurantMenuLayout.entity';
import { MenuLayoutEntity } from '@/entities/menuLayout.entity';
import { MenuLayout } from '@/enums/menuLayout';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const menuLayoutModel = new MenuLayoutsModel();
describe('MenuLayoutsModel', () => {
  describe('getMenuLayoutByRestaurantID', () => {
    const mockModelResponse: RestaurantMenuLayoutEntity = {
      id: 1,
      menu_layout_id: 2,
      restaurant_id: 1,
      created_at: '2022-02-02T02:44:11.950Z',
      updated_at: '2022-02-02T02:44:11.950Z',
    };
    it('should get restaurant menu layout successfully', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      (findOne as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await menuLayoutModel.getMenuLayoutByRestaurantID(1);

      expect(findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw HttpException 500 if an error occurs while getting restaurant menu layout', async () => {
      const findOne = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await menuLayoutModel.getMenuLayoutByRestaurantID(1);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('updateMenuLayoutOfRestaurant', () => {
    it('should update restaurant menu layout successfully', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });
      (update as jest.MockedFunction<any>).mockResolvedValueOnce({});

      await menuLayoutModel.updateMenuLayoutOfRestaurant(1, 1);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while updating restaurant menu layout', async () => {
      const update = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      try {
        await menuLayoutModel.updateMenuLayoutOfRestaurant(1, 1);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
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
    it('should get all menu layouts successfully', async () => {
      const find = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });
      (find as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await menuLayoutModel.getAllMenuLayouts();

      expect(find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw HttpException 500 if an error occurs while getting menu layouts', async () => {
      const find = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      try {
        await menuLayoutModel.getAllMenuLayouts({} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
