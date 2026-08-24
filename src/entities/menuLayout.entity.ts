import { MenuLayout } from '@/enums/menuLayout';
import { MenuLayoutDBInterface } from '@/interfaces/menuLayout.interface';
import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantMenuLayoutEntity } from './restaurantMenuLayout.entity';

@Entity({ name: 'menu_layout' })
export class MenuLayoutEntity implements MenuLayoutDBInterface {
  @PrimaryGeneratedColumn()
  @JoinColumn({
    name: 'menu_layout_id',
    referencedColumnName: 'menu_layout_id',
  })
  menu_layout_id?: number;

  @Column({
    type: 'enum',
    enum: MenuLayout,
    select: true,
    nullable: false,
  })
  layout: MenuLayout;

  @OneToMany(() => RestaurantMenuLayoutEntity, restaurant => restaurant.menu_layout_id, {
    nullable: false,
  })
  restaurant_menu_layouts: Array<RestaurantMenuLayoutEntity>;
}
