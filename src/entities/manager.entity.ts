import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ManagerDBInterface } from '@interfaces/managers.interface';
import { TitleEntity } from '@/entities/title.entity';
import { ManagerRestaurantsEntity } from '@/entities/managerRestaurants.entity';
import { ManagerPackageEntity } from '@/entities/managerPackage.entity';
import { SubscriptionEntity } from '@/entities/subscription.entity';
import { StripeCustomerEntity } from './stripeCustomer.entity';

@Entity({ name: 'manager_external_users' })
export class ManagerEntity implements ManagerDBInterface {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column('text', {
    nullable: false,
  })
  first_name?: string;

  @Column('text', {
    nullable: false,
  })
  last_name?: string;

  @Column('text', {
    nullable: false,
  })
  email: string;

  @Column('text', {
    nullable: false,
  })
  phone?: string;

  @Column('text', {
    nullable: false,
  })
  pwd?: string;

  @Column('timestamp', {
    select: false,
    nullable: false,
  })
  date_created?: string;

  @Column('timestamp', {
    select: false,
    nullable: false,
  })
  updated_at?: string;

  @ManyToOne(() => TitleEntity, title => title.id, {
    cascade: ['insert'],
    nullable: false,
  })
  @JoinColumn({ name: 'position_title_id', referencedColumnName: 'id' })
  position_title_id?: number;

  @OneToMany(() => ManagerRestaurantsEntity, managerRestaurant => managerRestaurant.external_user_id)
  manager_restaurants?: Array<ManagerRestaurantsEntity>;

  @Column('timestamp', {
    select: true,
    nullable: true,
  })
  verified_at?: string;

  @Column('text', {
    select: true,
    nullable: true,
  })
  email_code?: string;

  @ManyToOne(() => StripeCustomerEntity, stripeCustomer => stripeCustomer.stripe_customer_id, {
    cascade: ['insert'],
    nullable: true,
  })
  @JoinColumn({ name: 'stripe_customer_id', referencedColumnName: 'stripe_customer_id' })
  @Column('text', {
    select: true,
    nullable: true,
    unique: true,
  })
  stripe_customer_id?: string;

  @OneToMany(() => ManagerPackageEntity, manager_package => manager_package.external_user_id)
  manager_packages?: Array<ManagerPackageEntity>;

  @OneToMany(() => SubscriptionEntity, subscriptions => subscriptions.stripe_customer_id)
  subscriptions?: Array<SubscriptionEntity>;
}
