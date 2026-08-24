import { TapManagerError } from '@exceptions/HttpException';
import StripeTaxModel from '@/models/stripeTax.model';

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

const stripeTaxModel = new StripeTaxModel();
describe('stripeTaxModel', () => {
  describe('getStripeTaxCodes', () => {
    it('should get stripe tax rate codes', async () => {
      const find = jest.fn();
      const REPOSITORY: any = {
        find,
      };

      await stripeTaxModel.getStripeTaxCodes(REPOSITORY);
      expect(find).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while getting stripe tax rate codes', async () => {
      const findOne = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        findOne,
      };

      try {
        await stripeTaxModel.getStripeTaxCodes(REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
