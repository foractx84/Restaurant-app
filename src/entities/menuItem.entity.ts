import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateMenuItemRequestInterface, MenuItemDBInterface } from '@interfaces/menuItem.interface';
import { MenuSectionEntity } from '@/entities/menuSections.entity';
import { MenuItemSizeEntity } from '@/entities/menuItemSize.entity';
import { MenuItemsRestrictionsEntity } from '@/entities/menuItemsRestrictions.entity';
import { MenuItemPairingsEntity } from '@/entities/menuItemPairings.entity';
import { MenuItemMediaEntity } from './menuItemMedia.entity';
import { ModifierGroupToMenuItemLinkEntity } from './modifierGroupToMenuItemLink.entity';

@Entity({ name: 'menu_items' })
export class MenuItemEntity implements MenuItemDBInterface {
  @PrimaryGeneratedColumn()
  menu_item_id: number;

  @Column('text', {
    nullable: false,
  })
  name: string;

  @Column('text')
  description: string;

  @Column('text')
  image_url: string;

  @Column('uuid')
  menu_item_url_id: string;

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
    nullable: false,
  })
  deleted: boolean;

  @Column('int4', {
    select: true,
    nullable: true,
  })
  calories?: number;

  @Column('text', {
    nullable: false,
  })
  category: string;

  @Column('boolean', {
    nullable: false,
    default: false,
    select: true,
  })
  is_hidden: boolean;

  @Column('boolean', {
    nullable: false,
    default: false,
    select: true,
  })
  is_featured: boolean;

  @Column('text', {
    name: 'external_id',
    nullable: true,
    select: true,
  })
  external_id?: string;

  @ManyToOne(() => MenuSectionEntity, menu_sections => menu_sections.menu_items, {
    nullable: false,
  })
  @JoinColumn({
    name: 'menu_section_id',
    referencedColumnName: 'menu_section_id',
  })
  menu_section_id: number;

  @Column('int4', {
    name: 'base_item_size_id',
    nullable: false,
    select: true,
  })
  base_item_size_id: number;

  @OneToOne(() => MenuItemSizeEntity, menu_item_sizes => menu_item_sizes.menu_item_id, {
    nullable: true,
  })
  @JoinColumn({
    name: 'base_item_size_id',
    referencedColumnName: 'id',
  })
  base_item_size?: MenuItemSizeEntity;

  @OneToMany(() => MenuItemsRestrictionsEntity, menuItemRestrictions => menuItemRestrictions.menu_item_id)
  menu_item_restrictions: Array<MenuItemsRestrictionsEntity>;

  @OneToMany(() => MenuItemSizeEntity, menu_item_sizes => menu_item_sizes.menu_item_id)
  menu_item_sizes?: Array<MenuItemSizeEntity>;

  @OneToMany(() => MenuItemPairingsEntity, menuItemPairings => menuItemPairings.menu_item_id)
  menu_item_pairings: Array<MenuItemPairingsEntity>;

  @OneToMany(() => MenuItemMediaEntity, menuItemMedia => menuItemMedia.menu_item_id)
  media?: Array<MenuItemMediaEntity>;

  @OneToMany(() => ModifierGroupToMenuItemLinkEntity, modifierGroupToMenuItemLinks => modifierGroupToMenuItemLinks.menuItem)
  modifierGroupToMenuItemLinks?: Array<ModifierGroupToMenuItemLinkEntity>;

  static createEntityFromCreateRequest(request: CreateMenuItemRequestInterface): MenuItemEntity {
    const entity = new MenuItemEntity(request.name, request.category, null, request.description, request.menuSectionID, null, request.calories);
    entity.external_id = request.externalID ?? null;
    if (typeof request.isFeatured === 'boolean') {
      entity.is_featured = request.isFeatured;
    }
    if (typeof request.isHidden === 'boolean') {
      entity.is_hidden = request.isHidden;
    }
    return entity;
  }

  constructor(
    name: string,
    category: string,
    menu_item_id?: number,
    description?: string,
    menu_section_id?: number,
    list_order?: number,
    calories?: number,
  ) {
    this.name = name;
    this.list_order = list_order;
    this.calories = calories;
    this.category = category;
    this.menu_section_id = menu_section_id;

    if (menu_item_id) {
      this.menu_item_id = menu_item_id;
    }

    if (menu_section_id) {
      this.menu_section_id = menu_section_id;
    }

    if (typeof calories === 'number' || calories == null) {
      // handle zero too
      this.calories = calories;
    }

    if (typeof list_order === 'number') {
      // handle zero too
      this.list_order = list_order;
    }

    if (description || description === '') {
      this.description = description ?? null;
    }
  }
}
