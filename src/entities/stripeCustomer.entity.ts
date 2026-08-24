import { StripeCustomerDBInterface } from '@/interfaces/stripeCustomer.interface';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'stripe_customer' })
export class StripeCustomerEntity implements StripeCustomerDBInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', {
    nullable: false,
    select: true,
    unique: true,
  })
  stripe_customer_id: string;

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
}
