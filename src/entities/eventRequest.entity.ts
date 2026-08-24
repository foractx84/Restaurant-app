import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';
import { EventRequestDBInterface, EventRequestStatus } from '@interfaces/eventRequests.interface';

@Entity({ name: 'event_request' })
export class EventRequestEntity implements EventRequestDBInterface {
  @PrimaryGeneratedColumn()
  event_request_id?: number;

  @Column('int4', { nullable: false })
  restaurant_id: number;

  @Column('varchar', { length: 100, nullable: false })
  first_name: string;

  @Column('varchar', { length: 100, nullable: false })
  last_name: string;

  @Column('varchar', { length: 254, nullable: false })
  email: string;

  @Column('varchar', { length: 30, nullable: false })
  phone_number: string;

  @Column('varchar', { length: 200, nullable: true })
  company?: string;

  @Column('varchar', { length: 200, nullable: false })
  type_of_event: string;

  @Column('varchar', { length: 200, nullable: false })
  style_of_event: string;

  @Column('timestamptz', { nullable: false })
  event_at: string;

  @Column('int4', { nullable: false })
  number_of_people: number;

  @Column('text', { nullable: true })
  additional_information?: string;

  @Column('varchar', { length: 200, nullable: true })
  how_did_you_hear?: string;

  @Column('varchar', { length: 20, nullable: false, default: 'new' })
  status: EventRequestStatus;

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
