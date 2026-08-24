import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { StripeConnectAccountEntityInterface } from '@/interfaces/stripeConnectAccount.interface';

@Entity({ name: 'stripe_connect_accounts' })
@Unique(['restaurant_id'])
export class StripeConnectAccountEntity implements StripeConnectAccountEntityInterface {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column('int4', {
    nullable: false,
    unique: true,
  })
  restaurant_id: number;

  @Column('text', {
    nullable: false,
  })
  stripe_account_id: string;

  @Column('boolean', {
    nullable: false,
    default: false,
  })
  charges_enabled: boolean;

  @Column('boolean', {
    nullable: false,
    default: false,
  })
  details_submitted: boolean;

  @Column('text', {
    nullable: true,
  })
  onboarding_status: string;

  @Column('jsonb', {
    nullable: true,
  })
  capabilities?: Record<string, unknown>;

  @Column('jsonb', {
    nullable: true,
  })
  raw_account?: Record<string, unknown>;

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
}
