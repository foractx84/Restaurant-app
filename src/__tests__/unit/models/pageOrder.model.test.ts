import { ormConnection } from '@/utils/dbUtils';
import PageOrderModel from '@/models/pageOrder.model';
import { RestaurantPageOrderEntity } from '@/entities/restaurantPageOrder.entity';

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
  return { __esModule: true, ormConnection: jest.fn() };
});

const pageOrderModel = new PageOrderModel();

const RESTAURANT_ID = 20;

describe('pageOrderModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('fetchByRestaurantID', () => {
    it('should fetch the page order rows ascending by list_order', async () => {
      const rows = [
        { page_key: 'menu', list_order: 0 },
        { page_key: 'events', list_order: 1 },
      ] as RestaurantPageOrderEntity[];
      const getMany = jest.fn().mockResolvedValueOnce(rows);
      const builder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany,
      };
      const createQueryBuilder = jest.fn().mockReturnValue(builder);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ createQueryBuilder });

      const result = await pageOrderModel.fetchByRestaurantID(RESTAURANT_ID);

      expect(createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(builder.orderBy).toHaveBeenCalledWith('restaurant_page_order.list_order', 'ASC');
      expect(result).toEqual(rows);
    });

    it('should throw a 500 HttpException on a query error', async () => {
      const createQueryBuilder = jest.fn().mockImplementation(() => {
        throw new Error('boom');
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ createQueryBuilder });

      await expect(pageOrderModel.fetchByRestaurantID(RESTAURANT_ID)).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('replaceForRestaurant', () => {
    it('should clear existing rows then insert the ordered set with list_order = index', async () => {
      const del = jest.fn().mockResolvedValue(undefined);
      const create = jest.fn().mockImplementation((_entity, obj) => obj);
      const save = jest.fn().mockImplementation((_entity, rows) => Promise.resolve(rows));
      const tx = { delete: del, create, save };
      const transaction = jest.fn().mockImplementation((cb: any) => cb(tx));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ transaction });

      const result = await pageOrderModel.replaceForRestaurant(RESTAURANT_ID, ['menu', 'events', 'contact']);

      expect(del).toHaveBeenCalledWith(RestaurantPageOrderEntity, { restaurant_id: RESTAURANT_ID });
      expect(create).toHaveBeenNthCalledWith(1, RestaurantPageOrderEntity, { restaurant_id: RESTAURANT_ID, page_key: 'menu', list_order: 0 });
      expect(create).toHaveBeenNthCalledWith(2, RestaurantPageOrderEntity, { restaurant_id: RESTAURANT_ID, page_key: 'events', list_order: 1 });
      expect(create).toHaveBeenNthCalledWith(3, RestaurantPageOrderEntity, { restaurant_id: RESTAURANT_ID, page_key: 'contact', list_order: 2 });
      expect(result).toHaveLength(3);
    });

    it('should clear rows and insert nothing when given an empty list', async () => {
      const del = jest.fn().mockResolvedValue(undefined);
      const create = jest.fn();
      const save = jest.fn();
      const tx = { delete: del, create, save };
      const transaction = jest.fn().mockImplementation((cb: any) => cb(tx));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ transaction });

      const result = await pageOrderModel.replaceForRestaurant(RESTAURANT_ID, []);

      expect(del).toHaveBeenCalledTimes(1);
      expect(save).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should throw a 500 HttpException when the transaction fails', async () => {
      const transaction = jest.fn().mockRejectedValueOnce(new Error('boom'));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ transaction });

      await expect(pageOrderModel.replaceForRestaurant(RESTAURANT_ID, ['menu'])).rejects.toMatchObject({ status: 500 });
    });
  });
});
