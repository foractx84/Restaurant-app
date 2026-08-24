// ModifierMedia.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { MediaEntity } from './media.entity';
import { ModifierEntity } from './modifier.entity';
import { ModifierMediaInterface } from '@/interfaces/modifierMedia.interface';

@Entity('modifier_media')
export class ModifierMediaEntity implements ModifierMediaInterface {
  @PrimaryGeneratedColumn({ name: 'modifier_media_id', type: 'int4' })
  modifierMediaID: number;

  @Column('int4', {
    name: 'modifier_id',
    nullable: false,
    select: true,
  })
  modifierID: number;

  @Column('int4', {
    name: 'media_id',
    nullable: false,
    select: true,
  })
  mediaID: number;

  @ManyToOne(() => ModifierEntity, modifier => modifier.modifierMedia, {
    nullable: false,
  })
  @JoinColumn({ name: 'modifier_id', referencedColumnName: 'modifierID' })
  modifier?: ModifierEntity;

  @ManyToOne(() => MediaEntity, media => media.modifierMedia, {
    nullable: false,
  })
  @JoinColumn({ name: 'media_id', referencedColumnName: 'media_id' })
  media?: MediaEntity;
}
