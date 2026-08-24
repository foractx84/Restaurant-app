import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductPriceEntity } from '@/entities/productPrice.entity';
import { PackageEntity } from '@/entities/packageEntity.entity';
import { ProductTypeEntity } from '@/entities/productType.entity';

@Entity({ name: 'products' })
export class ProductEntity {
  @PrimaryGeneratedColumn()
  product_id?: number;

  @Column('int4', {
    select: true,
    nullable: true,
  })
  @ManyToOne(() => PackageEntity, packages => packages.package_id, {
    nullable: true,
  })
  @JoinColumn({ name: 'package_id', referencedColumnName: 'package_id' })
  package_id?: number;

  @Column('int4', {
    select: true,
    nullable: false,
  })
  @ManyToOne(() => ProductTypeEntity, product_type => product_type.product_type_id, {
    nullable: true,
  })
  @JoinColumn({ name: 'product_type_id', referencedColumnName: 'product_type_id' })
  product_type_id?: number;

  @Column('text', {
    nullable: true,
    select: true,
  })
  description?: string;

  @Column('text', {
    nullable: true,
    select: true,
  })
  image_url?: string;

  @Column('text', {
    nullable: false,
    select: true,
    unique: true,
  })
  stripe_product_id: string;

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

  @OneToMany(() => ProductPriceEntity, product_prices => product_prices.product_id)
  product_prices?: Array<ProductPriceEntity>;
}
