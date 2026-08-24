import { PackageDBInterface } from '@/interfaces/package.interface';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ManagerPackageEntity } from './managerPackage.entity';
import { RestaurantPackageEntity } from './restaurantPackage.entity';
import { ProductEntity } from '@/entities/product.entity';
import { SubscriptionItemEntity } from '@/entities/subscriptionItem.entity';

@Entity({ name: 'packages' })
export class PackageEntity implements PackageDBInterface {
  @PrimaryGeneratedColumn()
  package_id: number;

  @Column('text', {
    nullable: false,
    unique: true,
  })
  name: string;

  @Column('text', {
    nullable: true,
  })
  description: string;

  @Column('text', {
    nullable: false,
    unique: true,
  })
  code: string;

  @Column('timestamp', {
    nullable: true,
  })
  created_at: string;

  @Column('timestamp', {
    nullable: true,
  })
  updated_at: string;

  @Column('timestamp', {
    nullable: true,
  })
  deleted_at: string;

  @Column('bool', {
    default: false,
  })
  special: boolean;

  @OneToMany(() => ManagerPackageEntity, manager_package => manager_package.package_id)
  manager_packages: Array<ManagerPackageEntity>;

  @OneToMany(() => RestaurantPackageEntity, restaurant_package => restaurant_package.package_id)
  restaurant_packages: Array<RestaurantPackageEntity>;

  @OneToMany(() => ProductEntity, product => product.package_id)
  products: Array<ProductEntity>;

  @OneToMany(() => SubscriptionItemEntity, subscription_items => subscription_items.package_id)
  subscription_items: Array<SubscriptionItemEntity>;
}
