import { MenuHours, MenuHoursDBInterface } from '@interfaces/menuHours.interface';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

import { MenuEntity } from './menus.entity';

@Entity({ name: 'menu_hours' })
export class MenuHoursEntity implements MenuHoursDBInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MenuEntity, menu => menu.hours, {
    cascade: ['insert'],
    nullable: false,
  })
  @JoinColumn({ name: 'menu_id', referencedColumnName: 'menu_id' })
  menu_id: number;

  @Column('text')
  day: string;

  @Column('text')
  start: string;

  @Column('text')
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

  constructor(menu_id: number, day: string, start: string, end: string, id?: number) {
    if (id) {
      this.id = id;
    }
    this.menu_id = menu_id;
    this.day = day;
    this.start = start;
    this.end = end;
  }

  toMenuHours(): MenuHours {
    return {
      id: this.id,
      day: this.day,
      start: this.start,
      end: this.end,
      menuID: this.menu_id,
    } as MenuHours;
  }
}
