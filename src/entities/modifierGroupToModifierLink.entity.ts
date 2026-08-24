// ModifierGroupToModifierLink.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { ModifierGroupEntity } from './modifierGroup.entity';
import { ModifierEntity } from './modifier.entity';
import { ModifierGroupToModifierLinkInterface } from '@/interfaces/modifierGroupToModifierLink.interface';

/**
 * Links a modifier group to a *parent modifier* (as opposed to
 * ModifierGroupToMenuItemLinkEntity, which links a group to a menu item). This is what makes a
 * modifier group "nested" - e.g. Otter's modifier model where any item, including one used as a
 * modifier, can own its own modifier groups. Not yet populated by any sync path.
 */
@Entity('modifier_group_to_modifier_link')
export class ModifierGroupToModifierLinkEntity implements ModifierGroupToModifierLinkInterface {
  @PrimaryGeneratedColumn({ name: 'modifier_group_to_modifier_link_id', type: 'int4' })
  modifierGroupToModifierLinkID: number;

  @Column('int4', {
    name: 'modifier_group_id',
    nullable: false,
    select: true,
  })
  modifierGroupID: number;

  @Column('int4', {
    name: 'modifier_id',
    nullable: false,
    select: true,
  })
  modifierID: number;

  @Column('int4', {
    name: 'list_order',
    nullable: false,
    select: true,
  })
  listOrder: number;

  @ManyToOne(() => ModifierGroupEntity, modifierGroup => modifierGroup.modifierGroupToModifierLinks, {
    nullable: false,
  })
  @JoinColumn({ name: 'modifier_group_id' })
  modifierGroup?: ModifierGroupEntity;

  @ManyToOne(() => ModifierEntity, modifier => modifier.modifierGroupToModifierLinks, {
    nullable: false,
  })
  @JoinColumn({ name: 'modifier_id' })
  modifier?: ModifierEntity;
}
