import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ManagerRestaurantsDBInterface } from '@interfaces/users.interface';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { ManagerEntity } from '@/entities/manager.entity';

@Entity({ name: 'manager_restaurants' })
export class ManagerRestaurantsEntity implements ManagerRestaurantsDBInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int4', {
    nullable: false,
  })
  @ManyToOne(() => ManagerEntity, manager => manager.id, {
    cascade: ['insert'],
    nullable: false,
  })
  @JoinColumn({ name: 'external_user_id', referencedColumnName: 'id' })
  external_user_id: number;

  @Column('int4', {
    nullable: false,
  })
  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.restaurant_id, {
    cascade: ['insert'],
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'restaurant_id' })
  restaurant_id: number;
}
