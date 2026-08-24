/** Values for the `external_party` column shared across integration-tagged tables (`menu_snapshots`, `restaurant_platform_integrations`). */
export const EXTERNAL_PARTY = {
  CHECKMATE: 'checkmate',
  OTTER: 'otter',
} as const;

export type ExternalParty = (typeof EXTERNAL_PARTY)[keyof typeof EXTERNAL_PARTY];
