import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProfileSectionEntity } from './profileSection.entity';
import { RestaurantProfileSectionCardsInterface } from '@/interfaces/profileCards.interface';
import { ProfileCardsMediaEntity } from './profileCardsMedia.entity';

@Entity({ name: 'restaurant_profile_section_cards' })
export class ProfileCardsEntity implements RestaurantProfileSectionCardsInterface {
  @PrimaryGeneratedColumn({ name: 'restaurant_profile_section_card_id', type: 'int4' })
  restaurantProfileSectionCardID?: number;

  @Column('int4', {
    name: 'restaurant_profile_section_id',
    nullable: false,
  })
  restaurantProfileSectionID?: number;

  @ManyToOne(() => ProfileSectionEntity, profileSection => profileSection.cards, {
    nullable: false,
  })
  @JoinColumn({
    name: 'restaurant_profile_section_id',
    referencedColumnName: 'restaurantProfileSectionID',
  })
  section: ProfileSectionEntity;

  @Column('text', {
    name: 'title',
    nullable: false,
  })
  title?: string;

  @Column('text', {
    name: 'content',
    nullable: true,
  })
  content?: string;

  @Column('text', {
    name: 'subtitle',
    nullable: true,
  })
  subtitle?: string;

  @Column('text', {
    name: 'link_url',
    nullable: true,
  })
  linkURL?: string;

  @Column('int4', {
    name: 'list_order',
    nullable: true,
  })
  listOrder?: number;

  @Column('timestamp', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamp', { name: 'updated_at', select: false })
  updatedAt?: Date;

  @OneToMany(() => ProfileCardsMediaEntity, cardsMedia => cardsMedia.card)
  media?: Array<ProfileCardsMediaEntity>;

  constructor(
    card: RestaurantProfileSectionCardsInterface,
    restaurantProfileSectionID?: number,
    cardMedia?: ProfileCardsMediaEntity[],
    restaurantProfileSectionCardID?: number,
  ) {
    const { title, content, subtitle, linkURL } = card ?? {};
    if (restaurantProfileSectionID) {
      this.restaurantProfileSectionID = restaurantProfileSectionID;
    }
    if (cardMedia) {
      this.media = cardMedia;
    }
    if (restaurantProfileSectionCardID) {
      this.restaurantProfileSectionCardID = restaurantProfileSectionCardID;
    }
    this.title = title;
    this.content = content;
    this.subtitle = subtitle;
    this.linkURL = linkURL;
  }

  static createEntityFromCreateRequest(request: RestaurantProfileSectionCardsInterface, cardMedia: ProfileCardsMediaEntity[]): ProfileCardsEntity {
    return new ProfileCardsEntity(
      {
        title: request.title,
        content: request.content,
        subtitle: request.subtitle,
        linkURL: request.linkURL,
      },
      request.restaurantProfileSectionID,
      cardMedia,
    );
  }

  buildProfileSectionCardResponse = (): RestaurantProfileSectionCardsInterface =>
    ({
      cardID: this.restaurantProfileSectionCardID,
      title: this.title ?? '',
      content: this.content ?? '',
      subtitle: this.subtitle ?? '',
      linkURL: this.linkURL ?? '',
    } as RestaurantProfileSectionCardsInterface);
}
