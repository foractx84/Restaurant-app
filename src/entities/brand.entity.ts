import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BrandInterface } from '@interfaces/brand.interface';
import { RestaurantGroupEntity } from './restaurantGroup.entity';
import { RestaurantEntity } from './restaurant.entity';
import { CuisineEntity } from './cuisine.entity';
import { BrandSocialsEntity } from './brandSocials.entity';

/**
 * Child of restaurant_groups, parent of restaurants (locations). A brand belongs to exactly one
 * restaurant group; a restaurant belongs to at most one brand. TAB-383.
 */
@Entity({ name: 'brands' })
export class BrandEntity implements BrandInterface {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column('uuid', { name: 'restaurant_group_id', nullable: false })
  restaurantGroupID: string;

  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { nullable: true })
  website?: string;

  @Column('text', {
    name: 'primary_tagline',
    nullable: true,
  })
  primaryTagline?: string;

  @Column('text', {
    name: 'secondary_tagline',
    nullable: true,
  })
  secondaryTagline?: string;

  @Column('text', {
    name: 'reservation_url',
    nullable: true,
  })
  reservationUrl?: string;

  @Column('text', {
    name: 'ordering_url',
    nullable: true,
  })
  orderingUrl?: string;

  @Column('int4', {
    name: 'cuisine_id',
    nullable: true,
  })
  cuisineID?: number;

  @Column('text', {
    name: 'logo_url',
    nullable: true,
  })
  logoUrl?: string;

  @ManyToOne(() => CuisineEntity, cuisine => cuisine.brands, {
    nullable: true,
  })
  @JoinColumn({
    name: 'cuisine_id',
    referencedColumnName: 'cuisine_id',
  })
  cuisine?: CuisineEntity;

  @Column('timestamptz', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamptz', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @Column('timestamptz', { name: 'deleted_at', select: false })
  deletedAt?: Date;

  @ManyToOne(() => RestaurantGroupEntity, restaurantGroup => restaurantGroup.brands, { nullable: false })
  @JoinColumn({ name: 'restaurant_group_id' })
  restaurantGroup?: RestaurantGroupEntity;

  @OneToMany(() => RestaurantEntity, restaurant => restaurant.brand)
  restaurants?: RestaurantEntity[];

  @OneToOne(() => BrandSocialsEntity, socials => socials.brand)
  socials?: BrandSocialsEntity;

  constructor(restaurantGroupID: string, name: string, id?: string) {
    this.id = id;
    this.restaurantGroupID = restaurantGroupID;
    this.name = name;
  }
}
