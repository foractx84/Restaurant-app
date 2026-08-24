import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DietaryRestrictionsDBInterface } from '@interfaces/dietaryRestrictions.interface';
import { MenuItemsRestrictionsEntity } from '@/entities/menuItemsRestrictions.entity';

@Entity({ name: 'restrictions' })
export class DietaryRestrictionEntity implements DietaryRestrictionsDBInterface {
  @PrimaryGeneratedColumn()
  restriction_id: number;

  @Column('text', {
    nullable: false,
  })
  name: string;

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

  @OneToMany(() => MenuItemsRestrictionsEntity, menuItemRestrictions => menuItemRestrictions.restriction_id)
  menu_item_restrictions?: Array<MenuItemsRestrictionsEntity>;
}
