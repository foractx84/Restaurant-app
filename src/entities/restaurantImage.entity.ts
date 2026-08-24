import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';
import { RestaurantImageTypeEntity } from './restaurantImageType.entity';
import { MediaEntity } from './media.entity';

@Entity({ name: 'restaurant_images' })
export class RestaurantImageEntity {
  @PrimaryGeneratedColumn()
  restaurant_image_id?: number;

  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.images, {
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'restaurant_id' })
  @Column('int4', {
    nullable: false,
  })
  restaurant_id: number;

  @Column('text', {
    nullable: false,
  })
  image_url: string;

  @ManyToOne(() => RestaurantImageTypeEntity, imageType => imageType.restaurant_image_type_id, {
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_image_type_id', referencedColumnName: 'restaurant_image_type_id' })
  @Column('int4', {
    nullable: false,
  })
  restaurant_image_type_id: number;

  @Column('text', {
    nullable: false,
    default: 0, // safety net
  })
  list_order?: number;

  @Column('boolean', {
    default: false,
    nullable: false,
    select: false,
  })
  deleted?: boolean;

  @Column('timestamp', {
    select: false,
    nullable: false,
  })
  created_at?: string;

  @Column('timestamp', {
    select: false,
    nullable: false,
  })
  updated_at?: string;

  @Column('int4', {
    nullable: false,
  })
  media_id?: number;

  @ManyToOne(() => MediaEntity, media => media.restaurant_images, {
    nullable: false,
  })
  @JoinColumn({ name: 'media_id', referencedColumnName: 'media_id' })
  media?: MediaEntity;
}
