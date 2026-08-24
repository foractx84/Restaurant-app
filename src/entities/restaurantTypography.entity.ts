import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { RestaurantColorSettingsInterface, RestaurantFontSettingsInterface } from '@/interfaces/restaurantTypography.interface';

@Entity({ name: 'restaurant_typography' })
export class RestaurantTypographyEntity {
  @PrimaryColumn({ type: 'int4', name: 'restaurant_id' })
  restaurant_id: number;

  @Column('jsonb', { name: 'fonts', nullable: false })
  fonts: RestaurantFontSettingsInterface;

  @Column('jsonb', { name: 'colors', nullable: true })
  colors?: RestaurantColorSettingsInterface | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', select: false })
  created_at?: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', select: false })
  updated_at?: Date;
}
