import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DiscoveryContentURLsEntity } from './discoveryContentURLs.entity';
import { PlatformENUMS } from '../enums/discoveryURLPlatforms';

@Entity('restaurant_discovery_content_url_platforms')
export class DiscoveryContentUrlPlatformsEntity {
  @PrimaryGeneratedColumn({ name: 'platform_id', type: 'int4' })
  platformID: number;

  @Column({
    type: 'enum',
    enum: PlatformENUMS,
    nullable: false,
    unique: true,
  })
  name: PlatformENUMS;

  @Column('text', {
    name: 'icon',
    nullable: false,
  })
  icon?: string;

  @Column('timestamp with time zone', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamp with time zone', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @OneToMany(() => DiscoveryContentURLsEntity, discoveryContentURLs => discoveryContentURLs.platform)
  urls?: Array<DiscoveryContentURLsEntity>;

  constructor(name: PlatformENUMS, icon: string, platformID?: number) {
    this.name = name ?? null;
    this.icon = icon ?? null;
    if (platformID) {
      this.platformID = platformID;
    }
  }
}
