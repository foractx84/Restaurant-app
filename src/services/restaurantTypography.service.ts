import {
  DEFAULT_RESTAURANT_COLOR_SETTINGS,
  DEFAULT_RESTAURANT_FONT_SETTINGS,
  RESTAURANT_COLOR_SETTING_KEYS,
  RESTAURANT_FONT_SETTING_KEYS,
  RestaurantColorSettingKey,
  RestaurantFontSettingKey,
} from '@/constants/restaurantTypography.constants';
import { RestaurantTypographyEntity } from '@/entities/restaurantTypography.entity';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { FontsModelInterface } from '@/interfaces/fonts.interface';
import {
  RestaurantColorSettingsInterface,
  RestaurantColorSettingsResponseInterface,
  RestaurantFontSettingsInterface,
  RestaurantFontSettingsResponseInterface,
  RestaurantTypographyServiceInterface,
} from '@/interfaces/restaurantTypography.interface';
import RestaurantTypographyModel from '@/models/restaurantTypography.model';

function mergeStoredFontsWithDefaults(stored: unknown): RestaurantFontSettingsInterface {
  const base: RestaurantFontSettingsInterface = { ...DEFAULT_RESTAURANT_FONT_SETTINGS };
  if (!stored || typeof stored !== 'object') {
    return base;
  }
  const obj = stored as Record<string, { fontFamily?: string; color?: string }>;
  for (const key of RESTAURANT_FONT_SETTING_KEYS) {
    const slot = obj[key];
    if (slot && typeof slot.fontFamily === 'string' && typeof slot.color === 'string') {
      base[key] = { fontFamily: slot.fontFamily, color: slot.color };
    }
  }
  return base;
}

function mergeStoredColorsWithDefaults(stored: unknown): RestaurantColorSettingsInterface {
  const base: RestaurantColorSettingsInterface = { ...DEFAULT_RESTAURANT_COLOR_SETTINGS };
  if (!stored || typeof stored !== 'object') {
    return base;
  }
  const obj = stored as Record<string, { color?: string }>;
  for (const key of RESTAURANT_COLOR_SETTING_KEYS) {
    const slot = obj[key];
    if (slot && typeof slot.color === 'string') {
      base[key] = { color: slot.color };
    }
  }
  return base;
}

function assertCompleteFontSettings(fonts: RestaurantFontSettingsInterface): void {
  for (const key of RESTAURANT_FONT_SETTING_KEYS) {
    const slot = fonts[key as RestaurantFontSettingKey];
    if (!slot?.fontFamily || !slot?.color) {
      throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Missing font settings for key: ${key}`, key));
    }
  }
}

function assertCompleteColorSettings(colors: RestaurantColorSettingsInterface): void {
  for (const key of RESTAURANT_COLOR_SETTING_KEYS) {
    const slot = colors[key as RestaurantColorSettingKey];
    if (!slot?.color) {
      throw new HttpException(400, getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Missing color settings for key: ${key}`, key));
    }
  }
}

function assertFontFamiliesInAllowlist(fonts: RestaurantFontSettingsInterface, selectableTitles: Set<string>): void {
  for (const key of RESTAURANT_FONT_SETTING_KEYS) {
    const fontFamily = fonts[key as RestaurantFontSettingKey].fontFamily;
    if (!selectableTitles.has(fontFamily)) {
      throw new HttpException(
        400,
        getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Font family is not in the allowlist: ${fontFamily}`, key),
      );
    }
  }
}

class RestaurantTypographyService implements RestaurantTypographyServiceInterface {
  private model: RestaurantTypographyModel;
  private fontsModel: FontsModelInterface;
  private selectableFontTitlesCache: Set<string> | null = null;

  constructor(model: RestaurantTypographyModel, fontsModel: FontsModelInterface) {
    this.model = model;
    this.fontsModel = fontsModel;
  }

  private getSelectableFontTitles = async (): Promise<Set<string>> => {
    if (this.selectableFontTitlesCache) {
      return this.selectableFontTitlesCache;
    }
    const rows = await this.fontsModel.getSelectableFonts();
    this.selectableFontTitlesCache = new Set(rows.map(row => row.title));
    return this.selectableFontTitlesCache;
  };

  getFontSettings = async (restaurantID: number): Promise<RestaurantFontSettingsResponseInterface> => {
    const row = await this.model.findByRestaurantId(restaurantID);
    return { fonts: mergeStoredFontsWithDefaults(row?.fonts) };
  };

  getColorSettings = async (restaurantID: number): Promise<RestaurantColorSettingsResponseInterface> => {
    const row = await this.model.findByRestaurantId(restaurantID);
    return { colors: mergeStoredColorsWithDefaults(row?.colors) };
  };

  saveFontSettings = async (restaurantID: number, fonts: RestaurantFontSettingsInterface): Promise<RestaurantFontSettingsResponseInterface> => {
    assertCompleteFontSettings(fonts);
    const selectableTitles = await this.getSelectableFontTitles();
    assertFontFamiliesInAllowlist(fonts, selectableTitles);
    const existing = await this.model.findByRestaurantId(restaurantID);
    const entity: RestaurantTypographyEntity = {
      restaurant_id: restaurantID,
      fonts,
      colors: existing?.colors ?? null,
    };
    const saved = await this.model.save(entity);
    return { fonts: mergeStoredFontsWithDefaults(saved.fonts) };
  };

  saveColorSettings = async (restaurantID: number, colors: RestaurantColorSettingsInterface): Promise<RestaurantColorSettingsResponseInterface> => {
    assertCompleteColorSettings(colors);
    const existing = await this.model.findByRestaurantId(restaurantID);
    const entity: RestaurantTypographyEntity = {
      restaurant_id: restaurantID,
      fonts: existing?.fonts ?? DEFAULT_RESTAURANT_FONT_SETTINGS,
      colors,
    };
    const saved = await this.model.save(entity);
    return { colors: mergeStoredColorsWithDefaults(saved.colors) };
  };
}

export default RestaurantTypographyService;
