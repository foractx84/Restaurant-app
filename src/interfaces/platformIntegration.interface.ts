import { RestaurantEntity } from '@entities/restaurant.entity';
import { EntityManager } from 'typeorm';
import { PlatformIntegrationEntity } from '@entities/platformIntegration.entity';

export interface PlatformIntegrationServiceInterface {
  createPlatformIntegration: (
    restaurantID: number | null,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    platform: string,
    locationID: number | null,
    otterLocationID?: string | null,
  ) => Promise<PlatformIntegrationEntity>;
  updatePlatformIntegration: (
    integration: PlatformIntegrationEntity,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    platformID?: number,
  ) => Promise<PlatformIntegrationEntity>;
  getPlatformIntegrationByLocationIDAndPlatform: (locationID: number, platform: string) => Promise<PlatformIntegrationEntity | null>;
  /**
   * Exact-match lookup for a per-store integration by the external store identifier persisted in the
   * `otter_location_id` column. Used by the Otter onboarding flow, where the store identifier is the
   * Otter `internalStoreId` (a UUID).
   */
  getPlatformIntegrationByStoreIDAndPlatform: (storeID: string, platform: string) => Promise<PlatformIntegrationEntity | null>;
  /** Reverse lookup for platforms identified by store id (e.g. Otter) — given our own restaurantID, find the integration. */
  getPlatformIntegrationByRestaurantIDAndPlatform: (restaurantID: number, platform: string) => Promise<PlatformIntegrationEntity | null>;
  /** All connected (restaurant-scoped) integrations for a platform — excludes app-level rows (e.g. Otter's client-credentials token). */
  getAllConnectedPlatformIntegrations: (platform: string) => Promise<PlatformIntegrationEntity[]>;
}

export interface PlatformIntegrationModelInterface {
  upsertPlatformIntegration: (platformIntegration: PlatformIntegrationEntity, entityManager?: EntityManager) => Promise<PlatformIntegrationEntity>;
  getPlatformIntegrationByLocationIDAndPlatform: (
    locationID: number,
    externalParty: string,
    entityManager?: EntityManager,
  ) => Promise<PlatformIntegrationEntity | null>;
  getPlatformIntegrationByStoreIDAndPlatform: (
    storeID: string,
    externalParty: string,
    entityManager?: EntityManager,
  ) => Promise<PlatformIntegrationEntity | null>;
  getPlatformIntegrationByRestaurantIDAndPlatform: (
    restaurantID: number,
    externalParty: string,
    entityManager?: EntityManager,
  ) => Promise<PlatformIntegrationEntity | null>;
  getAllConnectedPlatformIntegrations: (externalParty: string, entityManager?: EntityManager) => Promise<PlatformIntegrationEntity[]>;
}

export interface PlatformIntegrationInterface {
  platformID?: number;
  restaurantID?: number;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  externalParty: string;
  isSynced: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  restaurant?: RestaurantEntity;
}

export interface NormalizedMenu {
  id: string;
  name: string;
  hours: NormalizedMenuHours;
  description: string;
  sections: NormalizedMenuSection[];
}

export type NormalizedMenuHour = { startTime: string; endTime: string };

export interface NormalizedMenuHours {
  Monday: NormalizedMenuHour[];
  Tuesday: NormalizedMenuHour[];
  Wednesday: NormalizedMenuHour[];
  Thursday: NormalizedMenuHour[];
  Friday: NormalizedMenuHour[];
  Saturday: NormalizedMenuHour[];
  Sunday: NormalizedMenuHour[];
}

export interface NormalizedMenuSection {
  id: string;
  name: string;
  description: string;
  items: NormalizedMenuItem[];
}

export interface NormalizedMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  modifierGroups?: NormalizedModifierGroup[];
  /** Whether the source platform currently reports this item as unavailable (e.g. 86'd on Otter's POS). */
  isHidden?: boolean;
  // imageURLs: { link: string }[];
}

export interface NormalizedModifierGroup {
  id: string;
  name: string;
  modifiers: NormalizedModifier[];
  /** Minimum number of selections a customer must make in this group. `null` means no min limit (unset by the source platform). */
  minimumSelections?: number | null;
  /** Maximum number of selections a customer can make in this group. `null` means no max limit. */
  maximumSelections?: number | null;
  /** Maximum times a single modifier within this group can be selected. `null` means no per-modifier limit. */
  maxPerModifierSelectionQuantity?: number | null;
}

export interface NormalizedModifier {
  id: string;
  name: string;
  price: number;
  description: string;
  /** Whether the source platform currently reports this modifier as unavailable (e.g. 86'd on Otter's POS). */
  isHidden?: boolean;
}
