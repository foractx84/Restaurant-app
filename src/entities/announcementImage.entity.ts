import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AnnouncementImageDBInterface } from '@interfaces/announcementImages.interface';
import { AnnouncementEntity } from '@/entities/announcement.entity';
import { MediaEntity } from '@entities/media.entity';

@Entity({ name: 'announcement_images' })
export class AnnouncementImageEntity implements AnnouncementImageDBInterface {
  @PrimaryGeneratedColumn()
  announcement_image_id?: number;

  @Column('int4', {
    nullable: false,
  })
  announcement_id?: number;

  @ManyToOne(() => AnnouncementEntity, announcement => announcement.announcement_images, {
    nullable: false,
  })
  @JoinColumn({ name: 'announcement_id', referencedColumnName: 'announcement_id' })
  announcement?: AnnouncementEntity;

  @Column('int4', {
    name: 'media_id',
    nullable: false,
  })
  mediaID?: number;

  @ManyToOne(() => MediaEntity, media => media.announcementsMedia, {
    nullable: false,
  })
  @JoinColumn({
    name: 'media_id',
    referencedColumnName: 'media_id',
  })
  media?: MediaEntity;

  @Column('text', {
    nullable: false,
    select: true,
  })
  image_url: string;

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

  constructor(announcement_id: number, mediaID: number, image_url: string) {
    this.announcement_id = announcement_id;
    this.mediaID = mediaID;
    this.image_url = image_url;
  }
}
