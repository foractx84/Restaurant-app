import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DiscoveryContentCategoriesEntity } from './discoveryContentCategories.entity';
import { DiscoveryContentEntity } from './discoveryContent.entity';

@Entity('discovery_content_category_buckets')
export class DiscoveryContentCategoryBucketsEntity {
  @PrimaryGeneratedColumn({ name: 'bucket_id', type: 'int4' })
  bucketID?: number;

  @Column('int4', {
    name: 'content_id',
    nullable: false,
    select: true,
  })
  contentID?: number;

  @Column('int4', {
    name: 'category_id',
    nullable: false,
    select: true,
  })
  categoryID?: number;

  @Column('timestamp', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamp', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @ManyToOne(() => DiscoveryContentEntity, discoveryContent => discoveryContent.categoryBuckets, {
    nullable: false,
  })
  @JoinColumn({ name: 'content_id', referencedColumnName: 'discoveryContentID' })
  content?: DiscoveryContentEntity;

  @ManyToOne(() => DiscoveryContentCategoriesEntity, discoveryContentCategories => discoveryContentCategories.buckets, {
    nullable: false,
  })
  @JoinColumn({ name: 'category_id', referencedColumnName: 'categoryID' })
  category?: DiscoveryContentCategoriesEntity;

  constructor(contentID?: number, categoryID?: number, bucketID?: number) {
    if (contentID) {
      this.contentID = contentID;
    }
    if (categoryID) {
      this.categoryID = categoryID;
    }
    if (bucketID) {
      this.bucketID = bucketID;
    }
  }
}
