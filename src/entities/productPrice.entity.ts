import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentPlanEntity } from '@/entities/paymentPlan.entity';
import { ProductEntity } from '@/entities/product.entity';

@Entity({ name: 'product_prices' })
export class ProductPriceEntity {
  @PrimaryGeneratedColumn()
  product_price_id?: number;

  @Column('int', {
    select: true,
    nullable: false,
  })
  price?: number;

  @ManyToOne(() => ProductEntity, product => product.product_prices, {
    nullable: false,
  })
  @JoinColumn({
    name: 'product_id',
    referencedColumnName: 'product_id',
  })
  product_id?: number;

  @Column('text', {
    nullable: false,
    select: true,
    unique: true,
  })
  stripe_price_id: string;

  @Column('text', {
    nullable: false,
    select: true,
  })
  currency_code: string;

  @ManyToOne(() => PaymentPlanEntity, payment_plan => payment_plan.payment_plan_id, {
    nullable: true,
  })
  @JoinColumn({
    name: 'payment_plan_id',
    referencedColumnName: 'payment_plan_id',
  })
  payment_plan_id?: number;

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
