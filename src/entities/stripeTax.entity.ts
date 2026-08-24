import { StripeTaxDBInterface } from '@/interfaces/stripeTax.interface';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'stripe_tax_rates' })
export class StripeTaxEntity implements StripeTaxDBInterface {
  @PrimaryGeneratedColumn()
  tax_rate_id: number;

  @Column('text', {
    nullable: false,
    unique: true,
    select: true,
  })
  stripe_tax_rate_id: string;

  @Column('text', {
    nullable: false,
    select: true,
  })
  state: string;

  @Column('text', {
    nullable: false,
    select: true,
  })
  country: string;

  @Column('timestamp without time zone', {
    select: false,
    nullable: false,
  })
  created_at: string;

  @Column('timestamp without time zone', {
    select: false,
    nullable: false,
  })
  updated_at: string;
}
