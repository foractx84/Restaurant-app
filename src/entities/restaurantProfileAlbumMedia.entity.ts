import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantProfileAlbumsEntity } from './restaurantProfileAlbums.entity';
import { MediaEntity } from './media.entity';
import { RestaurantProfileAlbumMediaDBInterface } from '@/interfaces/restaurantProfileAlbumMedia.interface';

@Entity({ name: 'restaurant_profile_album_media' })
export class RestaurantProfileAlbumMediaEntity implements RestaurantProfileAlbumMediaDBInterface {
  @PrimaryGeneratedColumn()
  restaurant_profile_album_media_id: number;

  @Column('int4', {
    nullable: false,
  })
  restaurant_profile_album_id: number;

  @ManyToOne(() => RestaurantProfileAlbumsEntity, restaurantProfileAlbums => restaurantProfileAlbums.restaurant_profile_album_media, {
    nullable: false,
  })
  @JoinColumn({
    name: 'restaurant_profile_album_id',
    referencedColumnName: 'restaurant_profile_album_id',
  })
  restaurant_profile_album?: RestaurantProfileAlbumsEntity;

  @Column('int4', {
    nullable: false,
  })
  media_id: number;

  @ManyToOne(() => MediaEntity, media => media.restaurant_profile_album_media, {
    nullable: false,
  })
  @JoinColumn({
    name: 'media_id',
    referencedColumnName: 'media_id',
  })
  media?: MediaEntity;

  @Column('int4', {
    nullable: true,
  })
  list_order: number;

  @Column('timestamp with time zone', {
    nullable: false,
  })
  created_at?: string;

  @Column('timestamp with time zone', {
    nullable: false,
  })
  updated_at?: string;

  @Column('timestamp with time zone', {
    select: true,
    nullable: true,
  })
  deleted_at?: string;
}
