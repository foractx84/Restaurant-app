import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SubscriptionEntity } from '@/entities/subscription.entity';
import { ProductPriceEntity } from '@/entities/productPrice.entity';
import { RestaurantPackageEntity } from '@/entities/restaurantPackage.entity';
import { PackageEntity } from '@/entities/packageEntity.entity';
import { SubscriptionStatus } from '@/enums/subscriptionStatus';

@Entity({ name: 'subscription_items' })
export class SubscriptionItemEntity {
  @PrimaryGeneratedColumn()
  subscription_item_id?: number;

  @Column('int', {
    select: true,
    nullable: false,
  })
  @ManyToOne(() => SubscriptionEntity, subscription => subscription.subscription_items, {
    nullable: false,
  })
  @JoinColumn({ name: 'subscription_id', referencedColumnName: 'subscription_id' })
  subscription_id?: number;

  @Column('int', {
    select: true,
    nullable: true,
  })
  @ManyToOne(() => RestaurantPackageEntity, restaurant_package => restaurant_package.restaurant_package_id, {
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_package_id', referencedColumnName: 'restaurant_package_id' })
  restaurant_package_id?: number;

  @Column('int', {
    select: true,
    nullable: false,
  })
  @ManyToOne(() => PackageEntity, packages => packages.package_id, {
    nullable: false,
  })
  @JoinColumn({ name: 'package_id', referencedColumnName: 'package_id' })
  package_id?: number;

  @Column('timestamp without time zone', {
    select: false,
    nullable: false,
  })
  created_at?: string;

  @Column('timestamp without time zone', {
    select: false,
    nullable: false,
  })
  updated_at?: string;

  @Column('timestamp without time zone', {
    select: false,
    nullable: false,
  })
  deleted_at?: string;

  @Column('timestamp without time zone', {
    select: false,
    nullable: false,
  })
  assigned_at?: string;

  @Column('int', {
    nullable: false,
    select: true,
  })
  amount: number;

  @Column('timestamp without time zone', {
    select: true,
    nullable: true,
  })
  expiration_date?: string;

  @Column('int', {
    nullable: false,
    select: true,
  })
  tax_amount: number;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    nullable: false,
    select: true,
  })
  status: string;

  @Column('text', {
    nullable: false,
    select: true,
    unique: true,
  })
  stripe_subscription_item_id: string;

  @Column('int', {
    select: true,
    nullable: false,
  })
  @ManyToOne(() => ProductPriceEntity, product_prices => product_prices.product_price_id, {
    nullable: false,
  })
  @JoinColumn({
    name: 'price_id',
    referencedColumnName: 'product_price_id',
  })
  price_id?: number;
}
