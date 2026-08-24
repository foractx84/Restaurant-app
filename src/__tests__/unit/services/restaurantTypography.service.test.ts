import { DEFAULT_RESTAURANT_COLOR_SETTINGS, DEFAULT_RESTAURANT_FONT_SETTINGS } from '@/constants/restaurantTypography.constants';
import { FontCategory } from '@/enums/fontCategory';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { FontsModelInterface } from '@/interfaces/fonts.interface';
import {
  RestaurantColorSettingsInterface,
  RestaurantColorSettingsResponseInterface,
  RestaurantFontSettingsInterface,
  RestaurantFontSettingsResponseInterface,
} from '@/interfaces/restaurantTypography.interface';
import FontsModel from '@/models/fonts.model';
import RestaurantTypographyModel from '@/models/restaurantTypography.model';
import RestaurantTypographyService from '@/services/restaurantTypography.service';

jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger };
});
jest.mock('@/models/restaurantTypography.model', () => {
  const mockModel = {
    findByRestaurantId: jest.fn(),
    save: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockModel) };
});
jest.mock('@/models/fonts.model', () => {
  const mockFontsModel = {
    getSelectableFonts: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockFontsModel) };
});

const mockTypographyModel = new RestaurantTypographyModel();
const mockFontsModel = new FontsModel();
const restaurantTypographyService = new RestaurantTypographyService(mockTypographyModel, mockFontsModel as FontsModelInterface);

const selectableFonts = [
  { title: 'Inter', category: FontCategory.SANS, is_selectable: true, list_order: 1 },
  { title: 'Source Serif 4', category: FontCategory.SERIF, is_selectable: true, list_order: 2 },
  { title: 'Playfair Display', category: FontCategory.DISPLAY_SERIF, is_selectable: true, list_order: 11 },
];

const completeFonts = (): RestaurantFontSettingsInterface => ({
  navigation: { fontFamily: 'Inter', color: '#112233' },
  body: { fontFamily: 'Source Serif 4', color: '#111111' },
  pageHeaders: { fontFamily: 'Playfair Display', color: '#111111' },
  subheaders: { fontFamily: 'Playfair Display', color: '#111111' },
  menus: { fontFamily: 'Inter', color: '#111111' },
  menuSections: { fontFamily: 'Inter', color: '#111111' },
  menuItems: { fontFamily: 'Inter', color: '#111111' },
});

const completeColors = (): RestaurantColorSettingsInterface => ({
  navigationBackground: { color: '#000000' },
  websiteBackground: { color: '#112233' },
  onlineOrderingBackground: { color: '#445566' },
  onlineOrderingActiveSelections: { color: '#778899' },
});

describe('restaurantTypographyService', () => {
  const RESTAURANT_ID = 1;

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getFontSettings', () => {
    it('should return defaults when no row exists', async () => {
      (mockTypographyModel.findByRestaurantId as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      const result = await restaurantTypographyService.getFontSettings(RESTAURANT_ID);

      expect(mockTypographyModel.findByRestaurantId).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(result).toEqual({ fonts: DEFAULT_RESTAURANT_FONT_SETTINGS });
    });

    it('should merge stored fonts with defaults for missing slots', async () => {
      (mockTypographyModel.findByRestaurantId as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        fonts: {
          navigation: { fontFamily: 'Arial', color: '#112233' },
        },
      });

      const result = await restaurantTypographyService.getFontSettings(RESTAURANT_ID);

      expect(result.fonts.navigation).toEqual({ fontFamily: 'Arial', color: '#112233' });
      expect(result.fonts.body).toEqual(DEFAULT_RESTAURANT_FONT_SETTINGS.body);
    });
  });

  describe('saveFontSettings', () => {
    beforeEach(() => {
      (mockFontsModel.getSelectableFonts as jest.MockedFunction<any>).mockResolvedValue(selectableFonts);
    });

    it('should persist and return merged settings from the saved row', async () => {
      const fonts = completeFonts();
      const persistedFonts = {
        navigation: fonts.navigation,
        body: fonts.body,
      };
      (mockTypographyModel.findByRestaurantId as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (mockTypographyModel.save as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        fonts: persistedFonts,
      });

      const result: RestaurantFontSettingsResponseInterface = await restaurantTypographyService.saveFontSettings(RESTAURANT_ID, fonts);

      expect(mockFontsModel.getSelectableFonts).toHaveBeenCalled();
      expect(mockTypographyModel.save).toHaveBeenCalledWith({
        restaurant_id: RESTAURANT_ID,
        fonts,
        colors: null,
      });
      expect(result.fonts.navigation).toEqual(fonts.navigation);
      expect(result.fonts.body).toEqual(fonts.body);
      expect(result.fonts.pageHeaders).toEqual(DEFAULT_RESTAURANT_FONT_SETTINGS.pageHeaders);
    });

    it('should throw 400 when fontFamily is not in the allowlist', async () => {
      const fonts = completeFonts();
      fonts.navigation.fontFamily = 'Comic Sans MS';

      await expect(restaurantTypographyService.saveFontSettings(RESTAURANT_ID, fonts)).rejects.toMatchObject({
        status: 400,
      });
      expect(mockTypographyModel.save).not.toHaveBeenCalled();
    });

    it('should throw 400 when a slot is missing', async () => {
      const incomplete = completeFonts();
      delete (incomplete as Partial<RestaurantFontSettingsInterface>).menuItems;

      await expect(restaurantTypographyService.saveFontSettings(RESTAURANT_ID, incomplete as RestaurantFontSettingsInterface)).rejects.toMatchObject({
        status: 400,
      });
      expect(mockTypographyModel.save).not.toHaveBeenCalled();
    });

    it('should rethrow HttpException from the model', async () => {
      const fonts = completeFonts();
      (mockTypographyModel.save as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, 'Error'));
      });

      await expect(restaurantTypographyService.saveFontSettings(RESTAURANT_ID, fonts)).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('getColorSettings', () => {
    it('should return defaults when no row exists', async () => {
      (mockTypographyModel.findByRestaurantId as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      const result = await restaurantTypographyService.getColorSettings(RESTAURANT_ID);

      expect(result).toEqual({ colors: DEFAULT_RESTAURANT_COLOR_SETTINGS });
    });

    it('should merge stored colors with defaults for missing slots', async () => {
      (mockTypographyModel.findByRestaurantId as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        colors: {
          navigationBackground: { color: '#ABCDEF' },
        },
      });

      const result = await restaurantTypographyService.getColorSettings(RESTAURANT_ID);

      expect(result.colors.navigationBackground).toEqual({ color: '#ABCDEF' });
      expect(result.colors.websiteBackground).toEqual(DEFAULT_RESTAURANT_COLOR_SETTINGS.websiteBackground);
    });
  });

  describe('saveColorSettings', () => {
    it('should persist colors and preserve existing fonts', async () => {
      const colors = completeColors();
      const existingFonts = completeFonts();
      (mockTypographyModel.findByRestaurantId as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        fonts: existingFonts,
      });
      (mockTypographyModel.save as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        fonts: existingFonts,
        colors,
      });

      const result: RestaurantColorSettingsResponseInterface = await restaurantTypographyService.saveColorSettings(RESTAURANT_ID, colors);

      expect(mockTypographyModel.save).toHaveBeenCalledWith({
        restaurant_id: RESTAURANT_ID,
        fonts: existingFonts,
        colors,
      });
      expect(result.colors).toEqual(colors);
    });

    it('should throw 400 when a color slot is missing', async () => {
      const incomplete = completeColors();
      delete (incomplete as Partial<RestaurantColorSettingsInterface>).onlineOrderingActiveSelections;

      await expect(
        restaurantTypographyService.saveColorSettings(RESTAURANT_ID, incomplete as RestaurantColorSettingsInterface),
      ).rejects.toMatchObject({
        status: 400,
      });
      expect(mockTypographyModel.save).not.toHaveBeenCalled();
    });
  });
});
