/** Otter store lifecycle statuses used by `PUT /v1/stores/status`. */
export const OTTER_STORE_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  INVALID: 'INVALID',
} as const;

export type OtterStoreStatus = (typeof OTTER_STORE_STATUS)[keyof typeof OTTER_STORE_STATUS];
