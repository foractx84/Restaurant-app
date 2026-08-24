import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CreateProfilePageResponseInterface, RestaurantProfilePageInterface } from '@interfaces/profilePages.interface';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { ProfileSectionEntity } from '@/entities/profileSection.entity';

@Entity({ name: 'restaurant_profile_pages' })
export class ProfilePageEntity implements RestaurantProfilePageInterface {
  @PrimaryGeneratedColumn({ name: 'restaurant_profile_page_id', type: 'int4' })
  restaurantProfilePageID?: number;

  @Column('text', {
    name: 'name',
    nullable: false,
  })
  name: string;

  @Column('text', {
    name: 'seo_title',
    nullable: true,
  })
  seoTitle: string;

  @Column('text', {
    name: 'seo_description',
    nullable: true,
  })
  seoDescription?: string;

  @Column('text', {
    name: 'url_path',
    nullable: true,
  })
  urlPath?: string;

  @Column('text', {
    name: 'nav_link',
    nullable: true,
  })
  navLink?: string;

  @Column('int4', {
    name: 'restaurant_id',
    select: true,
    nullable: false,
  })
  restaurantID: number;

  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.profilePages, {
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_id', referencedColumnName: 'restaurant_id' })
  restaurant?: RestaurantEntity;

  @Column('int4', {
    name: 'list_order',
    select: true,
  })
  listOrder: number;

  @Column('boolean', {
    name: 'is_hidden',
    select: true,
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

  @OneToMany(() => ProfileSectionEntity, profileSection => profileSection.profilePage)
  profileSections?: Array<ProfileSectionEntity>;

  clone(): ProfilePageEntity {
    const clonedProfilePage = new ProfilePageEntity(
      this.name,
      this.seoTitle,
      this.restaurantID,
      this.isHidden,
      this.seoDescription,
      this.urlPath,
      this.navLink,
      this.profileSections ? this.profileSections.map((section: ProfileSectionEntity) => section.clone()) : undefined,
    );

    if (this.restaurantProfilePageID) {
      clonedProfilePage.restaurantProfilePageID = this.restaurantProfilePageID;
    }

    clonedProfilePage.createdAt = this.createdAt;
    clonedProfilePage.updatedAt = this.updatedAt;
    clonedProfilePage.deletedAt = this.deletedAt;

    return clonedProfilePage;
  }

  constructor(
    name: string,
    seoTitle: string,
    restaurantID: number,
    isHidden: boolean,
    seoDescription?: string,
    urlPath?: string,
    navLink?: string,
    profileSections?: Array<ProfileSectionEntity>,
  ) {
    this.name = name;
    this.seoTitle = seoTitle;
    this.seoDescription = seoDescription;
    this.urlPath = urlPath;
    this.navLink = navLink;
    this.restaurantID = restaurantID;
    this.isHidden = isHidden;
    this.profileSections = profileSections;
  }

  buildCreateProfilePageResponse = (): CreateProfilePageResponseInterface =>
    ({
      pageID: this.restaurantProfilePageID,
      name: this.name,
      seoTitle: this.seoTitle,
      seoDescription: this.seoDescription ?? '',
      urlPath: this.urlPath ?? '',
      navLink: this.navLink ?? '',
      isHidden: this.isHidden ?? false,
      profileSections: this.profileSections.map((section: ProfileSectionEntity) => section.buildProfileSectionResponse()),
    } as CreateProfilePageResponseInterface);
}
