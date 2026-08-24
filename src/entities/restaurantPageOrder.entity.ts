import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';
import { RestaurantPageOrderDBInterface } from '@interfaces/pageOrder.interface';

@Entity({ name: 'restaurant_page_order' })
export class RestaurantPageOrderEntity implements RestaurantPageOrderDBInterface {
  @PrimaryGeneratedColumn()
  restaurant_page_order_id?: number;

  @Column('int4', { nullable: false })
  restaurant_id: number;

  @Column('varchar', { length: 50, nullable: false })
  page_key: string;

  @Column('int4', { nullable: false, default: 0 })
  list_order: number;

  @Column('timestamptz', { nullable: false })
  created_at?: string;

  @Column('timestamptz', { nullable: false })
  updated_at?: string;

  @ManyToOne(() => RestaurantEntity, { nullable: false })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'restaurant_id' })
  restaurant?: RestaurantEntity;
}
