import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BrandInterface } from '@interfaces/brand.interface';
import { RestaurantGroupEntity } from './restaurantGroup.entity';
import { RestaurantEntity } from './restaurant.entity';

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

  constructor(restaurantGroupID: string, name: string, id?: string) {
    this.id = id;
    this.restaurantGroupID = restaurantGroupID;
    this.name = name;
  }
}
