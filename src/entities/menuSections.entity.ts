import { MenuSectionsDBInterface } from '@interfaces/menuSections.interface';

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

import { MenuEntity } from './menus.entity';
import { MenuItemEntity } from '@/entities/menuItem.entity';

@Entity({ name: 'menu_sections' })
export class MenuSectionEntity implements MenuSectionsDBInterface {
  @PrimaryGeneratedColumn()
  menu_section_id: number;

  @Column('text', {
    nullable: false,
  })
  name: string;

  @Column('int4', {
    select: true,
  })
  @ManyToOne(() => MenuEntity, menu => menu.sections, {
    cascade: ['insert'],
    nullable: false,
  })
  @JoinColumn({ name: 'menu_id', referencedColumnName: 'menu_id' })
  menu_id: number;

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

  @Column('int4', {
    select: true,
  })
  list_order: number;

  @OneToMany(() => MenuItemEntity, menu_item => menu_item.menu_section_id)
  menu_items?: Array<MenuItemEntity>;

  @Column('boolean', {
    nullable: false,
  })
  deleted: boolean;

  @Column('text', {
    select: true,
    nullable: true,
  })
  message: string;

  @Column('boolean', {
    nullable: false,
    default: false,
    select: true,
  })
  is_hidden: boolean;

  @Column('text', {
    name: 'external_id',
    nullable: true,
    select: true,
  })
  external_id?: string;
}
