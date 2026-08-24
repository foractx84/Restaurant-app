import { getErrorPayload, HttpException, InternalErrorCode, TapManagerError } from '@exceptions/HttpException';
import TitlesModel from '@/models/titles.model';
import TitlesService from '@services/titles.service';
import { TitleEntity } from '@/entities/title.entity';
import { GetTitlesResponseInterface } from '@interfaces/titles.interface';

jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/titles.model', () => {
  const mockTitlesModel = {
    getTitles: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockTitlesModel) };
});

const mockTitlesModel = new TitlesModel();
const titlesService = new TitlesService(mockTitlesModel);

describe('titlesService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getTitles', () => {
    const mockModelResponse: TitleEntity[] = [
      {
        id: 1,
        name: 'Owner',
      },
      {
        id: 2,
        name: 'Manager',
      },
    ];
    const EXPECTED: GetTitlesResponseInterface = {
      titles: [
        {
          titleID: 1,
          name: 'Owner',
        },
        {
          titleID: 2,
          name: 'Manager',
        },
      ],
    };
    it('should successfully get all titles', async () => {
      (mockTitlesModel.getTitles as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await titlesService.getTitles();
      expect(mockTitlesModel.getTitles).toHaveBeenCalledTimes(1);
      expect(result).toEqual(EXPECTED);
    });
    it('should throw 500 Bad Request HttpException if any error exists while fetching titles', async () => {
      (mockTitlesModel.getTitles as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await titlesService.getTitles();
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockTitlesModel.getTitles).toHaveBeenCalledTimes(1);
    });
    it('should throw 400 Missing Input HttpException if error occurs while fetching titles', async () => {
      (mockTitlesModel.getTitles as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, 'Error'));
      });

      try {
        await titlesService.getTitles();
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0]['code']).toEqual(2222);
      }
    });
  });
});
