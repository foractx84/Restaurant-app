import { Entity, JoinColumn, OneToOne, ManyToOne, PrimaryGeneratedColumn, Column } from 'typeorm';
import { MenuItemSizeDBInterface } from '@interfaces/itemSize.interface';
import { MenuItemEntity } from '@/entities/menuItem.entity';
import { MenuItemSizeTypesEntity } from '@/entities/menuItemSizeTypes.entity';

@Entity({ name: 'menu_items_sizes' })
export class MenuItemSizeEntity implements MenuItemSizeDBInterface {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column('int4', {
    nullable: false,
  })
  @OneToOne(() => MenuItemEntity, menu_items => menu_items.menu_item_id, {
    nullable: false,
  })
  @JoinColumn({
    name: 'menu_item_id',
    referencedColumnName: 'menu_item_id',
  })
  menu_item_id: number;

  @Column('int4', {
    name: 'item_size_id',
    nullable: false,
    select: true,
  })
  item_size_id: number;

  @ManyToOne(() => MenuItemSizeTypesEntity, menu_items_size_types => menu_items_size_types.id, {
    nullable: false,
  })
  @JoinColumn({
    name: 'item_size_id',
    referencedColumnName: 'id',
  })
  item_sizes?: MenuItemSizeTypesEntity;
}
