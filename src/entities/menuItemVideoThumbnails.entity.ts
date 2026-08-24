import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MenuItemVideoThumbnailsDBInterface } from '@interfaces/menuItemVideoThumbnail.interface';
import { MenuItemMediaEntity } from './menuItemMedia.entity';
import { MediaEntity } from './media.entity';

@Entity({ name: 'menu_item_video_thumbnails' })
export class MenuItemVideoThumbnailEntity implements MenuItemVideoThumbnailsDBInterface {
  @PrimaryGeneratedColumn()
  menu_item_video_thumbnail_id?: number;

  @ManyToOne(() => MenuItemMediaEntity, menu_item_media => menu_item_media.menu_item_media_id, {
    nullable: false,
  })
  @JoinColumn({
    name: 'menu_item_media_id',
    referencedColumnName: 'menu_item_media_id',
  })
  menu_item_media_id?: number;

  @Column('int4', {
    name: 'media_id',
    nullable: true,
    select: true,
  })
  mediaID?: number;

  @Column('text', {
    nullable: false,
  })
  thumbnail_url?: string;

  @Column('timestamp', {
    select: false,
    nullable: true,
  })
  deleted_at?: string;

  @Column('timestamp', {
    nullable: false,
    select: false,
  })
  created_at?: string;

  @Column('timestamp', {
    nullable: false,
    select: false,
  })
  updated_at?: string;

  @ManyToOne(() => MediaEntity, media => media.menuItemVideoThumbnail, {
    nullable: false,
  })
  @JoinColumn({
    name: 'media_id',
    referencedColumnName: 'media_id',
  })
  media?: MediaEntity;

  constructor(menu_item_media_id: number, thumbnail_url: string, mediaID: number) {
    this.menu_item_media_id = menu_item_media_id;
    this.thumbnail_url = thumbnail_url;
    this.mediaID = mediaID;
  }
}
