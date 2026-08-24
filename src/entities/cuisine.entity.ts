import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { RestaurantEntity } from '@entities/restaurant.entity';

@Entity({ name: 'cuisines' })
export class CuisineEntity {
  @PrimaryGeneratedColumn()
  cuisine_id: number;

  @Column('text', {
    nullable: false,
  })
  name: string;

  @Column('timestamp', {
    nullable: false,
  })
  date_created: string;

  @OneToMany(() => RestaurantEntity, restaurant => restaurant.cuisine_id)
  restaurants?: Array<RestaurantEntity>;
}
