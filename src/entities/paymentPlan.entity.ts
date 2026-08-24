import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductPriceEntity } from '@/entities/productPrice.entity';
import { PaymentPlan } from '@/enums/paymentPlan';

@Entity({ name: 'payment_plans' })
export class PaymentPlanEntity {
  @PrimaryGeneratedColumn()
  payment_plan_id?: number;

  @Column({
    type: 'enum',
    enum: PaymentPlan,
    nullable: false,
    select: true,
    unique: true,
  })
  name?: string;

  @OneToMany(() => ProductPriceEntity, product_prices => product_prices.payment_plan_id)
  product_prices?: Array<ProductPriceEntity>;
}
