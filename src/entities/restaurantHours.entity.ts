import { Day } from '@/enums/day';
import { RestaurantHoursDBInterface } from '@/interfaces/restaurantHours.interface';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';

@Entity({ name: 'restaurant_hours' })
export class RestaurantHoursEntity implements RestaurantHoursDBInterface {
  @PrimaryGeneratedColumn()
  restaurant_hours_id: number;

  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.hours, {
    nullable: false,
  })
  @JoinColumn({
    name: 'restaurant_id',
    referencedColumnName: 'restaurant_id',
  })
  @Column('int4', {
    nullable: false,
  })
  restaurant_id?: number;

  @Column({
    type: 'enum',
    enum: Day,
    select: true,
    nullable: false,
  })
  day: Day;

  @Column('text', {
    select: true,
    nullable: false,
  })
  start: string;

  @Column('text', {
    select: true,
    nullable: false,
  })
  end: string;

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
}
