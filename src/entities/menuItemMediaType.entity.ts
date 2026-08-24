import { MenuItemMediaType } from '@/enums/menuItemMediaTypes';
import { MenuItemMediaTypeDBInterface } from '@/interfaces/menuItemMediaType.interface';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MenuItemMediaEntity } from './menuItemMedia.entity';

@Entity({ name: 'menu_item_media_types' })
export class MenuItemMediaTypeEntity implements MenuItemMediaTypeDBInterface {
  @PrimaryGeneratedColumn()
  menu_item_media_type_id: number;

  @Column({
    type: 'enum',
    nullable: false,
    enum: MenuItemMediaType,
  })
  type: MenuItemMediaType;

  @Column('text', {
    nullable: true,
  })
  description: string;

  @OneToMany(() => MenuItemMediaEntity, menu_item_media => menu_item_media.menu_item_media_type_id)
  media?: Array<MenuItemMediaEntity>;
}
