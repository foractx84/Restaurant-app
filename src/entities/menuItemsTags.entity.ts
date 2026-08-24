import { MenuItemsTagsDBInterface } from '@/interfaces/menuItemsTags.interface';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MenuItemEntity } from './menuItem.entity';
import { TagsEntity } from './tags.entity';

@Entity({ name: 'menu_items_tags' })
export class MenuItemsTagsEntity implements MenuItemsTagsDBInterface {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column('timestamp', {
    select: false,
    nullable: false,
  })
  created_at?: string;

  @Column('timestamp', {
    select: false,
    nullable: false,
  })
  updated_at?: string;

  @Column('integer', {
    nullable: false,
  })
  @ManyToOne(() => TagsEntity, tags => tags.tag_id, {
    nullable: false,
  })
  @JoinColumn({
    name: 'tag_id',
    referencedColumnName: 'tag_id',
  })
  tag_id: number;

  @Column('integer', {
    nullable: false,
  })
  @OneToOne(() => MenuItemEntity, menu_item => menu_item.menu_item_id, {
    nullable: true,
  })
  @JoinColumn({
    name: 'menu_item_id',
    referencedColumnName: 'menu_item_id',
  })
  menu_item_id: number;
}
