import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ModifierEntity } from './modifier.entity';
import { ModifierPriceOverrideInterface } from '@interfaces/modifierPriceOverride.interface';

/**
 * One override rule for a modifier's price (e.g. Otter's per-service-slug or per-fulfillment-mode
 * priceOverrides on a menu item, which modifiers get for free since Otter models a modifier as an
 * item). Layered on top of the base ModifierEntity.price. Not yet populated by any sync path.
 */
@Entity({ name: 'modifier_price_overrides' })
export class ModifierPriceOverrideEntity implements ModifierPriceOverrideInterface {
  @PrimaryGeneratedColumn({ name: 'modifier_price_override_id', type: 'int4' })
  id?: number;

  @Column('int4', {
    name: 'modifier_id',
    nullable: false,
  })
  modifierID: number;

  @Column('text', {
    name: 'external_party',
    nullable: false,
  })
  externalParty: string;

  @Column('text', {
    name: 'rule_type',
    nullable: false,
  })
  ruleType: string;

  @Column('text', {
    name: 'rule_value',
    nullable: false,
  })
  ruleValue: string;

  @Column('int4', {
    name: 'price',
    nullable: false,
  })
  price: number;

  @Column('timestamptz', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamptz', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @Column('timestamptz', { name: 'deleted_at', select: false })
  deletedAt?: Date;

  @ManyToOne(() => ModifierEntity, modifier => modifier.priceOverrides, {
    nullable: false,
  })
  @JoinColumn({ name: 'modifier_id' })
  modifier?: ModifierEntity;

  constructor(modifierID: number, externalParty: string, ruleType: string, ruleValue: string, price: number, id?: number) {
    this.id = id ?? null;
    this.modifierID = modifierID;
    this.externalParty = externalParty;
    this.ruleType = ruleType;
    this.ruleValue = ruleValue;
    this.price = price;
  }
}
