import { getErrorPayload, HttpException, InternalErrorCode, TapManagerError } from '@exceptions/HttpException';
import { FontCategory } from '@/enums/fontCategory';
import { FontEntity } from '@/entities/font.entity';
import { FontsModelInterface, GetFontsResponseInterface } from '@/interfaces/fonts.interface';
import FontsModel from '@/models/fonts.model';
import FontsService from '@/services/fonts.service';

jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger };
});
jest.mock('@/models/fonts.model', () => {
  const mockFontsModel = {
    getSelectableFonts: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockFontsModel) };
});

const mockFontsModel = new FontsModel();
const fontsService = new FontsService(mockFontsModel);

describe('fontsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getFonts', () => {
    const mockModelResponse: FontEntity[] = [
      {
        title: 'Inter',
        category: FontCategory.SANS,
        usage_notes: 'Nav, buttons, checkout, menu line items',
        is_selectable: true,
        list_order: 1,
      },
      {
        title: 'Playfair Display',
        category: FontCategory.DISPLAY_SERIF,
        usage_notes: 'Restaurant name, section heroes',
        is_selectable: true,
        list_order: 11,
      },
    ];

    const EXPECTED: GetFontsResponseInterface = {
      fonts: [
        {
          title: 'Inter',
          category: FontCategory.SANS,
          usageNotes: 'Nav, buttons, checkout, menu line items',
          listOrder: 1,
        },
        {
          title: 'Playfair Display',
          category: FontCategory.DISPLAY_SERIF,
          usageNotes: 'Restaurant name, section heroes',
          listOrder: 11,
        },
      ],
    };

    it('should return selectable fonts mapped for the API', async () => {
      (mockFontsModel.getSelectableFonts as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await fontsService.getFonts();

      expect(mockFontsModel.getSelectableFonts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(EXPECTED);
    });

    it('should throw 500 HttpException if an unexpected error occurs', async () => {
      (mockFontsModel.getSelectableFonts as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error('db down');
      });

      await expect(fontsService.getFonts()).rejects.toMatchObject({ status: 500 });
      expect(mockFontsModel.getSelectableFonts).toHaveBeenCalledTimes(1);
    });

    it('should rethrow HttpException from the model', async () => {
      (mockFontsModel.getSelectableFonts as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, 'Error'));
      });

      try {
        await fontsService.getFonts();
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockFontsModel.getSelectableFonts).toHaveBeenCalledTimes(1);
    });
  });
});
