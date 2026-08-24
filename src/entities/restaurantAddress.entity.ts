import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { CountryEntity } from './country.entity';
import { RestaurantEntity } from './restaurant.entity';

@Entity({ name: 'restaurant_addresses' })
export class RestaurantAddressEntity {
  @PrimaryGeneratedColumn()
  restaurant_address_id?: number;

  @OneToOne(() => RestaurantEntity, restaurant => restaurant.restaurant_address, {
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'restaurant_id' })
  @Column('int4', {
    nullable: false,
  })
  restaurant_id: number;

  @Column('text', {
    nullable: true,
  })
  address1: string;

  @Column('text', {
    nullable: true,
  })
  address2: string;

  @Column('text', {
    nullable: true,
  })
  street_number: string;

  @Column('text', {
    nullable: true,
  })
  street_name: string;

  @Column('text', {
    nullable: true,
  })
  city: string;

  @Column('text', {
    nullable: true,
  })
  governing_district: string;

  @ManyToOne(() => CountryEntity, country => country.addresses, {
    nullable: false,
  })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'country_id' })
  @Column('int4', {
    nullable: false,
  })
  country_id: number;

  @Column('text', {
    nullable: true,
  })
  postal_code: string;

  @Column('numeric', {
    precision: 17,
    scale: 6,
    nullable: true,
  })
  lat: number;

  @Column('numeric', {
    precision: 17,
    scale: 6,
    nullable: true,
  })
  long: number;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  coordinates?: number;

  @Column('text', {
    nullable: false,
    default: 'America/New York',
  })
  timezone?: string;

  @Column('timestamp', {
    select: false,
    nullable: true,
  })
  created_at?: string;

  @Column('timestamp', {
    select: false,
    nullable: true,
  })
  updated_at?: string;
}
