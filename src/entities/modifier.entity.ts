import { ModifierToModifierGroupLinkEntity } from './modifierToModiferGroupLink.entity';
import { ModifierMediaEntity } from './modifierMedia.entity';
import { ModifierGroupToModifierLinkEntity } from './modifierGroupToModifierLink.entity';
import { ModifierPriceOverrideEntity } from './modifierPriceOverride.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CreateModifierRequestInterface, ModifierResponse, EditModifierRequestInterface, ModifierInterface } from '@interfaces/modifier.interface';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { obtainImage } from '@utils/imageUtils';

@Entity({ name: 'modifiers' })
export class ModifierEntity implements ModifierInterface {
  @PrimaryGeneratedColumn({ name: 'modifier_id', type: 'int4' })
  modifierID?: number;

  @Column('text', {
    name: 'name',
    nullable: false,
  })
  name: string;

  @Column('text', {
    name: 'description',
    nullable: true,
  })
  description?: string;

  @Column('int4', {
    name: 'price',
    nullable: true,
  })
  price?: number;

  @Column('timestamp', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamp', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @Column('timestamp', { name: 'deleted_at', select: false })
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

  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.modifiers, {
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'restaurant_id' })
  restaurant?: RestaurantEntity;

  @OneToMany(() => ModifierToModifierGroupLinkEntity, modifierToModifierGroupLinks => modifierToModifierGroupLinks.modifier)
  modifierToModifierGroupLinks?: Array<ModifierToModifierGroupLinkEntity>;

  @OneToMany(() => ModifierMediaEntity, modifierMedia => modifierMedia.modifier)
  modifierMedia?: Array<ModifierMediaEntity>;

  /** Modifier groups nested under this modifier (this modifier acting as the parent "item"). */
  @OneToMany(() => ModifierGroupToModifierLinkEntity, modifierGroupToModifierLinks => modifierGroupToModifierLinks.modifier)
  modifierGroupToModifierLinks?: Array<ModifierGroupToModifierLinkEntity>;

  @OneToMany(() => ModifierPriceOverrideEntity, priceOverrides => priceOverrides.modifier)
  priceOverrides?: Array<ModifierPriceOverrideEntity>;

  constructor(name: string, modifierID?: number, price?: number, description?: string, isHidden?: boolean, restaurantID?: number) {
    this.modifierID = modifierID;
    this.description = description ?? null;
    this.name = name;
    this.price = price ?? null;
    this.isHidden = isHidden ?? false;
    this.restaurantID = restaurantID ?? null;
  }

  static createEntityFromRequest(request: CreateModifierRequestInterface, restaurantID: number): ModifierEntity {
    const entity = new ModifierEntity(request.name, null, request.price, request.description, request.isHidden ?? false, restaurantID);
    entity.externalID = request.externalID ?? null;
    return entity;
  }

  updateModifier(editModifierRequest: EditModifierRequestInterface) {
    if (editModifierRequest.name) {
      this.name = editModifierRequest.name;
    }

    if (editModifierRequest.description !== undefined && editModifierRequest.description != null) {
      this.description = editModifierRequest.description || null;
    }

    if (editModifierRequest?.price > -1) {
      this.price = editModifierRequest.price;
    }

    if (editModifierRequest.isHidden !== undefined) {
      this.isHidden = editModifierRequest.isHidden;
    }
  }

  toResponse(): ModifierResponse {
    return {
      modifierID: this.modifierID,
      name: this.name,
      description: this.description ?? '',
      price: this.price ?? 0,
      isHidden: this.isHidden,
      imageURL: obtainImage(this.modifierMedia?.[0]?.media?.media_url) ?? '',
    } as ModifierResponse;
  }
}
