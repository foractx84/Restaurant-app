import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';
import { RestaurantMenuSnapshotInterface } from '@interfaces/restaurantMenuSnapshot.interface';
import { NormalizedMenu } from '@interfaces/platformIntegration.interface';
import { EXTERNAL_PARTY, ExternalParty } from '@constants/externalParty.constants';

@Entity({ name: 'menu_snapshots' })
export class RestaurantMenuSnapshotEntity implements RestaurantMenuSnapshotInterface {
  @PrimaryGeneratedColumn({ name: 'menu_snapshot_id', type: 'int4' })
  id?: number;

  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.restaurant_id, {
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'restaurant_id' })
  @Column('int4', {
    name: 'restaurant_id',
    nullable: false,
  })
  restaurantID: number;

  @Column('jsonb', {
    name: 'menu_json',
    nullable: false,
  })
  menuJson: NormalizedMenu[];

  @Column('text', {
    name: 'menu_hash',
    nullable: false,
  })
  menuHash: string;

  @Column('timestamp', {
    name: 'created_at',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt?: string;

  @Column('text', {
    name: 'external_party',
    nullable: false,
    default: EXTERNAL_PARTY.CHECKMATE,
  })
  externalParty: ExternalParty;

  constructor(restaurant_id: number, menu_json: NormalizedMenu[], menu_hash: string, external_party: ExternalParty, id?: number) {
    this.id = id ?? null;
    this.restaurantID = restaurant_id;
    this.menuJson = menu_json;
    this.menuHash = menu_hash;
    this.externalParty = external_party;
  }
}
