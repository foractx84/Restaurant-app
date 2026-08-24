import ItemSizeTypeModel from '@/models/itemSizeType.model';
import ItemSizeService from '@services/itemSize.service';
import { AggregateModelInterface } from '@interfaces/aggregate.interface';
import AggregateService from '@services/aggregate.service';
import { ItemSize, ItemSizeResponse } from '@interfaces/itemSize.interface';
import { ormConnection } from '@utils/dbUtils';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';

jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
jest.mock('@/services/aggregate.service', () => {
  const mockAggregateService = {
    createMenuItemSizes: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockAggregateService) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/itemSizeType.model', () => {
  const mockItemSizeTypeModel = {
    insertItemSizeType: jest.fn(),
    getItemSizeType: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockItemSizeTypeModel) };
});

const mockAggregateService = new AggregateService({} as AggregateModelInterface);
const mockItemSizeTypeModel = new ItemSizeTypeModel();
const itemSizeService = new ItemSizeService(mockAggregateService, mockItemSizeTypeModel);

describe('itemSizeService', () => {
  afterEach(() => {
    jest.resetAllMocks();
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('createAllItemSizesForMenuItem', () => {
    const MENU_ITEM_ID = 1;
    const itemSizes: ItemSize[] = [
      {
        label: 'small',
        price: 200,
        priceOverride: '',
      },
      {
        label: 'large',
        price: 500,
        priceOverride: '',
      },
    ];
    const expectedResponse: ItemSizeResponse[] = [
      {
        id: 123,
        label: 'small',
        price: 200,
        priceOverride: '',
      },
      {
        id: 124,
        label: 'large',
        price: 500,
        priceOverride: '',
      },
    ];
    it('should successfully create item size types for all item sizes provided, with no repository provided', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(REPOSITORY);
      (mockItemSizeTypeModel.insertItemSizeType as jest.MockedFunction<any>)
        .mockResolvedValueOnce({
          id: 123,
          label: 'small',
          price: 200,
          price_override: '',
        })
        .mockResolvedValueOnce({
          id: 124,
          label: 'large',
          price: 500,
          price_override: '',
        });

      const result = await itemSizeService.createAllItemSizesForMenuItem(MENU_ITEM_ID, itemSizes);

      expect(mockItemSizeTypeModel.getItemSizeType).toHaveBeenNthCalledWith(1, 'small', 200, '', expect.any(Object));
      expect(mockItemSizeTypeModel.insertItemSizeType).toHaveBeenNthCalledWith(1, 'small', 200, '', expect.any(Object));
      expect(mockItemSizeTypeModel.getItemSizeType).toHaveBeenNthCalledWith(2, 'large', 500, '', expect.any(Object));
      expect(mockItemSizeTypeModel.insertItemSizeType).toHaveBeenNthCalledWith(2, 'large', 500, '', expect.any(Object));
      expect(mockAggregateService.createMenuItemSizes).toHaveBeenCalledWith(MENU_ITEM_ID, [123, 124], expect.any(Object));

      expect(result).toEqual(expectedResponse);
    });
    it('should successfully create item size types for all item sizes provided, with repository provided', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      (mockItemSizeTypeModel.insertItemSizeType as jest.MockedFunction<any>)
        .mockResolvedValueOnce({
          id: 123,
          label: 'small',
          price: 200,
          price_override: '',
        })
        .mockResolvedValueOnce({
          id: 124,
          label: 'large',
          price: 500,
          price_override: '',
        });

      const result = await itemSizeService.createAllItemSizesForMenuItem(MENU_ITEM_ID, itemSizes, REPOSITORY);

      expect(mockItemSizeTypeModel.getItemSizeType).toHaveBeenNthCalledWith(1, 'small', 200, '', expect.any(Object));
      expect(mockItemSizeTypeModel.insertItemSizeType).toHaveBeenNthCalledWith(1, 'small', 200, '', expect.any(Object));
      expect(mockItemSizeTypeModel.getItemSizeType).toHaveBeenNthCalledWith(2, 'large', 500, '', expect.any(Object));
      expect(mockItemSizeTypeModel.insertItemSizeType).toHaveBeenNthCalledWith(2, 'large', 500, '', expect.any(Object));
      expect(mockAggregateService.createMenuItemSizes).toHaveBeenCalledWith(MENU_ITEM_ID, [123, 124], expect.any(Object));

      expect(result).toEqual(expectedResponse);
    });
    it('should throw already thrown HttpException while creating item size types for all item sizes provided', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      (mockItemSizeTypeModel.getItemSizeType as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await itemSizeService.createAllItemSizesForMenuItem(MENU_ITEM_ID, itemSizes, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemSizeTypeModel.getItemSizeType).toHaveBeenNthCalledWith(1, 'small', 200, '', expect.any(Object));
      expect(mockItemSizeTypeModel.insertItemSizeType).not.toHaveBeenCalled();
      expect(mockAggregateService.createMenuItemSizes).not.toHaveBeenCalled();
    });
    it('should throw HttpException if any error occurs while creating item size types for all item sizes provided', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      (mockItemSizeTypeModel.getItemSizeType as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw Error;
      });

      try {
        await itemSizeService.createAllItemSizesForMenuItem(MENU_ITEM_ID, itemSizes, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemSizeTypeModel.getItemSizeType).toHaveBeenNthCalledWith(1, 'small', 200, '', expect.any(Object));
      expect(mockItemSizeTypeModel.insertItemSizeType).not.toHaveBeenCalled();
      expect(mockAggregateService.createMenuItemSizes).not.toHaveBeenCalled();
    });
  });
  describe('createItemSizeType', () => {
    it('should successfully return item size type for existing type when attempting creation, with no repository provided', async () => {
      const LABEL = 'default';
      const PRICE = 100;
      const expectedResponse: ItemSizeResponse = {
        id: 123,
        label: LABEL,
        price: PRICE,
        priceOverride: '',
      };
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(REPOSITORY);
      (mockItemSizeTypeModel.getItemSizeType as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: 123,
        label: LABEL,
        price: PRICE,
        price_override: '',
      });

      const result = await itemSizeService.createItemSizeType(LABEL, PRICE, '');

      expect(mockItemSizeTypeModel.getItemSizeType).toHaveBeenCalledWith(LABEL, PRICE, '', expect.any(Object));
      expect(mockItemSizeTypeModel.insertItemSizeType).not.toHaveBeenCalled();

      expect(result).toEqual(expectedResponse);
    });
    it('should successfully return item size type for existing type when attempting creation, with repository provided', async () => {
      const LABEL = 'default';
      const PRICE = 100;
      const expectedResponse: ItemSizeResponse = {
        id: 123,
        label: LABEL,
        price: PRICE,
        priceOverride: '',
      };
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      (mockItemSizeTypeModel.getItemSizeType as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: 123,
        label: LABEL,
        price: PRICE,
        price_override: '',
      });

      const result = await itemSizeService.createItemSizeType(LABEL, PRICE, '', REPOSITORY);

      expect(mockItemSizeTypeModel.getItemSizeType).toHaveBeenCalledWith(LABEL, PRICE, '', expect.any(Object));
      expect(mockItemSizeTypeModel.insertItemSizeType).not.toHaveBeenCalled();

      expect(result).toEqual(expectedResponse);
    });
    it('should successfully create item size type with price override included (set price to 0)', async () => {
      const LABEL = 'default';
      const PRICE = 100;
      const PRICE_OVERRIDE = 'Market Price';
      const expectedResponse: ItemSizeResponse = {
        id: 123,
        label: LABEL,
        price: 0,
        priceOverride: PRICE_OVERRIDE,
      };
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(REPOSITORY);
      (mockItemSizeTypeModel.insertItemSizeType as jest.MockedFunction<any>).mockResolvedValueOnce({
        id: 123,
        label: LABEL,
        price: 0,
        price_override: PRICE_OVERRIDE,
      });

      const result = await itemSizeService.createItemSizeType(LABEL, PRICE, PRICE_OVERRIDE);

      expect(mockItemSizeTypeModel.getItemSizeType).toHaveBeenCalledWith(LABEL, 0, PRICE_OVERRIDE, expect.any(Object));
      expect(mockItemSizeTypeModel.insertItemSizeType).toHaveBeenCalledWith(LABEL, 0, PRICE_OVERRIDE, expect.any(Object));

      expect(result).toEqual(expectedResponse);
    });
    it('should throw already thrown HttpException while creating item size type with price override included (set price to 0)', async () => {
      const LABEL = 'default';
      const PRICE = 100;
      const PRICE_OVERRIDE = 'Market Price';

      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await itemSizeService.createItemSizeType(LABEL, PRICE, PRICE_OVERRIDE);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemSizeTypeModel.getItemSizeType).not.toHaveBeenCalled();
      expect(mockItemSizeTypeModel.insertItemSizeType).not.toHaveBeenCalled();
    });
    it('should throw HttpException if any error occurs while creating item size type with price override included (set price to 0)', async () => {
      const LABEL = 'default';
      const PRICE = 100;
      const PRICE_OVERRIDE = 'Market Price';

      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw new Error();
      });

      try {
        await itemSizeService.createItemSizeType(LABEL, PRICE, PRICE_OVERRIDE);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockItemSizeTypeModel.getItemSizeType).not.toHaveBeenCalled();
      expect(mockItemSizeTypeModel.insertItemSizeType).not.toHaveBeenCalled();
    });
  });
});
