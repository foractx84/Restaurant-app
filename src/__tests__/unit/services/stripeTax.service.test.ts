import StripeTaxModel from '@/models/stripeTax.model';
import StripeTaxService from '@/services/stripeTax.service';
import { TapManagerError } from '@exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/stripeTax.model', () => {
  const mockStripeTaxModel = {
    getStripeTaxCodes: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockStripeTaxModel) };
});

const mockStripeTaxModel = new StripeTaxModel();
const stripeTaxService = new StripeTaxService(mockStripeTaxModel);

describe('stripeTaxService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('getStripeTaxCodes', () => {
    it('should successfully get stripe tax rate codes', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({});
      await stripeTaxService.getStripeTaxCodes();

      expect(mockStripeTaxModel.getStripeTaxCodes).toHaveBeenCalledWith({});
    });
    it('should throw 500 HttpException if any error occurs while getting stripe tax rate codes', async () => {
      (mockStripeTaxModel.getStripeTaxCodes as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await stripeTaxService.getStripeTaxCodes();
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockStripeTaxModel.getStripeTaxCodes).toHaveBeenCalled();
    });
  });
});
