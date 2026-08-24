import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AnnouncementTypesDBInterface } from '@interfaces/announcements.interface';
import { AnnouncementType } from '@/enums/announcementType';
import { AnnouncementEntity } from '@/entities/announcement.entity';

@Entity({ name: 'announcement_types' })
export class AnnouncementTypeEntity implements AnnouncementTypesDBInterface {
  @PrimaryGeneratedColumn()
  announcement_type_id: number;

  @Column({
    type: 'enum',
    enum: AnnouncementType,
    nullable: false,
  })
  type: AnnouncementType;

  @Column('text', {
    select: false,
    nullable: true,
  })
  description: string;

  @OneToMany(() => AnnouncementEntity, announcement => announcement.announcement_type)
  announcements?: Array<AnnouncementEntity>;
}
