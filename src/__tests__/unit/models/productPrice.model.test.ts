import { HttpException } from '@exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import ProductPriceModel from '@/models/productPrice.model';

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

const productPriceModel = new ProductPriceModel();
describe('findProductPriceByStripePriceID', () => {
  const STRIPE_PRICE_ID = 'stripe price id';
  describe('findProductPriceByStripePriceID', () => {
    it('should successfully get product price entity by stripe price id', async () => {
      const getOne = jest.fn();
      const andWhere = jest.fn(() => ({ getOne }));
      const where = jest.fn(() => ({ andWhere }));
      const leftJoinAndSelect2 = jest.fn(() => ({ where }));
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

      await productPriceModel.findProductPriceByStripePriceID(STRIPE_PRICE_ID);

      expect(getOne).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 status code Database error if any error occurs while getting product price entity by stripe price id', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw new Error();
      });

      try {
        await productPriceModel.findProductPriceByStripePriceID(STRIPE_PRICE_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
