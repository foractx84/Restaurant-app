// ModifierToModifierGroupLink.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from 'typeorm';
import { ModifierGroupEntity } from './modifierGroup.entity';
import { ModifierEntity } from './modifier.entity';
import { ModifierToModifierGroupLinkInterface } from '@/interfaces/modifierToModifierGroupLink.interface';

@Entity('modifier_to_modifier_group_link')
export class ModifierToModifierGroupLinkEntity implements ModifierToModifierGroupLinkInterface {
  @PrimaryGeneratedColumn({ name: 'modifier_to_modifier_group_link_id', type: 'int4' })
  modifierToModifierGroupLinkID: number;

  @Column('int4', {
    name: 'modifier_id',
    nullable: false,
    select: true,
  })
  modifierID: number;

  @Column('int4', {
    name: 'modifier_group_id',
    nullable: false,
    select: true,
  })
  modifierGroupID: number;

  @Column('int4', {
    name: 'list_order',
    nullable: false,
    select: true,
  })
  listOrder: number;

  @ManyToOne(() => ModifierEntity, modifier => modifier.modifierToModifierGroupLinks, {
    nullable: false,
  })
  @JoinColumn({ name: 'modifier_id', referencedColumnName: 'modifierID' })
  modifier?: ModifierEntity;

  @ManyToOne(() => ModifierGroupEntity, modifierGroup => modifierGroup.modifierToModifierGroupLinks, {
    nullable: false,
  })
  @JoinColumn({ name: 'modifier_group_id', referencedColumnName: 'modifierGroupID' })
  modifierGroup?: ModifierGroupEntity;
}
