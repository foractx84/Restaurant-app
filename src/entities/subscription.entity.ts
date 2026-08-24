import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SubscriptionItemEntity } from '@/entities/subscriptionItem.entity';
import { ManagerEntity } from '@/entities/manager.entity';

@Entity({ name: 'subscriptions' })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn()
  subscription_id?: number;

  @Column('timestamp without time zone', {
    select: false,
    nullable: false,
  })
  started_at?: string;

  @Column('text', {
    nullable: false,
    select: true,
    unique: true,
  })
  stripe_subscription_id?: string;

  @Column('text', {
    nullable: false,
    select: true,
  })
  @ManyToOne(() => ManagerEntity, manager => manager.subscriptions, {
    nullable: false,
  })
  @JoinColumn({ name: 'stripe_customer_id', referencedColumnName: 'stripe_customer_id' })
  stripe_customer_id?: string;

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

  @OneToMany(() => SubscriptionItemEntity, subscription_items => subscription_items.subscription_id)
  subscription_items?: Array<SubscriptionItemEntity>;
}
