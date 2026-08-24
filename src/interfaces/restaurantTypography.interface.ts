export interface RestaurantFontSlotInterface {
  fontFamily: string;
  color: string;
}

export interface RestaurantFontSettingsInterface {
  navigation: RestaurantFontSlotInterface;
  body: RestaurantFontSlotInterface;
  pageHeaders: RestaurantFontSlotInterface;
  subheaders: RestaurantFontSlotInterface;
  menus: RestaurantFontSlotInterface;
  menuSections: RestaurantFontSlotInterface;
  menuItems: RestaurantFontSlotInterface;
}

export interface RestaurantFontSettingsResponseInterface {
  fonts: RestaurantFontSettingsInterface;
}

export interface RestaurantColorSlotInterface {
  color: string;
}

export interface RestaurantColorSettingsInterface {
  navigationBackground: RestaurantColorSlotInterface;
  websiteBackground: RestaurantColorSlotInterface;
  onlineOrderingBackground: RestaurantColorSlotInterface;
  onlineOrderingActiveSelections: RestaurantColorSlotInterface;
}

export interface RestaurantColorSettingsResponseInterface {
  colors: RestaurantColorSettingsInterface;
}

export interface RestaurantTypographyServiceInterface {
  getFontSettings: (restaurantID: number) => Promise<RestaurantFontSettingsResponseInterface>;
  saveFontSettings: (restaurantID: number, fonts: RestaurantFontSettingsInterface) => Promise<RestaurantFontSettingsResponseInterface>;
  getColorSettings: (restaurantID: number) => Promise<RestaurantColorSettingsResponseInterface>;
  saveColorSettings: (restaurantID: number, colors: RestaurantColorSettingsInterface) => Promise<RestaurantColorSettingsResponseInterface>;
}

export type RestaurantFontSettingsPartial = Partial<RestaurantFontSettingsInterface>;
