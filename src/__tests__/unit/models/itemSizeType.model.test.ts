import ItemSizeTypeModel from '@/models/itemSizeType.model';
import { ormConnection } from '@utils/dbUtils';
import { MenuItemSizeTypesDBInterface } from '@interfaces/itemSize.interface';
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
  };
});

const itemSizeTypeModel = new ItemSizeTypeModel();
describe('itemSizeTypeModel', () => {
  const LABEL = 'TEST';
  const PRICE = 100;
  const PRICE_OVERRIDE = 'Market Price';
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('insertItemSizeType', () => {
    it('should insert item size type successfully', async () => {
      const expectedResponse: MenuItemSizeTypesDBInterface = {
        id: 432,
        label: LABEL,
        price: PRICE,
        price_override: PRICE_OVERRIDE,
      };

      const insert = jest.fn().mockResolvedValue({ raw: [expectedResponse] });
      const CUSTOM_REPOSITORY: any = {
        insert,
      };
      const REPOSITORY: any = {
        getCustomRepository: () => CUSTOM_REPOSITORY,
      };

      const result = await itemSizeTypeModel.insertItemSizeType(LABEL, PRICE, PRICE_OVERRIDE, REPOSITORY);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw a HttpException if any error occurs while inserting item size type', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const CUSTOM_REPOSITORY: any = {
        insert,
      };
      const REPOSITORY: any = {
        getCustomRepository: () => CUSTOM_REPOSITORY,
      };

      try {
        await itemSizeTypeModel.insertItemSizeType(LABEL, PRICE, PRICE_OVERRIDE, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(insert).toHaveBeenCalledTimes(1);
    });
  });
  describe('getItemSizeType', () => {
    it('should successfully get item size type', async () => {
      const expectedResponse: MenuItemSizeTypesDBInterface = {
        id: 100,
        label: LABEL,
        price: PRICE,
        price_override: PRICE_OVERRIDE,
      };
      const findOne = jest.fn().mockResolvedValueOnce(expectedResponse);
      const REPOSITORY: any = {
        findOne,
      };

      await itemSizeTypeModel.getItemSizeType(LABEL, PRICE, PRICE_OVERRIDE, REPOSITORY);

      expect(findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while getting item size type', async () => {
      const findOne = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        findOne,
      };

      try {
        await itemSizeTypeModel.getItemSizeType(LABEL, PRICE, PRICE_OVERRIDE, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(findOne).toHaveBeenCalledTimes(1);
    });
  });
});
