import { TapManagerError } from '@exceptions/HttpException';
import ProductPriceService from '@services/productPrice.service';
import ProductPriceModel from '@/models/productPrice.model';
import { ProductPriceEntity } from '@/entities/productPrice.entity';

jest.mock('@/models/productPrice.model', () => {
  const mockProductPriceModel = {
    findProductPriceByStripePriceID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProductPriceModel) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});

const mockProductPriceModel = new ProductPriceModel();
const productPriceService = new ProductPriceService(mockProductPriceModel);

describe('productPriceService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('getProductPriceByStripePriceID', () => {
    const PRICE_ID = 'stripe price id';
    it('should successfully get product price by stripe price id', async () => {
      const PRODUCT_PRICE: ProductPriceEntity = {
        product_price_id: 1,
        currency_code: 'USD',
        stripe_price_id: PRICE_ID,
      };
      (mockProductPriceModel.findProductPriceByStripePriceID as jest.MockedFunction<any>).mockResolvedValueOnce(PRODUCT_PRICE);

      const result = await productPriceService.getProductPriceByStripePriceID(PRICE_ID);

      expect(mockProductPriceModel.findProductPriceByStripePriceID).toHaveBeenCalledTimes(1);
      expect(result).toEqual(PRODUCT_PRICE);
    });
    it('should throw 500 HttpException if any error occurs while getting product price by stripe price id', async () => {
      (mockProductPriceModel.findProductPriceByStripePriceID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await productPriceService.getProductPriceByStripePriceID(PRICE_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockProductPriceModel.findProductPriceByStripePriceID).toHaveBeenCalled();
    });
  });
});
