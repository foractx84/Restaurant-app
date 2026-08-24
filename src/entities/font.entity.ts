import { FontCategory } from '@/enums/fontCategory';
import { FontDBInterface } from '@/interfaces/fonts.interface';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'fonts' })
export class FontEntity implements FontDBInterface {
  @PrimaryColumn('text')
  title: string;

  @Column({
    type: 'enum',
    enum: FontCategory,
    nullable: false,
  })
  category: FontCategory;

  @Column('text', { name: 'usage_notes', nullable: true })
  usage_notes?: string;

  @Column('boolean', { name: 'is_selectable', nullable: false, default: true })
  is_selectable: boolean;

  @Column('int4', { name: 'list_order', nullable: false })
  list_order: number;

  @Column('timestamp', { name: 'created_at', select: false, nullable: false })
  created_at?: Date;

  @Column('timestamp', { name: 'updated_at', select: false, nullable: false })
  updated_at?: Date;
}
