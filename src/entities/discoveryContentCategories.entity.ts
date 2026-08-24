import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DiscoveryContentCategoryBucketsEntity } from './discoveryContentBuckets.entity';

// currently hardcoded values in databaase that user chooses from drop down menu in order to organize and filter their discovery conten
// the current categories are:
// 1. dish_media
// 2. dish_story
// 3. promotions
// 4. spaces
// 5. chef_story
// 6. vibes
// 7.  misc
@Entity('discovery_content_categories')
export class DiscoveryContentCategoriesEntity {
  @PrimaryGeneratedColumn({ name: 'category_id', type: 'int4' })
  categoryID: number;

  @Column('text', {
    name: 'name',
    nullable: true,
  })
  name: string;

  @Column('timestamp', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamp', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @OneToMany(() => DiscoveryContentCategoryBucketsEntity, discoveryyContentBuckets => discoveryyContentBuckets.category)
  buckets?: Array<DiscoveryContentCategoryBucketsEntity>;

  constructor(name: string, categoryID?: number) {
    this.name = name ?? null;
    if (categoryID) {
      this.categoryID = categoryID;
    }
  }
}
