import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';
import { EventSettingsDBInterface } from '@interfaces/eventSettings.interface';

@Entity({ name: 'event_settings' })
export class EventSettingsEntity implements EventSettingsDBInterface {
  @PrimaryGeneratedColumn()
  event_setting_id?: number;

  @Column('int4', { nullable: false })
  restaurant_id: number;

  @Column('varchar', { length: 200, nullable: false, default: '' })
  section_title: string;

  @Column('text', { nullable: false, default: '' })
  events_text: string;

  @Column('text', { nullable: true })
  deck_url?: string;

  @Column('boolean', { nullable: false, default: false })
  is_inquiry_form_enabled: boolean;

  @Column('text', { nullable: true })
  notification_email?: string;

  @Column('timestamptz', { nullable: false })
  created_at?: string;

  @Column('timestamptz', { nullable: false })
  updated_at?: string;

  @OneToOne(() => RestaurantEntity, { nullable: false })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'restaurant_id' })
  restaurant?: RestaurantEntity;
}
