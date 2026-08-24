import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DiscoveryContentEntity } from './discoveryContent.entity';
import { MediaEntity } from './media.entity';

@Entity('restaurant_discovery_content_media')
export class DiscoveryContentMediaEntity {
  @PrimaryGeneratedColumn({ name: 'discovery_content_media_id', type: 'int4' })
  discoveryContentMediaID?: number;

  @Column('int4', {
    name: 'discovery_content_id',
    nullable: false,
  })
  discoveryContentID?: number;

  @Column('int4', {
    name: 'media_id',
    nullable: false,
  })
  mediaID: number;

  @Column('int4', {
    name: 'list_order',
    nullable: true,
  })
  listOrder?: number;

  @Column('timestamp with time zone', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamp with time zone', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @ManyToOne(() => DiscoveryContentEntity, discoveryContent => discoveryContent.media, {
    nullable: false,
  })
  @JoinColumn({ name: 'discovery_content_id', referencedColumnName: 'discoveryContentID' })
  discoveryContent?: DiscoveryContentEntity;

  @ManyToOne(() => MediaEntity, mediaLibrary => mediaLibrary.mediaContent, {
    nullable: false,
  })
  @JoinColumn({ name: 'media_id', referencedColumnName: 'media_id' })
  mediaLibrary?: MediaEntity;

  constructor(discoveryContentID?: number, mediaID?: number, discoveryContentMediaID?: number) {
    this.discoveryContentID = discoveryContentID ?? null;
    this.mediaID = mediaID ?? null;
    this.discoveryContentMediaID = discoveryContentMediaID ?? null;
  }
}
