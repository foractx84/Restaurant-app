import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { PackageEntity } from './packageEntity.entity';
import { RestaurantPackageDBInterface } from '@/interfaces/restaurantPackage.interface';
import { SubscriptionItemEntity } from '@/entities/subscriptionItem.entity';

@Entity({ name: 'restaurant_packages' })
export class RestaurantPackageEntity implements RestaurantPackageDBInterface {
  @PrimaryGeneratedColumn()
  restaurant_package_id?: number;

  @Column('int4', {
    nullable: false,
  })
  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.restaurant_id, {
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'restaurant_id' })
  restaurant_id?: number;

  @Column('int4', {
    nullable: false,
  })
  @ManyToOne(() => PackageEntity, packages => packages.package_id, {
    nullable: false,
  })
  @JoinColumn({ name: 'package_id', referencedColumnName: 'package_id' })
  package_id?: number;

  @Column('bool', {
    nullable: false,
    default: true,
  })
  is_active?: boolean;

  @Column('timestamp', {
    nullable: true,
  })
  created_at?: string;

  @Column('timestamp', {
    nullable: true,
  })
  updated_at?: string;

  @Column('timestamp', {
    nullable: true,
  })
  deleted_at?: string;

  @OneToMany(() => SubscriptionItemEntity, subscription_items => subscription_items.restaurant_package_id)
  subscription_items?: Array<SubscriptionItemEntity>;
}
