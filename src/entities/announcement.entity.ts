import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AnnouncementsDBInterface } from '@interfaces/announcements.interface';
import { AnnouncementTypeEntity } from '@entities/announcementType.entity';
import { RestaurantEntity } from '@entities/restaurant.entity';
import { AnnouncementImageEntity } from '@entities/announcementImage.entity';

@Entity({ name: 'announcements' })
export class AnnouncementEntity implements AnnouncementsDBInterface {
  @PrimaryGeneratedColumn()
  announcement_id?: number;

  @Column('text', {
    nullable: false,
    select: true,
  })
  name?: string;

  @Column('text', {
    select: true,
    nullable: false,
  })
  title?: string;

  @Column('text', {
    select: true,
    nullable: false,
  })
  description?: string;

  @Column('timestamp with time zone', {
    select: true,
    nullable: false,
  })
  start_date: Date;

  @Column('timestamp with time zone', {
    select: true,
    nullable: false,
  })
  end_date: Date;

  @Column('boolean', {
    default: false,
    nullable: false,
    select: true,
  })
  hidden?: boolean;

  @Column('int4', {
    nullable: false,
  })
  restaurant_id?: number;

  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.announcements, {
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'restaurant_id' })
  restaurant?: RestaurantEntity;

  @Column('int4', {
    nullable: false,
  })
  announcement_type_id?: number;

  @Column('boolean', {
    default: false,
    nullable: false,
    select: true,
  })
  submit_email?: boolean;

  @ManyToOne(() => AnnouncementTypeEntity, announcement_type => announcement_type.announcements, {
    nullable: false,
  })
  @JoinColumn({ name: 'announcement_type_id', referencedColumnName: 'announcement_type_id' })
  announcement_type?: AnnouncementTypeEntity;

  @Column('timestamp without time zone', {
    select: false,
    nullable: true,
  })
  deleted_at?: string;

  @Column('timestamp without time zone', {
    select: false,
    nullable: false,
  })
  created_at?: string;

  @Column('timestamp without time zone', {
    select: false,
    nullable: false,
  })
  updated_at?: string;

  @OneToMany(() => AnnouncementImageEntity, announcement_image => announcement_image.announcement)
  announcement_images?: Array<AnnouncementImageEntity>;
}
