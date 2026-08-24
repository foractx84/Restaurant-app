import { RestaurantMenuLayoutDBInterface } from '@/interfaces/restaurantMenuLayout.interface';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MenuLayoutEntity } from './menuLayout.entity';
import { RestaurantEntity } from './restaurant.entity';

@Entity({ name: 'restaurant_menu_layout' })
export class RestaurantMenuLayoutEntity implements RestaurantMenuLayoutDBInterface {
  @PrimaryGeneratedColumn()
  id?: number;

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

  @Column('integer', {
    nullable: false,
  })
  @ManyToOne(() => MenuLayoutEntity, layout => layout.menu_layout_id, {
    nullable: false,
  })
  @JoinColumn({
    name: 'menu_layout_id',
    referencedColumnName: 'menu_layout_id',
  })
  menu_layout_id: number;

  @Column('integer', {
    nullable: false,
  })
  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.restaurant_id, {
    nullable: false,
  })
  @JoinColumn({
    name: 'restaurant_id',
    referencedColumnName: 'restaurant_id',
  })
  restaurant_id: number;
}
