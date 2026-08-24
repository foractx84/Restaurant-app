import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TagsDBInterface } from '@interfaces/tags.interface';
import { MenuItemsTagsEntity } from './menuItemsTags.entity';

@Entity({ name: 'tags' })
export class TagsEntity implements TagsDBInterface {
  @PrimaryGeneratedColumn()
  tag_id: number;

  @Column('text', {
    nullable: false,
    select: true,
  })
  name: string;

  @Column('text', {
    select: true,
    nullable: false,
  })
  color: string;

  @Column('int4', {
    nullable: true,
  })
  restaurant_id: number;

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

  @OneToMany(() => MenuItemsTagsEntity, menuItemsTags => menuItemsTags.tag_id)
  menu_items_tags?: Array<MenuItemsTagsEntity>;
}
