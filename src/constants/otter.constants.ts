/** Otter store lifecycle statuses used by `PUT /v1/stores/status`. */
export const OTTER_STORE_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  INVALID: 'INVALID',
} as const;

export type OtterStoreStatus = (typeof OTTER_STORE_STATUS)[keyof typeof OTTER_STORE_STATUS];

export const OTTER_STOREFRONT_EVENT = {
  PAUSE_STORE: 'storefront.pause_store',
  UNPAUSE_STORE: 'storefront.unpause_store',
  GET_STORE_AVAILABILITY: 'storefront.get_store_availability',
  GET_STORE_HOURS: 'storefront.get_store_hours',
} as const;

export type OtterStorefrontEventType =
  (typeof OTTER_STOREFRONT_EVENT)[keyof typeof OTTER_STOREFRONT_EVENT];