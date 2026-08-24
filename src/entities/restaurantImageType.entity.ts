import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn } from 'typeorm';
import { RestaurantImageEntity } from './restaurantImage.entity';
import { RestaurantImageType } from '@/enums/restaurantImageType';
import { RestaurantImageTypesDBInterface } from '@/interfaces/restaurantImageTypes.interface';

@Entity({ name: 'restaurant_image_types' })
export class RestaurantImageTypeEntity implements RestaurantImageTypesDBInterface {
  @PrimaryGeneratedColumn()
  restaurant_image_type_id: number;

  @OneToMany(() => RestaurantImageEntity, image => image.restaurant_image_type_id)
  @JoinColumn({ name: 'restaurant_image_type_id', referencedColumnName: 'restaurant_image_type_id' })
  images?: Array<RestaurantImageEntity>;

  @Column({
    nullable: false,
    unique: true,
    type: 'enum',
    enum: RestaurantImageType,
  })
  type: RestaurantImageType;

  @Column('text', {
    nullable: true,
  })
  description: string;
}
