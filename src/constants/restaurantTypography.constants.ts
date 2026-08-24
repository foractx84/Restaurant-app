import { RestaurantColorSettingsInterface, RestaurantFontSettingsInterface } from '@/interfaces/restaurantTypography.interface';

/** Keys aligned with TapTab Design → Fonts (Figma). */
export const RESTAURANT_FONT_SETTING_KEYS = ['navigation', 'body', 'pageHeaders', 'subheaders', 'menus', 'menuSections', 'menuItems'] as const;

export type RestaurantFontSettingKey = (typeof RESTAURANT_FONT_SETTING_KEYS)[number];

/** Keys aligned with TapTab Design → Colors (Figma). */
export const RESTAURANT_COLOR_SETTING_KEYS = [
  'navigationBackground',
  'websiteBackground',
  'onlineOrderingBackground',
  'onlineOrderingActiveSelections',
] as const;

export type RestaurantColorSettingKey = (typeof RESTAURANT_COLOR_SETTING_KEYS)[number];

const DEFAULT_SLOT = {
  fontFamily: 'Inter',
  color: '#111111',
} as const;

const DEFAULT_COLOR_SLOT = {
  color: '#000000',
} as const;

/** Defaults when no row exists yet (matches design baseline). */
export const DEFAULT_RESTAURANT_FONT_SETTINGS: RestaurantFontSettingsInterface = {
  navigation: { ...DEFAULT_SLOT },
  body: { ...DEFAULT_SLOT },
  pageHeaders: { ...DEFAULT_SLOT },
  subheaders: { ...DEFAULT_SLOT },
  menus: { ...DEFAULT_SLOT },
  menuSections: { ...DEFAULT_SLOT },
  menuItems: { ...DEFAULT_SLOT },
};

export const DEFAULT_RESTAURANT_COLOR_SETTINGS: RestaurantColorSettingsInterface = {
  navigationBackground: { ...DEFAULT_COLOR_SLOT },
  websiteBackground: { ...DEFAULT_COLOR_SLOT },
  onlineOrderingBackground: { ...DEFAULT_COLOR_SLOT },
  onlineOrderingActiveSelections: { ...DEFAULT_COLOR_SLOT },
};
