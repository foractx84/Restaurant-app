import { RestaurantSocialsDBInterface } from '@/interfaces/restaurantSocials.interface';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';

@Entity({ name: 'restaurant_socials' })
export class RestaurantSocialsEntity implements RestaurantSocialsDBInterface {
  @PrimaryGeneratedColumn()
  restaurant_socials_id: number;

  @Column('text', {
    nullable: true,
  })
  facebook: string;

  @Column('text', {
    nullable: true,
  })
  instagram: string;

  @Column('text', {
    nullable: true,
  })
  tiktok: string;

  @Column('text', {
    nullable: true,
  })
  snapchat: string;

  @Column('text', {
    nullable: true,
  })
  twitter: string;

  @Column('timestamp', {
    select: false,
    nullable: false,
  })
  created_at: string;

  @Column('timestamp', {
    select: false,
    nullable: false,
  })
  updated_at: string;

  @OneToOne(() => RestaurantEntity, restaurant => restaurant.socials, {
    nullable: false,
  })
  @JoinColumn({
    name: 'restaurant_id',
    referencedColumnName: 'restaurant_id',
  })
  restaurant: RestaurantEntity;

  @Column({
    type: 'int',
    nullable: false,
  })
  restaurant_id: number;
}
