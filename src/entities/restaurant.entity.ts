import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { BrandEntity } from './brand.entity';
import { CuisineEntity } from './cuisine.entity';
import { MenuEntity } from './menus.entity';
import { ManagerRestaurantsEntity } from '@/entities/managerRestaurants.entity';
import { RestaurantMenuLayoutEntity } from './restaurantMenuLayout.entity';
import { RestaurantAddressEntity } from '@/entities/restaurantAddress.entity';
import { RestaurantImageEntity } from '@/entities/restaurantImage.entity';
import { RestaurantPackageEntity } from './restaurantPackage.entity';
import { AnnouncementEntity } from '@/entities/announcement.entity';
import { RestaurantSocialsEntity } from './restaurantSocials.entity';
import { RestaurantHoursEntity } from './restaurantHours.entity';
import { ProfilePageEntity } from '@/entities/profilePage.entity';
import { MediaEntity } from './media.entity';
import { RestaurantProfileAlbumsEntity } from './restaurantProfileAlbums.entity';
import { RestaurantUserEmailEntity } from '@/entities/restaurantUserEmail.entity';
import { ModifierEntity } from '@/entities/modifier.entity';
import { ModifierGroupEntity } from './modifierGroup.entity';
import { DiscoveryContentEntity } from '@entities/discoveryContent.entity';

@Entity({ name: 'restaurants' })
export class RestaurantEntity {
  @PrimaryGeneratedColumn()
  restaurant_id?: number;

  @Column('text', {
    nullable: false,
  })
  name?: string;

  @Column('text')
  description?: string;

  @Column('text', {
    nullable: true,
  })
  address?: string;

  @Column('text', {
    nullable: true,
  })
  city?: string;

  @Column('varchar', {
    length: 2,
    nullable: true,
  })
  state?: string;

  @Column('varchar', {
    length: 10,
    nullable: true,
  })
  zip?: string;

  @Column('timestamp', {
    nullable: false,
  })
  created_at?: string;

  @Column('int4', {
    default: 0, // documentation says string, cast to string '0'?
    nullable: false,
  })
  price?: number;

  @Column('text')
  image_url?: string;

  @ManyToOne(() => CuisineEntity, cuisine => cuisine.restaurants, {
    nullable: false,
  })
  @JoinColumn({ name: 'cuisine_id', referencedColumnName: 'cuisine_id' })
  cuisine_id?: number;

  @OneToMany(() => MenuEntity, menu => menu.restaurant_id)
  menus?: Array<MenuEntity>;

  @OneToMany(() => ManagerRestaurantsEntity, managerRestaurant => managerRestaurant.restaurant_id)
  manager_restaurants?: Array<ManagerRestaurantsEntity>;

  @Column('numeric', {
    precision: 17,
    scale: 6,
    nullable: true,
  })
  lat?: number;

  @Column('numeric', {
    precision: 17,
    scale: 6,
    nullable: true,
  })
  long?: number;

  @Column('text', {
    nullable: false,
  })
  phone?: string;

  @Column('boolean', {
    default: 'false',
  })
  has_drink_refills?: boolean;

  @Column('text')
  neighborhood?: string;

  @Column('int4')
  condiments?: string;

  @Column('text')
  omnivore_location_id?: string;

  @Column('int4')
  country_code?: number;

  @Column('int4')
  area_code?: number;

  @Column('int4')
  local_number?: number;

  @Column('text')
  currency_code?: string;

  @Column('int4')
  starting_price?: number;

  @Column('text')
  image_gallery_urls?: string;

  @Column('text')
  accepted_payment_methods?: string;

  @Column('boolean')
  has_photo_menu_items?: boolean;

  @Column('int4')
  server_actions?: number;

  @Column('int4')
  rating?: number;

  @Column('text', {
    nullable: false,
  })
  email?: string;

  @Column('text')
  website?: string;

  @Column('boolean', {
    default: 'false',
    nullable: false,
  })
  is_published?: boolean;

  @Column('boolean', {
    name: 'is_accepting_orders',
    default: true,
    nullable: false,
  })
  is_accepting_orders?: boolean;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  coordinates?: number;

  @Column('text')
  address2?: string;

  @Column('timestamp', {
    nullable: false,
  })
  updated_at?: string;

  @Column('boolean', {
    default: 'false',
    nullable: false,
  })
  deleted?: boolean;

  @Column('text', {
    nullable: false,
  })
  restaurant_url_id?: string;

  @Column('text', {
    nullable: true,
  })
  availability_notes?: string;

  @Column('text', {
    nullable: true,
  })
  reservation_url?: string;

  @Column('text', {
    nullable: true,
  })
  ordering_url?: string;

  @Column('text', {
    nullable: true,
  })
  primary_tagline?: string;

  @Column('text', {
    nullable: true,
  })
  secondary_tagline?: string;

  // stripe fields for connected account if restaurant has payments enabled//
  @Column('text', {
    name: 'stripe_account_id',
    nullable: true,
  })
  stripe_account_id?: string;

  @Column('boolean', {
    name: 'stripe_charges_enabled',
    default: false,
    nullable: false,
  })
  stripe_charges_enabled?: boolean;

  @Column('boolean', {
    name: 'stripe_details_submitted',
    default: false,
    nullable: false,
  })
  stripe_details_submitted?: boolean;

  @Column('int4', {
    name: 'location_id',
    nullable: true,
  })
  location_id?: number;

  @Column('boolean', {
    name: 'is_catering_enabled',
    default: false,
    nullable: false,
  })
  is_catering_enabled?: boolean;

  @Column('text', {
    name: 'catering_notification_email',
    nullable: true,
  })
  catering_notification_email?: string;

  @Column('boolean', {
    name: 'is_events_enabled',
    default: false,
    nullable: false,
  })
  is_events_enabled?: boolean;

  @Column('boolean', {
    name: 'is_careers_enabled',
    default: false,
    nullable: false,
  })
  is_careers_enabled?: boolean;

  /** Optional FK to brands.id (TAB-383). NULL for standalone restaurants not part of any restaurant-group/brand hierarchy. */
  @Column('uuid', {
    name: 'brand_id',
    nullable: true,
  })
  brand_id?: string;

  @Column('int4', {
    name: 'list_order',
    nullable: true,
  })
  list_order?: number;

  @ManyToOne(() => BrandEntity, brand => brand.restaurants, { nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand?: BrandEntity;

  @OneToMany(() => RestaurantMenuLayoutEntity, restaurantMenuLayout => restaurantMenuLayout.restaurant_id)
  restaurant_menu_layouts?: Array<RestaurantMenuLayoutEntity>;

  @OneToOne(() => RestaurantAddressEntity, restaurantAddress => restaurantAddress.restaurant_id)
  restaurant_address?: RestaurantAddressEntity;

  @OneToMany(() => RestaurantImageEntity, restaurantImage => restaurantImage.restaurant_id)
  images?: Array<RestaurantImageEntity>;

  @OneToMany(() => RestaurantPackageEntity, restaurantPackage => restaurantPackage.restaurant_id)
  restaurantPackages?: Array<RestaurantPackageEntity>;

  @OneToMany(() => AnnouncementEntity, announcement => announcement.restaurant)
  announcements?: Array<AnnouncementEntity>;

  @OneToOne(() => RestaurantSocialsEntity, socials => socials.restaurant)
  socials?: RestaurantSocialsEntity;

  @OneToMany(() => RestaurantHoursEntity, restaurantHours => restaurantHours.restaurant_id)
  hours?: Array<RestaurantHoursEntity>;

  @OneToMany(() => ProfilePageEntity, profilePage => profilePage.restaurant)
  profilePages?: Array<ProfilePageEntity>;

  @OneToMany(() => MediaEntity, media => media.restaurant)
  media?: Array<MediaEntity>;

  @OneToMany(() => RestaurantProfileAlbumsEntity, restaurantProfileAlbum => restaurantProfileAlbum.restaurant)
  restaurant_profile_albums?: Array<RestaurantProfileAlbumsEntity>;

  @OneToMany(() => RestaurantUserEmailEntity, restaurantUserEmails => restaurantUserEmails.restaurant)
  restaurant_user_emails?: Array<RestaurantUserEmailEntity>;

  @OneToMany(() => ModifierEntity, modifier => modifier.restaurant)
  modifiers?: Array<ModifierEntity>;

  @OneToMany(() => ModifierGroupEntity, modifierGroup => modifierGroup.restaurant)
  modifierGroups?: Array<ModifierGroupEntity>;

  @OneToMany(() => DiscoveryContentEntity, discoveryContent => discoveryContent.restaurant)
  discoveryContent?: Array<DiscoveryContentEntity>;
}
