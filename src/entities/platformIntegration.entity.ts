import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { PlatformIntegrationInterface } from '@interfaces/platformIntegration.interface';

type PlatformIntegrationInit = {
  restaurantID: number | null;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  externalParty: string;
  locationID?: number | null;
  otterLocationID?: string | null;
};

@Entity({ name: 'restaurant_platform_integrations' })
export class PlatformIntegrationEntity implements PlatformIntegrationInterface {
  @PrimaryGeneratedColumn({ name: 'restaurant_platform_id', type: 'int4' })
  platformID?: number;

  /**
   * Nullable to support app-level OAuth tokens (e.g. Otter client-credentials) that are not
   * tied to a restaurant. Those rows use `restaurant_id = null` and `location_id = 0`.
   * Per-store integrations still set a real restaurant ID after the restaurant is created.
   * Do not use `0` — that violates the restaurants FK.
   */
  @Column('int4', {
    name: 'restaurant_id',
    nullable: true,
    select: true,
  })
  restaurantID?: number | null;

  @Column('text', {
    name: 'access_token',
    nullable: false,
  })
  accessToken: string;

  @Column('text', {
    name: 'refresh_token',
    nullable: false,
  })
  refreshToken: string;

  @Column('timestamp', { name: 'expires_at', nullable: false })
  expiresAt: Date;

  @Column('text', {
    name: 'external_party',
    nullable: false,
  })
  externalParty: string;

  @Column('boolean', {
    name: 'is_synced',
    nullable: false,
    default: false,
    select: true,
  })
  isSynced: boolean;

  @Column('timestamp', { name: 'created_at', select: false })
  createdAt: Date;

  @Column('timestamp', { name: 'updated_at', select: false })
  updatedAt: Date;

  @Column('timestamp', { name: 'deleted_at', select: false })
  deletedAt?: Date;

  @Column('int4', {
    name: 'location_id',
    nullable: true,
    select: true,
  })
  locationID?: number | null;

  /**
   * Otter `internalStoreId` (a UUID) for per-store Otter integrations. This is the store's identity
   * for onboarding/idempotency; it is stored natively rather than hashed into `location_id`. NULL for
   * every non-Otter row (Checkmate uses `location_id`) and for app-level Otter token rows.
   */
  @Column('uuid', {
    name: 'otter_location_id',
    nullable: true,
    select: true,
  })
  otterLocationID?: string | null;

  @OneToOne(() => RestaurantEntity, restaurant => restaurant.modifiers, {
    nullable: true,
  })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'restaurant_id' })
  restaurant?: RestaurantEntity;

  constructor(init?: PlatformIntegrationInit) {
    if (!init) return;

    this.restaurantID = init.restaurantID;
    this.accessToken = init.accessToken;
    this.refreshToken = init.refreshToken;
    this.expiresAt = new Date(Date.now() + init.expiresIn);
    this.externalParty = init.externalParty;
    this.locationID = init.locationID ?? null;
    this.otterLocationID = init.otterLocationID ?? null;
  }
}
