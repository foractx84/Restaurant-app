import { getErrorPayload, HttpException, InternalErrorCode, TapManagerError } from '@exceptions/HttpException';
import CountryModel from '@/models/country.model';
import CountryService from '@/services/country.service';
import { CountryEntity } from '@/entities/country.entity';

jest.mock('@/models/country.model', () => {
  const mockCountryModel = {
    getCountryByCountryName: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockCountryModel) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});

const mockCountryModel = new CountryModel();
const countryService = new CountryService(mockCountryModel);

describe('countryService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('checkCountryExistsByName', () => {
    const mockModelResponse: CountryEntity[] = [
      {
        country_id: 1,
        name: 'United States',
        abbreviation: 'US',
        currency_code: 'USD',
        addresses: [],
      },
    ];
    const COUNTRY = 'United States';
    it('should successfully validate country exists by country name', async () => {
      (mockCountryModel.getCountryByCountryName as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await countryService.checkCountryExistsByName(COUNTRY);

      expect(mockCountryModel.getCountryByCountryName).toHaveBeenCalledWith(COUNTRY);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw 400 Bad Request HttpException if country does not exist for country name', async () => {
      try {
        await countryService.checkCountryExistsByName(COUNTRY);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockCountryModel.getCountryByCountryName).toHaveBeenCalledWith(COUNTRY);
    });
    it('should throw HttpException if HttpException error occurs while validating country exists by country name', async () => {
      (mockCountryModel.getCountryByCountryName as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await countryService.checkCountryExistsByName(COUNTRY);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockCountryModel.getCountryByCountryName).toHaveBeenCalledWith(COUNTRY);
    });
    it('should throw 500 Bad Request HttpException if any error exists while validating country exists by country name', async () => {
      (mockCountryModel.getCountryByCountryName as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await countryService.checkCountryExistsByName(COUNTRY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockCountryModel.getCountryByCountryName).toHaveBeenCalledWith(COUNTRY);
    });
  });
});
