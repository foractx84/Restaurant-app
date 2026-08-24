import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';
import { RestaurantProfileAlbumsDBInterface } from '@/interfaces/restaurantProfileAlbums.interface';
import { RestaurantProfileAlbumMediaEntity } from './restaurantProfileAlbumMedia.entity';

@Entity({ name: 'restaurant_profile_albums' })
export class RestaurantProfileAlbumsEntity implements RestaurantProfileAlbumsDBInterface {
  @PrimaryGeneratedColumn()
  restaurant_profile_album_id?: number;

  @Column('int4', {
    nullable: false,
  })
  restaurant_id?: number;

  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.restaurant_profile_albums, {
    nullable: false,
  })
  @JoinColumn({
    name: 'restaurant_id',
    referencedColumnName: 'restaurant_id',
  })
  restaurant?: RestaurantEntity;

  @Column('text', {
    nullable: true,
  })
  name?: string;

  @Column('text', {
    nullable: true,
  })
  description?: string;

  @Column('int4', {
    nullable: true,
  })
  list_order?: number;

  @Column('timestamp with time zone', {
    nullable: false,
  })
  created_at?: string;

  @Column('timestamp with time zone', {
    nullable: false,
  })
  updated_at?: string;

  @Column('timestamp with time zone', {
    nullable: true,
    select: true,
  })
  deleted_at?: string;

  @Column('boolean', {
    default: false,
    nullable: false,
  })
  is_hidden?: boolean;

  @OneToMany(() => RestaurantProfileAlbumMediaEntity, restaurantProfileAlbumMedia => restaurantProfileAlbumMedia.restaurant_profile_album)
  restaurant_profile_album_media?: RestaurantProfileAlbumMediaEntity[];
}
