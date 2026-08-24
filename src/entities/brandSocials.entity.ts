import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BrandEntity } from './brand.entity';

@Entity({ name: 'brand_socials' })
export class BrandSocialsEntity {
  @PrimaryGeneratedColumn()
  brand_socials_id: number;

  @Column('text', { nullable: true })
  facebook?: string;

  @Column('text', { nullable: true })
  instagram?: string;

  @Column('text', { nullable: true })
  tiktok?: string;

  @Column('text', { nullable: true })
  snapchat?: string;

  @Column('text', { nullable: true })
  twitter?: string;

  @Column('timestamptz', {
    name: 'created_at',
    select: false,
    nullable: false,
  })
  createdAt?: Date;

  @Column('timestamptz', {
    name: 'updated_at',
    select: false,
    nullable: false,
  })
  updatedAt?: Date;

  @OneToOne(() => BrandEntity, brand => brand.socials, {
    nullable: false,
  })
  @JoinColumn({
    name: 'brand_id',
    referencedColumnName: 'id',
  })
  brand: BrandEntity;

  @Column('uuid', {
    name: 'brand_id',
    nullable: false,
  })
  brandID: string;
}
