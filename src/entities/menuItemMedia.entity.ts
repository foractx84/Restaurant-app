import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MenuItemMediaDBInterface } from '@/interfaces/menuItemMedia.interface';
import { MenuItemEntity } from './menuItem.entity';
import { MenuItemMediaTypeEntity } from './menuItemMediaType.entity';
import { MenuItemVideoThumbnailEntity } from './menuItemVideoThumbnails.entity';
import { MediaEntity } from './media.entity';

@Entity({ name: 'menu_item_media' })
export class MenuItemMediaEntity implements MenuItemMediaDBInterface {
  @PrimaryGeneratedColumn()
  menu_item_media_id?: number;

  @ManyToOne(() => MenuItemEntity, menu_item => menu_item.menu_item_id, {
    nullable: false,
  })
  @JoinColumn({
    name: 'menu_item_id',
    referencedColumnName: 'menu_item_id',
  })
  menu_item_id?: number;

  @Column('text', {
    nullable: false,
  })
  media_url: string;

  @ManyToOne(() => MenuItemMediaTypeEntity, menu_item_media_type => menu_item_media_type.media, {
    nullable: false,
  })
  @JoinColumn({
    name: 'menu_item_media_type_id',
    referencedColumnName: 'menu_item_media_type_id',
  })
  menu_item_media_type_id?: number;

  @Column('int4', {
    nullable: false,
  })
  list_order?: number;

  @Column('timestamp without time zone', {
    select: true,
    nullable: true,
  })
  deleted_at?: string;

  @Column('timestamp without time zone', {
    nullable: false,
    select: false,
  })
  created_at?: string;

  @Column('timestamp without time zone', {
    nullable: false,
    select: false,
  })
  updated_at?: string;

  @Column('int4', {
    name: 'media_id',
    nullable: true,
    select: true,
  })
  mediaID?: number;

  @OneToOne(() => MenuItemVideoThumbnailEntity, menuItemVideoThumbnails => menuItemVideoThumbnails.menu_item_media_id)
  menu_item_video_thumbnail?: MenuItemVideoThumbnailEntity;

  @ManyToOne(() => MediaEntity, media => media.menuItemMedia, {
    nullable: false,
  })
  @JoinColumn({
    name: 'media_id',
    referencedColumnName: 'media_id',
  })
  media?: MediaEntity;

  constructor(menu_item_id: number, mediaID: number, media_url: string, menu_item_media_type_id = 1) {
    this.menu_item_id = menu_item_id;
    this.mediaID = mediaID;
    this.media_url = media_url;
    if (menu_item_media_type_id) {
      this.menu_item_media_type_id = menu_item_media_type_id;
    }
  }
}
