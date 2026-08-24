export const QUEUES = {
  CHECKMATE_MENU_SYNC: 'checkmate.menu-sync',
  OTTER_MENU_SYNC: 'otter.menu-sync',
  /** Scheduled fallback: fires hourly, enumerates every connected Otter store, and enqueues an OTTER_MENU_SYNC job for each. */
  OTTER_MENU_SYNC_SCAN: 'otter.menu-sync-scan',
} as const;
