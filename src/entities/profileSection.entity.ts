import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CreateProfileSectionRequest, ProfileSectionInterface, RestaurantProfileSectionInterface } from '@interfaces/profileSections.interface';
import { ProfilePageEntity } from '@/entities/profilePage.entity';
import { ProfileSectionTemplateEntity } from '@/entities/profileSectionTemplate.entity';
import { RestaurantProfileMediaEntity } from './restaurantProfileMedia.entity';
import { ProfileCardsEntity } from './profileCards.entity';

@Entity({ name: 'restaurant_profile_sections' })
export class ProfileSectionEntity implements RestaurantProfileSectionInterface {
  @PrimaryGeneratedColumn({ name: 'restaurant_profile_section_id', type: 'int4' })
  restaurantProfileSectionID?: number;

  @Column('int4', {
    name: 'restaurant_profile_page_id',
    nullable: false,
  })
  restaurantProfilePageID: number;

  @ManyToOne(() => ProfilePageEntity, profilePage => profilePage.profileSections, {
    nullable: false,
  })
  @JoinColumn({
    name: 'restaurant_profile_page_id',
    referencedColumnName: 'restaurantProfilePageID',
  })
  profilePage?: ProfilePageEntity;

  @Column('int4', {
    name: 'section_template_id',
    nullable: false,
  })
  sectionTemplateID?: number;

  @ManyToOne(() => ProfileSectionTemplateEntity, template => template.profileSections, {
    nullable: false,
  })
  @JoinColumn({ name: 'section_template_id', referencedColumnName: 'sectionTemplateID' })
  sectionTemplate?: ProfileSectionTemplateEntity;

  @Column('text', {
    name: 'name',
    nullable: false,
  })
  name: string;

  @Column('text', {
    name: 'title',
    nullable: true,
  })
  title?: string;

  @Column('text', {
    name: 'content',
    nullable: true,
  })
  content?: string;

  @Column('text', {
    name: 'url_path',
    nullable: true,
  })
  urlPath?: string;

  @Column('text', {
    name: 'sub_nav',
    nullable: true,
  })
  subNav?: string;

  @Column('int4', {
    name: 'list_order',
  })
  listOrder: number;

  @Column('boolean', {
    name: 'is_hidden',
    nullable: false,
    default: false,
  })
  isHidden: boolean;

  @Column('timestamp', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamp', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @Column('timestamp', { name: 'deleted_at', select: true })
  deletedAt?: Date;

  @OneToMany(() => RestaurantProfileMediaEntity, mediaLink => mediaLink.section)
  mediaLink?: Array<RestaurantProfileMediaEntity>;

  @OneToMany(() => ProfileCardsEntity, profileCards => profileCards.section)
  cards?: Array<ProfileCardsEntity>;

  constructor(profileSection: ProfileSectionInterface, restaurantProfilePageID: number, sectionTemplate?: ProfileSectionTemplateEntity) {
    const { content, isHidden, name, sectionID, subNav, urlPath, title } = profileSection ?? {};
    if (sectionID) {
      this.restaurantProfileSectionID = sectionID;
    }
    if (restaurantProfilePageID) {
      this.restaurantProfilePageID = restaurantProfilePageID;
    }

    if (sectionTemplate) {
      this.sectionTemplate = sectionTemplate;
    }

    this.name = name;
    this.title = title;
    this.content = content;
    this.urlPath = urlPath;
    this.subNav = subNav;
    this.isHidden = isHidden;
  }

  static createEntityFromCreateRequest(request: CreateProfileSectionRequest, sectionTemplate: ProfileSectionTemplateEntity): ProfileSectionEntity {
    return new ProfileSectionEntity(
      {
        name: request.name,
        title: request.title,
        content: request.content,
        template: sectionTemplate.template,
        urlPath: request.urlPath,
        subNav: request.subNav,
        isHidden: request.isHidden,
      },
      request.pageID,
      sectionTemplate,
    );
  }

  clone(): ProfileSectionEntity {
    const clonedSection = new ProfileSectionEntity(
      {
        content: this.content,
        isHidden: this.isHidden,
        name: this.name,
        sectionID: this.restaurantProfileSectionID,
        subNav: this.subNav,
        urlPath: this.urlPath,
        title: this.title,
        template: this.sectionTemplate.template,
      },
      this.restaurantProfilePageID,
      this.sectionTemplate,
    );

    clonedSection.createdAt = this.createdAt;
    clonedSection.updatedAt = this.updatedAt;
    clonedSection.deletedAt = this.deletedAt;

    return clonedSection;
  }

  buildProfileSectionResponse = (): ProfileSectionInterface =>
    ({
      sectionID: this.restaurantProfileSectionID,
      name: this.name,
      title: this.title ?? '',
      content: this.content ?? '',
      template: this.sectionTemplate?.template,
      urlPath: this.urlPath ?? '',
      subNav: this.subNav ?? '',
      isHidden: this.isHidden ?? false,
    } as ProfileSectionInterface);
}
