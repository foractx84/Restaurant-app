import { ormConnection } from '@utils/dbUtils';
import DrinkItemModel from '@/models/drinkItem.model';
import { HttpException } from '@exceptions/HttpException';

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
    rawQuery: jest.fn(),
  };
});

const drinkItemModel = new DrinkItemModel();

describe('drinkItemModel', () => {
  const RESTAURANT_ID = 1;
  const DRINK_ITEM_ID = 6;
  const DRINK_ITEM = {
    menu_item_id: DRINK_ITEM_ID,
    menu_item_url_id: 'fgfd-453-fgdf',
    name: 'Test Item',
    description: 'Test description',
    image_url: null,
    category: 'drink',
    menu_section_id: 1,
    list_order: 0,
    created_at: '2022-02-02T02:44:11.950Z',
    updated_at: '2022-02-02T02:44:11.950Z',
    deleted: false,
    base_item_size_id: 50,
    is_hidden: false,
    is_featured: false,
  };

  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('getDrinkItemsByIDsAndRestaurantID', () => {
    it('should get drink items by ids and restaurant id successfully', async () => {
      const getRepository = jest.fn();
      const getMany = jest.fn();
      const andWhere3 = jest.fn(() => ({ getMany }));
      const andWhere2 = jest.fn(() => ({ andWhere: andWhere3 }));
      const andWhere1 = jest.fn(() => ({ andWhere: andWhere2 }));
      const where1 = jest.fn(() => ({ andWhere: andWhere1 }));
      const leftJoinAndSelect3 = jest.fn(() => ({ where: where1 }));
      const leftJoinAndSelect2 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect3 }));
      const leftJoinAndSelect1 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect: leftJoinAndSelect1,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      (getMany as jest.MockedFunction<any>).mockResolvedValueOnce([DRINK_ITEM]);

      getRepository.mockImplementation(() => createQueryBuilder);

      const result = await drinkItemModel.getDrinkItemsByIDsAndRestaurantID([DRINK_ITEM_ID], RESTAURANT_ID);
      expect(getMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([DRINK_ITEM]);
    });
    it('should throw HttpException 500 if an error occurs while getting drink items by ids and restaurant id', async () => {
      const REPOSITORY = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });

      try {
        await drinkItemModel.getDrinkItemsByIDsAndRestaurantID([DRINK_ITEM_ID], RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getDrinkItemsByRestaurantID', () => {
    it('should get drink items for restaurant id successfully', async () => {
      const getRepository = jest.fn();
      const getMany = jest.fn();
      const orderBy = jest.fn(() => ({ getMany }));
      const andWhere2 = jest.fn(() => ({ orderBy }));
      const andWhere1 = jest.fn(() => ({ andWhere: andWhere2 }));
      const where1 = jest.fn(() => ({ andWhere: andWhere1 }));
      const leftJoinAndSelect3 = jest.fn(() => ({ where: where1 }));
      const leftJoinAndSelect2 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect3 }));
      const leftJoinAndSelect1 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect: leftJoinAndSelect1,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      (getMany as jest.MockedFunction<any>).mockResolvedValueOnce([DRINK_ITEM]);

      getRepository.mockImplementation(() => createQueryBuilder);

      const result = await drinkItemModel.getDrinkItemsByRestaurantID(RESTAURANT_ID);
      expect(getMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([DRINK_ITEM]);
    });
    it('should throw HttpException 500 if an error occurs while getting drink items by restaurant id', async () => {
      const REPOSITORY = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });

      try {
        await drinkItemModel.getDrinkItemsByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
