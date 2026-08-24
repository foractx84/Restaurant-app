import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';
import { CateringRequestDBInterface, CateringRequestStatus } from '@interfaces/cateringRequests.interface';

@Entity({ name: 'catering_request' })
export class CateringRequestEntity implements CateringRequestDBInterface {
  @PrimaryGeneratedColumn()
  catering_request_id?: number;

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

  @Column('varchar', { length: 200, nullable: false })
  street_address_1: string;

  @Column('varchar', { length: 200, nullable: true })
  street_address_2?: string;

  @Column('varchar', { length: 100, nullable: false })
  city: string;

  @Column('varchar', { length: 50, nullable: false })
  state: string;

  @Column('varchar', { length: 20, nullable: false })
  zip_code: string;

  @Column('varchar', { length: 200, nullable: true })
  company?: string;

  @Column('int4', { nullable: false })
  number_of_people: number;

  @Column('varchar', { length: 200, nullable: false })
  type_of_event: string;

  @Column('timestamptz', { nullable: false })
  event_start_at: string;

  @Column('timestamptz', { nullable: false })
  event_end_at: string;

  @Column('varchar', { length: 200, nullable: true })
  style_of_catering?: string;

  @Column('text', { nullable: false })
  special_requests: string;

  @Column('text', { nullable: true })
  additional_information?: string;

  @Column('varchar', { length: 200, nullable: true })
  how_did_you_hear?: string;

  @Column('varchar', { length: 20, nullable: false, default: 'new' })
  status: CateringRequestStatus;

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
