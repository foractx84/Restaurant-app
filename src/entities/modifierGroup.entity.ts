// ModifierGroup.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';
import { ModifierToModifierGroupLinkEntity } from './modifierToModiferGroupLink.entity';
import {
  CreateModifierGroupRequestInterface,
  CreateModifierGroupResponseInterface,
  EditModifierGroupRequestInterface,
  ModifierGroupInterface,
} from '@/interfaces/modifierGroup.interface';
import { ModifierGroupToMenuItemLinkEntity } from './modifierGroupToMenuItemLink.entity';
import { ModifierGroupToModifierLinkEntity } from './modifierGroupToModifierLink.entity';

@Entity('modifier_groups')
export class ModifierGroupEntity implements ModifierGroupInterface {
  @PrimaryGeneratedColumn({ name: 'modifier_group_id', type: 'int4' })
  modifierGroupID?: number;

  @Column('text', {
    name: 'label',
    nullable: false,
  })
  label?: string;

  @Column('text', {
    name: 'name',
    nullable: true,
  })
  name?: string;

  @Column('timestamp', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamp', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @Column('timestamp', { name: 'deleted_at', select: true })
  deletedAt?: Date;

  @Column('boolean', {
    name: 'is_hidden',
    nullable: false,
    default: false,
    select: true,
  })
  isHidden?: boolean;

  @Column('int4', {
    name: 'restaurant_id',
    nullable: false,
    select: true,
  })
  restaurantID?: number;

  @Column('text', {
    name: 'external_id',
    nullable: true,
    select: true,
  })
  externalID?: string;

  /** Minimum number of selections a customer must make in this group. NULL/0 means no min limit (see Documentation/OTTER_MODIFIER_GAP_ANALYSIS.md). */
  @Column('int4', {
    name: 'minimum_selections',
    nullable: true,
  })
  minimumSelections?: number | null;

  /** Maximum number of selections a customer can make in this group. NULL/0 means no max limit. */
  @Column('int4', {
    name: 'maximum_selections',
    nullable: true,
  })
  maximumSelections?: number | null;

  /** Maximum times a single modifier within this group can be selected (e.g. "up to 3 extra cheese"). */
  @Column('int4', {
    name: 'max_per_modifier_selection_quantity',
    nullable: true,
  })
  maxPerModifierSelectionQuantity?: number | null;

  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.modifierGroups, {
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'restaurant_id' })
  restaurant?: RestaurantEntity;

  @OneToMany(() => ModifierToModifierGroupLinkEntity, modifierToModifierGroupLinks => modifierToModifierGroupLinks.modifierGroup)
  modifierToModifierGroupLinks?: Array<ModifierToModifierGroupLinkEntity>;

  @OneToMany(() => ModifierGroupToMenuItemLinkEntity, modifierGroupToMenuItemLinks => modifierGroupToMenuItemLinks.modifierGroup)
  modifierGroupToMenuItemLinks?: Array<ModifierGroupToMenuItemLinkEntity>;

  /** Present when this group is nested under a parent modifier instead of (or in addition to) a menu item. */
  @OneToMany(() => ModifierGroupToModifierLinkEntity, modifierGroupToModifierLinks => modifierGroupToModifierLinks.modifierGroup)
  modifierGroupToModifierLinks?: Array<ModifierGroupToModifierLinkEntity>;

  constructor(label: string, name: string, isHidden?: boolean, restaurantID?: number, modifierGroupID?: number) {
    this.label = label;
    this.name = name ?? label;
    this.isHidden = isHidden ?? false;
    this.restaurantID = restaurantID;
    this.modifierGroupID = modifierGroupID;
  }

  static createEntityFromRequest(request: CreateModifierGroupRequestInterface, restaurantID: number): ModifierGroupEntity {
    const entity = new ModifierGroupEntity(request.label, request.name, null, restaurantID);
    entity.externalID = request.externalID ?? null;
    entity.minimumSelections = request.minimumSelections;
    entity.maximumSelections = request.maximumSelections;
    entity.maxPerModifierSelectionQuantity = request.maxPerModifierSelectionQuantity;
    return entity;
  }

  updateModifierGroup(editModifierGroupRequest: EditModifierGroupRequestInterface) {
    if (editModifierGroupRequest.name) {
      this.name = editModifierGroupRequest.name;
    }

    if (editModifierGroupRequest.label) {
      this.label = editModifierGroupRequest.label;
    }

    if (editModifierGroupRequest.minimumSelections !== undefined) {
      this.minimumSelections = editModifierGroupRequest.minimumSelections;
    }

    if (editModifierGroupRequest.maximumSelections !== undefined) {
      this.maximumSelections = editModifierGroupRequest.maximumSelections;
    }

    if (editModifierGroupRequest.maxPerModifierSelectionQuantity !== undefined) {
      this.maxPerModifierSelectionQuantity = editModifierGroupRequest.maxPerModifierSelectionQuantity;
    }
  }

  toResponse(): CreateModifierGroupResponseInterface {
    return {
      name: this.name,
      modifierGroupID: this.modifierGroupID,
      label: this.label,
      minimumSelections: this.minimumSelections,
      maximumSelections: this.maximumSelections,
      maxPerModifierSelectionQuantity: this.maxPerModifierSelectionQuantity,
    };
  }
}
