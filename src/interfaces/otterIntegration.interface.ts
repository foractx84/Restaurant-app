import { NextFunction, Request, Response } from 'express';
import { Job } from 'pg-boss';
import { OtterOrgStore } from '@interfaces/otter.interface';

export interface OtterWebhookMetadata {
  storeId?: string;
  applicationId?: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
}

export interface OtterWebhookEvent {
  eventId: string;
  eventType: string;
  eventTime?: string;
  metadata: OtterWebhookMetadata;
  resourceHref?: string;
}

export interface OtterOAuthConnectResult {
  restaurantID: number;
  otterStoreId: string;
  brandId: string;
  storeName: string;
}

export interface OtterOAuthCallbackResult {
  /** True when a store was connected during this callback. */
  connected: boolean;
  connection?: OtterOAuthConnectResult;
  /** Present when multiple stores exist and none was selected via query params. */
  selectableStores?: Array<{ brandId: string; brandName: string; store: OtterOrgStore }>;
}

export interface OtterIntegrationControllerInterface {
  initWebhook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  authorize: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  oAuthCallback: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  triggerMenuSync: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  pushMenu: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

/** Result of pushing a restaurant's menu to Otter — `POST /v1/menus` returns immediately with a `PENDING` job. */
export interface OtterMenuPushResult {
  jobId: string;
  status: 'PENDING' | 'FAILED' | 'SUCCESS' | 'UNKNOWN';
}

/** pg-boss job payload for `QUEUES.OTTER_MENU_SYNC`. */
export interface OtterMenuSyncJob {
  eventId: string;
  restaurantID: number;
  otterStoreId: string;
}

export interface OtterIntegrationServiceInterface {
  handleOtterWebhook: (event: OtterWebhookEvent) => Promise<void>;
  /**
   * Completes organization onboarding after Otter redirects with an authorization code.
   * Optional `brandId` + `otterStoreId` select a specific store; otherwise the first store is used
   * when only one exists. When multiple stores exist and none is selected, returns the list for the
   * client to choose from (no restaurant is created yet).
   */
  handleOAuthWithAuthCode: (authCode: string, brandId?: string, otterStoreId?: string) => Promise<OtterOAuthCallbackResult>;
  /**
   * Connects a specific Otter store using a fresh authorization code (codes are single-use, so the
   * client must re-authorize or pass brandId/storeId on the initial callback).
   */
  connectStoreWithAuthCode: (authCode: string, brandId: string, otterStoreId: string) => Promise<OtterOAuthConnectResult>;
  /**
   * Fetches the store's current menu from Otter, diffs it against the last stored `'otter'` snapshot,
   * applies the minimal set of changes, and writes the new snapshot. No-ops (does not write a new
   * snapshot) when the hash is unchanged. Guarded by an advisory lock keyed on the Otter store id so
   * two overlapping triggers for the same store can't run concurrently.
   */
  processOtterMenuSyncJob: (jobs: Job<OtterMenuSyncJob>[]) => Promise<void>;
  /**
   * The pg-boss-independent core of `processOtterMenuSyncJob` — fetch, normalize, diff, apply, and
   * snapshot for a single restaurant/store, callable directly (not just as a queue job). Used by
   * `pushMenuToOtter` to force a fresh pull sync immediately before push, so push never re-sends a
   * stale availability status back to Otter.
   */
  syncOtterMenuForRestaurant: (restaurantID: number, otterStoreId: string) => Promise<void>;
  /** Enqueues an on-demand sync for a restaurant's connected Otter store. Throws if none is connected. */
  triggerManualMenuSync: (restaurantID: number) => Promise<{ enqueued: boolean }>;
  /**
   * Scheduled fallback (`QUEUES.OTTER_MENU_SYNC_SCAN`, hourly): enumerates every connected Otter store
   * and enqueues an `OTTER_MENU_SYNC` job for each, so a dropped/delayed webhook self-heals within the
   * hour instead of requiring someone to notice and manually resync.
   */
  processOtterMenuSyncScan: (jobs: Job<unknown>[]) => Promise<void>;
  /**
   * Pushes the restaurant's complete current menu to Otter (`POST /v1/menus`, full-replacement
   * semantics) and does a short bounded poll of the resulting async job for the common
   * fast-resolving case. Throws if the restaurant has no connected Otter store.
   */
  pushMenuToOtter: (restaurantID: number) => Promise<OtterMenuPushResult>;
}
