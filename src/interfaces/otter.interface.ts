import type { OtterStoreStatus } from '@constants/otter.constants';

export interface OtterTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  /** Present for authorization-code tokens; client-credentials typically omit this. */
  refresh_token?: string;
}

export interface OtterAuthServiceInterface {
  acquireAndStoreToken: () => Promise<string>;
  getValidAccessToken: () => Promise<string>;
}

export interface OtterOrganization {
  id: string;
  name: string;
}

export interface OtterBrand {
  id: string;
  name: string;
}

export interface OtterOrgStoreAddress {
  fullAddress?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  addressLines?: string[];
}

export interface OtterOrgStore {
  id: string;
  name: string;
  address?: OtterOrgStoreAddress;
}

export interface OtterPaginated<T> {
  items: T[];
  offsetToken?: string;
}

export interface OtterStoreConnection {
  storeId: string;
}

/**
 * Organization-domain helpers used to onboard a store via OAuth authorization-code + connection API.
 * @see https://developer-guides.tryotter.com/docs/organization-integrations-onboarding-flow/
 */
export interface OtterOrganizationServiceInterface {
  /** Lists brands then stores for the authorized user. */
  listSelectableStores: (accessToken: string) => Promise<Array<{ brandId: string; brandName: string; store: OtterOrgStore }>>;
  /**
   * Ensures a connection exists between the Otter store and the TapTab restaurant id (partner storeId).
   * Replaces an existing connection when the partner storeId differs.
   */
  connectStore: (accessToken: string, brandId: string, otterStoreId: string, partnerStoreId: string) => Promise<void>;
}

export interface OtterErrorDetail {
  attribute: string;
  message: string;
}

export interface OtterErrorMessage {
  message: string;
  details?: OtterErrorDetail[];
}

/** @deprecated Account-pairing onboarding; prefer organization connection flow. */
export interface OtterStoreOnboardingResult {
  success: boolean;
  storeId?: string;
  errorMessage?: OtterErrorMessage | null;
}

/** @deprecated Account-pairing onboarding; prefer organization connection flow. */
export interface OtterStoreStatusUpdate {
  status: OtterStoreStatus;
  message?: string;
}

/**
 * Menu-domain types for `GET /v1/menus` (scope `menus.read`). Otter returns the store's whole menu
 * as flat maps keyed by entity id, not a nested tree — `menus`/`categories`/`items`/`modifierGroups`
 * reference each other by id array, and a "modifier" is itself just an item referenced from a
 * ModifierGroup's `itemIds`. Only the fields the normalizer needs are modeled here.
 */
export interface OtterMoney {
  currencyCode: string;
  amount: number;
}

export interface OtterHourInterval {
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  fromHour: number;
  fromMinute: number;
  toHour: number;
  toMinute: number;
}

export interface OtterHours {
  intervals: OtterHourInterval[];
}

export interface OtterItemStatus {
  saleStatus: 'FOR_SALE' | 'INDEFINITELY_NOT_FOR_SALE' | 'TEMPORARILY_NOT_FOR_SALE';
  suspendedUntil?: string;
}

export interface OtterMenuItemPOS {
  id: string;
  name: string;
  price: OtterMoney;
  status: OtterItemStatus;
  description?: string;
  /** Ids of this item's modifier groups. Present on both real items and modifier "items" alike. */
  modifierGroupIds?: string[];
}

export interface OtterModifierGroupPOS {
  id: string;
  name: string;
  /** Ids of the modifiers (items) belonging to this group. */
  itemIds?: string[];
  minimumSelections?: number;
  maximumSelections?: number;
  maxPerModifierSelectionQuantity?: number;
  description?: string;
}

export interface OtterCategory {
  id: string;
  name: string;
  description?: string;
  itemIds?: string[];
}

export interface OtterMenuPOS {
  id: string;
  name: string;
  categoryIds?: string[];
  description?: string;
  hours?: OtterHours;
}

export interface OtterMenus {
  categories: Record<string, OtterCategory>;
  modifierGroups: Record<string, OtterModifierGroupPOS>;
  menus?: Record<string, OtterMenuPOS>;
  items?: Record<string, OtterMenuItemPOS>;
}

/**
 * Menu-domain types for `POST /v1/menus` (scope `menus.upsert`) — the reverse of `GET /v1/menus`:
 * TapTab pushes its own menu into Otter. Same flat, id-indexed shape as the read side.
 * "Upsert" here is full-replacement semantics: Otter deletes any customer-menu entity omitted from
 * the request, so a push must always include the complete desired menu state.
 *
 * @see https://connect.tryotter.com/docs/menus-manager-integrations-operations/
 */
export interface OtterCategoryUpsert {
  id: string;
  name: string;
  description?: string;
  itemIds?: string[];
}

export interface OtterModifierGroupUpsert {
  id: string;
  name: string;
  description?: string;
  itemIds?: string[];
  minimumSelections?: number;
  maximumSelections?: number;
  maxPerModifierSelectionQuantity?: number;
}

export interface OtterMenuUpsert {
  id: string;
  name: string;
  description?: string;
  categoryIds?: string[];
  hours?: OtterHours;
}

export interface OtterItemUpsert {
  id: string;
  name: string;
  description: string;
  price: OtterMoney;
  status: OtterItemStatus;
  modifierGroupIds?: string[];
}

export interface OtterMenusUpsertRequest {
  menus: Record<string, OtterMenuUpsert>;
  categories: Record<string, OtterCategoryUpsert>;
  modifierGroups: Record<string, OtterModifierGroupUpsert>;
  items: Record<string, OtterItemUpsert>;
}

export interface OtterJobReference {
  id: string;
  status: 'PENDING' | 'FAILED' | 'SUCCESS' | 'UNKNOWN';
}

/** Response for both `POST /v1/menus` (202) and `GET /v1/menus/jobs/{jobId}`. */
export interface OtterMenuAsynchronousJob {
  jobReference: OtterJobReference;
  jobType?: string;
}

export type OtterStoreState =
  | 'OPEN'
  | 'OFF_HOUR'
  | 'SERVICE_PROVIDER_PAUSED'
  | 'OPERATOR_PAUSED'
  | 'SERVICE_PROVIDER_PAUSED_COURIERS_UNAVAILABLE'
  | 'STORE_UNAVAILABLE'
  | 'HOLIDAY_HOUR'
  | 'MENU_UNAVAILABLE'
  | 'SERVICE_PROVIDER_PAUSED_MISCONFIGURED'
  | 'OPEN_FOR_PICKUP_ONLY'
  | 'OPEN_FOR_DELIVERY_ONLY'
  | 'CLOSED_FOR_UNDETERMINED_REASON';

export type OtterStorefrontOperationStatus =
  | 'SUCCEEDED'
  | 'INTERNAL_ERROR'
  | 'AUTHENTICATION_FAILURE'
  | 'AUTHORIZATION_FAILURE'
  | 'UNKNOWN_FAILURE'
  | 'INVALID_STORE_STATE'
  | 'INVALID_STORE_CONFIGURATION'
  | 'OPERATION_NOT_SUPPORTED'
  | 'IGNORED_ALREADY_IN_REQUESTED_STATE'
  | 'INVALID_REQUEST';

export interface OtterStorefrontEventResultMetadata {
  operationStatus: OtterStorefrontOperationStatus;
  additionalInformation?: string | null;
  operationFinishedAt: string;
}

export interface OtterStoreAvailabilityRequest {
  storeState: OtterStoreState | null;
  statusChangedAt: string | null;
  eventResultMetadata: OtterStorefrontEventResultMetadata;
}

export interface OtterPauseStoreResultRequest {
  closureId: string;
  eventResultMetadata: OtterStorefrontEventResultMetadata;
}

export interface OtterUnpauseStoreResultRequest {
  eventResultMetadata: OtterStorefrontEventResultMetadata;
}

export interface OtterStoreHoursTimeRange {
  startTime: string;
  endTime: string;
}

export interface OtterStoreRegularHours {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  timeRanges: OtterStoreHoursTimeRange[];
}

export interface OtterStoreHoursGroup {
  regularHours: OtterStoreRegularHours[];
  specialHours: Array<Record<string, unknown>>;
}

export interface OtterStoreHoursConfiguration {
  deliveryHours?: OtterStoreHoursGroup;
  pickupHours?: OtterStoreHoursGroup;
  timezone: string;
}

export interface OtterStoreHoursRequest {
  storeHoursConfiguration: OtterStoreHoursConfiguration;
  statusChangedAt: string | null;
  eventResultMetadata: OtterStorefrontEventResultMetadata;
}