import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductType } from '@/enums/productType';
import { ProductEntity } from '@/entities/product.entity';

@Entity({ name: 'product_types' })
export class ProductTypeEntity {
  @PrimaryGeneratedColumn()
  product_type_id?: number;

  @Column({
    type: 'enum',
    enum: ProductType,
    nullable: false,
    select: true,
  })
  type?: string;

  @OneToMany(() => ProductEntity, products => products.product_type_id)
  products?: Array<ProductEntity>;
}
