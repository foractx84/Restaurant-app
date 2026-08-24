import { ormConnection } from '@utils/dbUtils';
import { TapManagerError } from '@exceptions/HttpException';
import { CountryEntity } from '@/entities/country.entity';
import CountryModel from '@/models/country.model';

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

const countryModel = new CountryModel();
describe('countryModel', () => {
  describe('getCountryByCountryName', () => {
    const mockModelResponse: CountryEntity[] = [
      {
        country_id: 1,
        name: 'Italian',
        addresses: [],
        abbreviation: 'US',
        currency_code: 'USD',
      },
    ];
    const COUNTRY_NAME = 'United States';
    it('should get country by name successfully', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      (findOne as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await countryModel.getCountryByCountryName(COUNTRY_NAME);

      expect(findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw HttpException 500 if an error occurs while getting country by name', async () => {
      const findOne = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await countryModel.getCountryByCountryName(COUNTRY_NAME);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
