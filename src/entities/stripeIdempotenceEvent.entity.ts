import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'stripe_idempotence_events' })
export class StripeIdempotenceEventEntity {
  @PrimaryGeneratedColumn()
  stripe_idempotence_event_id: number;

  @Column('text', {
    nullable: false,
    select: true,
  })
  event_id: string;

  @Column('timestamp without time zone', {
    select: false,
    nullable: false,
  })
  created_at: string;
}
