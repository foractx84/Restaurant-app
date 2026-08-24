import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProfileSectionTemplateInterface } from '@interfaces/profileSectionTemplates.interface';
import { ProfileSectionEntity } from '@/entities/profileSection.entity';

@Entity({ name: 'restaurant_profile_section_templates' })
export class ProfileSectionTemplateEntity implements ProfileSectionTemplateInterface {
  @PrimaryGeneratedColumn({ name: 'section_template_id', type: 'int4' })
  sectionTemplateID: number;

  @Column('text', {
    name: 'template',
    nullable: false,
  })
  template: string;

  @Column('timestamp', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamp', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @OneToMany(() => ProfileSectionEntity, profileSection => profileSection.sectionTemplate)
  profileSections?: Array<ProfileSectionEntity>;
}
