import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';
import { MediaLibraryDBInterface, MediaResponseInterface } from '@/interfaces/mediaLibrary.interface';
import { MediaTypeEntity } from './mediaTypeEntity.entity';
import { RestaurantProfileAlbumMediaEntity } from './restaurantProfileAlbumMedia.entity';
import { RestaurantImageEntity } from './restaurantImage.entity';
import { ModifierMediaEntity } from './modifierMedia.entity';
import { MediaType } from '@/enums/mediaType';
import { obtainImage, obtainMedia } from '@/utils/imageUtils';
import { IMAGE_TYPE_ID, VIDEO_TYPE_ID } from '@/constants/media.constants';
import { RestaurantProfileMediaEntity } from './restaurantProfileMedia.entity';
import { ProfileCardsMediaEntity } from './profileCardsMedia.entity';
import { MenuItemMediaEntity } from './menuItemMedia.entity';
import { AnnouncementImageEntity } from '@entities/announcementImage.entity';
import { MenuItemVideoThumbnailEntity } from './menuItemVideoThumbnails.entity';
import { DiscoveryContentMediaEntity } from './discoveryContentMedia.entity';

@Entity({ name: 'media_library' })
export class MediaEntity implements MediaLibraryDBInterface {
  @PrimaryGeneratedColumn()
  media_id?: number;

  @Column('int4', {
    nullable: false,
  })
  restaurant_id: number;

  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.media, {
    nullable: false,
  })
  @JoinColumn({
    name: 'restaurant_id',
    referencedColumnName: 'restaurant_id',
  })
  restaurant?: RestaurantEntity;

  @Column('text', {
    nullable: false,
  })
  media_url: string;

  @Column('text', {
    nullable: false,
  })
  name?: string;

  @Column('text', {
    nullable: true,
  })
  description?: string;

  @Column('int4', {
    nullable: false,
  })
  media_type_id?: number;

  @ManyToOne(() => MediaTypeEntity, mediaType => mediaType.media, {
    nullable: false,
  })
  @JoinColumn({
    name: 'media_type_id',
    referencedColumnName: 'media_type_id',
  })
  media_type?: MediaTypeEntity;

  @Column('timestamp with time zone', {
    nullable: false,
    select: true,
  })
  created_at?: string;

  @Column('timestamp with time zone', {
    nullable: false,
    select: false,
  })
  updated_at?: string;

  @Column('timestamp with time zone', {
    select: true,
    nullable: true,
  })
  deleted_at?: string;

  @OneToMany(() => RestaurantProfileAlbumMediaEntity, restaurantProfileAlbumMedia => restaurantProfileAlbumMedia.media)
  restaurant_profile_album_media?: Array<RestaurantProfileAlbumMediaEntity>;

  @OneToMany(() => RestaurantImageEntity, restaurantImage => restaurantImage.media)
  restaurant_images?: Array<RestaurantImageEntity>;

  @OneToMany(() => ModifierMediaEntity, modifierMedia => modifierMedia.media)
  modifierMedia?: Array<ModifierMediaEntity>;

  @OneToMany(() => RestaurantProfileMediaEntity, mediaLink => mediaLink.media)
  mediaLink?: Array<RestaurantProfileMediaEntity>;

  @OneToMany(() => ProfileCardsMediaEntity, mediaLink => mediaLink.media)
  cardsMedia?: Array<ProfileCardsMediaEntity>;

  @OneToMany(() => AnnouncementImageEntity, mediaLink => mediaLink.media)
  announcementsMedia?: Array<AnnouncementImageEntity>;

  @OneToMany(() => MenuItemMediaEntity, menuItemMedia => menuItemMedia.media)
  menuItemMedia?: Array<MenuItemMediaEntity>;

  @OneToMany(() => MenuItemVideoThumbnailEntity, menuItemVideoThumbnail => menuItemVideoThumbnail.media)
  menuItemVideoThumbnail?: Array<MenuItemVideoThumbnailEntity>;

  @OneToMany(() => DiscoveryContentMediaEntity, discoveryContentMedia => discoveryContentMedia.mediaLibrary)
  mediaContent?: Array<DiscoveryContentMediaEntity>;

  constructor(media_url: string, media_type_id: number, restaurant_id: number, name?: string, media_id?: number) {
    this.media_type_id = media_type_id;
    this.media_url = media_url;
    this.restaurant_id = restaurant_id;
    this.name = name;

    if (media_id) {
      this.media_id = media_id;
    }
  }

  static createEntityFromRequest(url: string, restaurantID: number, type: MediaType, name?: string): MediaEntity {
    return new MediaEntity(url, type === MediaType.IMAGE ? IMAGE_TYPE_ID : VIDEO_TYPE_ID, restaurantID, name || url);
  }

  toResponse(): MediaResponseInterface {
    return {
      mediaID: this.media_id,
      mediaUrl: this.media_type_id === IMAGE_TYPE_ID ? obtainImage(this.media_url) ?? '' : obtainMedia(this.media_url, 'video') ?? '',
      type: this.media_type_id === IMAGE_TYPE_ID ? MediaType.IMAGE : MediaType.VIDEO,
      createdAt: this.created_at,
      name: this.name || this.media_url,
    } as MediaResponseInterface;
  }
}
