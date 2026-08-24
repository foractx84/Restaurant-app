import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MenuItemsRestrictionsDBInterface } from '@interfaces/aggregate.interface';
import { MenuItemEntity } from '@/entities/menuItem.entity';
import { DietaryRestrictionEntity } from '@/entities/dietaryRestriction.entity';

@Entity({ name: 'menu_items_restrictions' })
export class MenuItemsRestrictionsEntity implements MenuItemsRestrictionsDBInterface {
  @Column('int4', {
    nullable: false,
  })
  @ManyToOne(() => MenuItemEntity, menu_items => menu_items.menu_item_id, {
    cascade: ['insert'],
    nullable: false,
  })
  @JoinColumn({ name: 'menu_item_id', referencedColumnName: 'menu_item_id' })
  menu_item_id: number;

  @PrimaryColumn()
  @ManyToOne(() => DietaryRestrictionEntity, restriction => restriction.restriction_id, {
    cascade: ['insert'],
    nullable: false,
  })
  @JoinColumn({ name: 'restriction_id', referencedColumnName: 'restriction_id' })
  restriction_id: number;
}
