import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantGroupInterface } from '@interfaces/restaurantGroup.interface';
import { BrandEntity } from './brand.entity';

/**
 * Top-level parent of the restaurant group -> brand -> restaurant (location) hierarchy (e.g. Yum
 * Brands as a restaurant group operating several brands, each with many locations). TAB-383.
 */
@Entity({ name: 'restaurant_groups' })
export class RestaurantGroupEntity implements RestaurantGroupInterface {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column('text', { nullable: false })
  name: string;

  @Column('timestamptz', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamptz', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @Column('timestamptz', { name: 'deleted_at', select: false })
  deletedAt?: Date;

  @OneToMany(() => BrandEntity, brand => brand.restaurantGroup)
  brands?: BrandEntity[];

  constructor(name: string, id?: string) {
    this.id = id;
    this.name = name;
  }
}
