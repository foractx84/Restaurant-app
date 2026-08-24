import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MediaTypeDBInterface } from '@/interfaces/mediaType.interface';
import { MediaType } from '@/enums/mediaType';
import { MediaEntity } from './media.entity';

@Entity({ name: 'media_types' })
export class MediaTypeEntity implements MediaTypeDBInterface {
  @PrimaryGeneratedColumn()
  media_type_id?: number;

  @Column({
    nullable: false,
    type: 'enum',
    enum: MediaType,
    unique: true,
  })
  type: MediaType;

  @Column('text', {
    nullable: true,
  })
  description: string;

  @Column('timestamp with time zone', {
    nullable: false,
    select: false,
  })
  created_at?: string;

  @Column('timestamp with time zone', {
    nullable: false,
    select: false,
  })
  updated_at?: string;

  @OneToMany(() => MediaEntity, media => media.media_type)
  media?: Array<MediaEntity>;
}
