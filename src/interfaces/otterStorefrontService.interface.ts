import { OtterWebhookEvent } from '@interfaces/otterIntegration.interface';

/** Current storefront availability for a restaurant, as reported to the TapManager UI. */
export interface OtterStorefrontStatus {
  restaurantID: number;
  /** `false` means paused. */
  isAcceptingOrders: boolean;
  /** The connected Otter store id, for display/debugging. */
  otterStoreId: string;
}

export interface OtterStorefrontServiceInterface {
  /**
   * Partner-initiated pause/unpause (the "Pause in Partner" / "Unpause in Partner" certification
   * rows). Writes the local flag, then notifies Otter via `POST /v1/storefront/availability`.
   */
  setAvailabilityFromPartner: (restaurantID: number, isAcceptingOrders: boolean) => Promise<OtterStorefrontStatus>;

  /** Reads current availability without calling Otter. Backs the TapManager toggle's initial state. */
  getStorefrontStatus: (restaurantID: number) => Promise<OtterStorefrontStatus>;

  /**
   * Entry point for every `storefront.*` webhook. Dispatches to the pause/unpause handlers (the
   * "Pause in Otter" / "Unpause in Otter" rows) and to the get-availability / get-hours responders,
   * which Otter requires for Storefront to function at all.
   *
   * Unknown `storefront.*` subtypes are logged and ignored rather than thrown, matching how
   * `handleOtterWebhook` treats unrecognised events.
   */
  handleStorefrontEvent: (event: OtterWebhookEvent) => Promise<void>;
}
