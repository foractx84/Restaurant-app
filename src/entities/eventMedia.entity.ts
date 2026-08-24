import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';
import { EventMediaDBInterface, EventMediaType } from '@interfaces/eventMedia.interface';

@Entity({ name: 'event_media' })
export class EventMediaEntity implements EventMediaDBInterface {
  @PrimaryGeneratedColumn()
  event_media_id?: number;

  @Column('int4', { nullable: false })
  restaurant_id: number;

  @Column('text', { nullable: false })
  media_url: string;

  @Column('varchar', { length: 10, nullable: false })
  media_type: EventMediaType;

  @Column('int4', { nullable: false })
  list_order: number;

  @Column('text', { nullable: true })
  alt_text?: string;

  @Column('timestamptz', { nullable: false })
  created_at?: string;

  @Column('timestamptz', { nullable: false })
  updated_at?: string;

  @Column('timestamptz', { nullable: true })
  deleted_at?: string;

  @ManyToOne(() => RestaurantEntity, { nullable: false })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'restaurant_id' })
  restaurant?: RestaurantEntity;
}
