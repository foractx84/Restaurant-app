import { MenusDBInterface } from '@interfaces/menus.interface';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

import { RestaurantEntity } from './restaurant.entity';
import { MenuHoursEntity } from './menuHours.entity';
import { MenuSectionEntity } from './menuSections.entity';
import { MenuDisclaimerEntity } from './disclaimer.entity';

@Entity({ name: 'menus', orderBy: { list_order: 'ASC' } })
export class MenuEntity implements MenusDBInterface {
  @PrimaryGeneratedColumn()
  menu_id: number;

  @Column('text', {
    nullable: false,
  })
  name: string;

  @Column('int4', {
    select: true,
  })
  list_order: number;

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

  @Column('boolean', {
    default: false,
    nullable: false,
    select: true,
  })
  is_prix_fixe: boolean;

  @Column('text', {
    name: 'external_id',
    nullable: true,
    select: true,
  })
  external_id?: string;

  @Column('int4', {
    select: true,
  })
  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.menus, {
    nullable: false,
  })
  @JoinColumn({
    name: 'restaurant_id',
    referencedColumnName: 'restaurant_id',
  })
  restaurant_id: number;

  @OneToMany(() => MenuHoursEntity, menuHour => menuHour.menu_id)
  hours: Array<MenuHoursEntity>;

  @OneToMany(() => MenuSectionEntity, menuSection => menuSection.menu_id)
  sections: Array<MenuSectionEntity>;

  @OneToMany(() => MenuDisclaimerEntity, disclaimer => disclaimer.menu_id)
  disclaimers: Array<MenuDisclaimerEntity>;

  @Column('boolean', {
    nullable: false,
  })
  deleted: boolean;

  @Column('boolean', {
    nullable: false,
    default: false,
  })
  is_hidden: boolean;
}
