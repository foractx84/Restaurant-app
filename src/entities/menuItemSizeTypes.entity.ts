import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MenuItemSizeTypesDBInterface } from '@interfaces/itemSize.interface';
import { MenuItemSizeEntity } from '@/entities/menuItemSize.entity';

@Entity({ name: 'menu_items_size_types' })
export class MenuItemSizeTypesEntity implements MenuItemSizeTypesDBInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', {
    nullable: false,
  })
  label: string;

  @Column('integer', {
    nullable: false,
  })
  price: number;

  @Column('text', {
    nullable: false,
  })
  price_override: string;

  @OneToMany(() => MenuItemSizeEntity, menu_items_sizes => menu_items_sizes.item_sizes)
  menu_items_sizes?: Array<MenuItemSizeEntity>;
}
