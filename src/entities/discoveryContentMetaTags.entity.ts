import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DiscoveryContentEntity } from './discoveryContent.entity';

// hashtags to tag a discovery content a discovery item and increase visilibity
@Entity({ name: 'discovery_content_meta_tags' })
export class DiscoveryContentMetaTagsEntity {
  @PrimaryGeneratedColumn('increment', { name: 'meta_tag_id' })
  metaTagID?: number;

  @Column('int4', {
    name: 'content_id',
    nullable: false,
    select: true,
  })
  contentID?: number;

  @Column('text', {
    name: 'tag',
    nullable: false,
  })
  tag?: string;

  @Column('timestamp', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamp', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @ManyToOne(() => DiscoveryContentEntity, discoveryContent => discoveryContent.metaTags, {
    nullable: false,
  })
  @JoinColumn({ name: 'content_id', referencedColumnName: 'discoveryContentID' })
  content?: DiscoveryContentEntity;

  constructor(tag: string, contentID?: number, metaTagID?: number) {
    this.tag = tag ?? null;
    if (contentID) {
      this.contentID = contentID;
    }
    if (metaTagID) {
      this.metaTagID = metaTagID;
    }
  }
}
