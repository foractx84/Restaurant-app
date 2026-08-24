import { AxiosInstance } from 'axios';

export interface CheckmateServiceInterface {
  activateLocation: (accessToken: string) => Promise<void>;
  fetchAccessCode: (authCode: string) => Promise<GetAccessTokenResponse>;
  fetchLocationInfo: (accessToken: string) => Promise<GetLocationResponse>;
  fetchMenu: (client: AxiosInstance, locationID: number) => Promise<CheckmateMenu[]>;
}

export interface GetAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
}

export interface GetLocationResponse {
  data: LocationInfo;
}

export interface LocationInfo {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  url: string;
  brand: string;
  time_zone: string;
  pos: string;
  phone_number: string;
}

export interface CheckmateMenu {
  id: string;
  meta: CheckmateMenuMeta;
  name: string;
  prep_time_average_minutes?: number;
  hours: CheckmateMenuHours;
  location: CheckmateMenuLocationInfo;
  description: string;
  currency_name: string;
  sections: CheckmateMenuSection[];
}

export interface CheckmateMenuMeta {
  allows_item_notes: boolean;
  allows_order_notes: boolean;
  allows_mod_quantities?: boolean;
}

export type CheckMateMenuHour = { start_time: string; end_time: string };

export interface CheckmateMenuHours {
  monday?: CheckMateMenuHour[];
  tuesday?: CheckMateMenuHour[];
  wednesday?: CheckMateMenuHour[];
  thursday?: CheckMateMenuHour[];
  friday?: CheckMateMenuHour[];
  saturday?: CheckMateMenuHour[];
  sunday?: CheckMateMenuHour[];
}

export interface CheckmateMenuLocationInfo {
  id: number;
  name: string;
}

export interface CheckmateMenuSection {
  id: string;
  name: string;
  description: string;
  items: CheckmateMenuItem[];
}

export interface CheckmateMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  tax_rate: number;
  image_urls: { link: string }[];
  suspend_until: string;
  modifier_groups?: CheckmateModifierGroup[];
  nutritional_info?: string;
  is_alcohol?: boolean;
}

export interface CheckmateModifierGroup {
  id: string;
  name: string;
  description?: string;
  maximum_amount?: number;
  minimum_amount?: number;
  allow_modifier_multiple_quantity?: boolean;
  modifiers?: CheckmateModifier[];
}

export interface CheckmateModifier {
  id: string;
  name: string;
  price: number;
  description?: string;
  suspend_until: string;
  modifier_groups: CheckmateModifierGroup[];
  nutritional_info?: string;
  is_alcohol?: boolean;
}
