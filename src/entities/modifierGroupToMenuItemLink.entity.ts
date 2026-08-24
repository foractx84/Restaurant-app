// ModifierGroupToMenuItemLink.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { ModifierGroupEntity } from './modifierGroup.entity';
import { MenuItemEntity } from './menuItem.entity';
import { ModifierGroupToMenuItemLinkInterface } from '@/interfaces/modifierGroupToMenuItemLink.interface';

@Entity('modifier_group_to_menu_item_link')
export class ModifierGroupToMenuItemLinkEntity implements ModifierGroupToMenuItemLinkInterface {
  @PrimaryGeneratedColumn({ name: 'modifier_group_to_menu_item_link_id', type: 'int4' })
  modifierGroupToMenuItemLinkID: number;

  @Column('int4', {
    name: 'modifier_group_id',
    nullable: false,
    select: true,
  })
  modifierGroupID: number;

  @Column('int4', {
    name: 'menu_item_id',
    nullable: false,
    select: true,
  })
  menuItemID: number;

  @Column('int4', {
    name: 'list_order',
    nullable: false,
    select: true,
  })
  listOrder: number;

  @ManyToOne(() => ModifierGroupEntity, modifierGroup => modifierGroup.modifierGroupToMenuItemLinks, {
    nullable: false,
  })
  @JoinColumn({ name: 'modifier_group_id' })
  modifierGroup?: ModifierGroupEntity;

  @ManyToOne(() => MenuItemEntity, menuItem => menuItem.modifierGroupToMenuItemLinks, {
    nullable: false,
  })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem?: MenuItemEntity;
}
