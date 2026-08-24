import { RestaurantEntity } from '@/entities/restaurant.entity';
import { DiscoveryContentInterface } from '@interfaces/discoveryContent.interface';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DiscoveryContentMediaEntity } from './discoveryContentMedia.entity';
import { DiscoveryContentURLsEntity } from './discoveryContentURLs.entity';
import { DiscoveryContentCategoryBucketsEntity } from './discoveryContentBuckets.entity';
import { DiscoveryContentMetaTagsEntity } from './discoveryContentMetaTags.entity';

@Entity({ name: 'restaurant_discovery_content' })
export class DiscoveryContentEntity implements DiscoveryContentInterface {
  @PrimaryGeneratedColumn({ name: 'discovery_content_id', type: 'int4' })
  discoveryContentID?: number;

  @Column('text', {
    name: 'title',
    nullable: false,
  })
  title: string;

  @Column('text', {
    name: 'description',
    nullable: true,
  })
  description?: string;

  @Column('timestamp', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamp', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @Column('timestamp', { name: 'deleted_at', select: false })
  deletedAt?: Date;

  @Column('boolean', {
    name: 'is_hidden',
    nullable: false,
    default: false,
    select: true,
  })
  isHidden?: boolean;

  @Column('int4', {
    name: 'restaurant_id',
    nullable: false,
    select: true,
  })
  restaurantID?: number;

  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.discoveryContent, {
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'restaurant_id' })
  restaurant?: RestaurantEntity;

  @OneToMany(() => DiscoveryContentMediaEntity, media => media.discoveryContent)
  media?: Array<DiscoveryContentMediaEntity>;

  @OneToMany(() => DiscoveryContentURLsEntity, discoveryContentURLs => discoveryContentURLs.content)
  urls?: Array<DiscoveryContentURLsEntity>;

  @OneToMany(() => DiscoveryContentCategoryBucketsEntity, discoveryyContentBuckets => discoveryyContentBuckets.content)
  categoryBuckets?: Array<DiscoveryContentCategoryBucketsEntity>;

  @OneToMany(() => DiscoveryContentMetaTagsEntity, discoveryyContentMetaTags => discoveryyContentMetaTags.content)
  metaTags?: Array<DiscoveryContentMetaTagsEntity>;

  constructor(title: string, discoveryContentID?: number, description?: string, isHidden?: boolean, restaurantID?: number) {
    this.discoveryContentID = discoveryContentID;
    this.description = description ?? null;
    this.title = title;
    this.isHidden = isHidden ?? false;
    this.restaurantID = restaurantID ?? null;
  }

  toResponse(): DiscoveryContentEntity {
    return {
      discoveryContentID: this.discoveryContentID,
      title: this.title,
      description: this.description,
    } as DiscoveryContentEntity;
  }
}
