import { Entity, PrimaryColumn, JoinColumn, Column, ManyToOne } from 'typeorm';
import { MenuItemEntity } from './menuItem.entity';

@Entity({ name: 'menu_item_pairings' })
export class MenuItemPairingsEntity {
  @Column('int4', {
    nullable: false,
  })
  @ManyToOne(() => MenuItemEntity, menu_items => menu_items.menu_item_id, {
    cascade: ['insert'],
    nullable: false,
  })
  @JoinColumn({ name: 'menu_item_id', referencedColumnName: 'menu_item_id' })
  menu_item_id: number;

  @PrimaryColumn()
  @ManyToOne(() => MenuItemEntity, menuItem => menuItem.menu_item_id, {
    cascade: ['insert'],
    nullable: false,
  })
  @JoinColumn({ name: 'menu_item_id', referencedColumnName: 'menu_item_id' })
  paired_item_id: number;
}
