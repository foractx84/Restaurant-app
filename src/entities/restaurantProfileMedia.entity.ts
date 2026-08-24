import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CreateRestaurantProfileMediaRequestInterface, RestaurantProfileMediaInterface } from '@/interfaces/restaurantProfileMedia.interface';
import { MediaEntity } from './media.entity';
import { ProfileSectionEntity } from './profileSection.entity';

@Entity('restaurant_profile_media')
export class RestaurantProfileMediaEntity implements RestaurantProfileMediaInterface {
  @PrimaryGeneratedColumn({ name: 'restaurant_profile_media_id', type: 'int4' })
  restaurantProfileMediaID: number;

  @Column('int4', {
    name: 'restaurant_profile_section_id',
    select: true,
    nullable: false,
  })
  restaurantProfileSectionID: number;

  @ManyToOne(() => ProfileSectionEntity, section => section.mediaLink, {
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_profile_section_id', referencedColumnName: 'restaurantProfileSectionID' })
  section?: ProfileSectionEntity;

  @Column('int4', {
    name: 'media_id',
    select: true,
    nullable: false,
  })
  mediaID: number;

  @ManyToOne(() => MediaEntity, media => media.mediaLink, {
    nullable: false,
  })
  @JoinColumn({ name: 'media_id', referencedColumnName: 'media_id' })
  media?: MediaEntity;

  @Column('int4', {
    name: 'list_order',
    select: false,
    nullable: true,
  })
  listOrder: number;

  @Column('timestamp', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamp', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @Column('timestamp', { name: 'deleted_at', select: false })
  deletedAt?: Date;

  constructor(restaurantProfileSectionID: number, mediaID: number, restaurantProfileMediaID?: number, listOrder?: number) {
    this.restaurantProfileSectionID = restaurantProfileSectionID;
    this.mediaID = mediaID;

    if (restaurantProfileMediaID) {
      this.restaurantProfileMediaID = restaurantProfileMediaID;
    }

    if (listOrder) {
      this.listOrder = listOrder;
    }
  }

  static createEntityFromRequest(request: CreateRestaurantProfileMediaRequestInterface): RestaurantProfileMediaEntity {
    return new RestaurantProfileMediaEntity(request.restaurantProfileSectionID, request.mediaID, request.restaurantProfileMediaID, request.listOrder);
  }
}
