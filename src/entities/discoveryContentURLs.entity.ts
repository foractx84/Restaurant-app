import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DiscoveryContentEntity } from './discoveryContent.entity';
import { DiscoveryContentUrlPlatformsEntity } from './discoveryContentURLPlattforms.entity';
import { PlatformUrlTypeENUMS } from '@/enums/discoveryURLPlatforms';

@Entity('restaurant_discovery_content_urls')
export class DiscoveryContentURLsEntity {
  @PrimaryGeneratedColumn({ name: 'url_id', type: 'int4' })
  urlID?: number;

  @Column('int4', {
    name: 'content_id',
    nullable: false,
  })
  contentID?: number;

  @Column('text', {
    name: 'url',
    nullable: false,
  })
  url?: string;

  @Column({
    name: 'url_type',
    enum: PlatformUrlTypeENUMS,
    type: 'enum',
    nullable: false,
  })
  urlType: PlatformUrlTypeENUMS;

  @Column('int4', {
    name: 'platform_id',
    nullable: false,
  })
  platformID?: number;

  @Column('timestamp with time zone', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamp with time zone', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @ManyToOne(() => DiscoveryContentEntity, discoveryContent => discoveryContent.urls, {
    nullable: false,
  })
  @JoinColumn({ name: 'content_id', referencedColumnName: 'discoveryContentID' })
  content?: DiscoveryContentEntity;

  @ManyToOne(() => DiscoveryContentUrlPlatformsEntity, platform => platform.urls, {
    nullable: false,
  })
  @JoinColumn({ name: 'platform_id', referencedColumnName: 'platformID' })
  platform?: DiscoveryContentUrlPlatformsEntity;

  constructor(url: string, urlType: PlatformUrlTypeENUMS, contentID?: number, platformID?: number, urlID?: number) {
    this.url = url ?? null;
    this.urlType = urlType ?? null;
    this.contentID = contentID ?? null;
    this.platformID = platformID ?? null;
    this.urlID = urlID ?? null;
  }
}
