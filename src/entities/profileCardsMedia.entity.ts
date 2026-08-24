import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, getRepository } from 'typeorm';
import { MediaEntity } from './media.entity';
import { ProfileCardsEntity } from './profileCards.entity';
import { RestaurantProfileSectionCardsMediaInterface } from '@/interfaces/profileCardsMedia.interface';

@Entity({ name: 'restaurant_profile_section_card_media' })
export class ProfileCardsMediaEntity implements RestaurantProfileSectionCardsMediaInterface {
  @PrimaryGeneratedColumn({ name: 'restaurant_profile_section_card_media_id', type: 'int4' })
  restaurantProfileSectionCardMediaID?: number;

  @Column('int4', {
    name: 'restaurant_profile_section_card_id',
    nullable: false,
  })
  restaurantProfileSectionCardID?: number;

  @ManyToOne(() => ProfileCardsEntity, profileCard => profileCard.media, {
    nullable: false,
  })
  @JoinColumn({
    name: 'restaurant_profile_section_card_id',
    referencedColumnName: 'restaurantProfileSectionCardID',
  })
  card?: ProfileCardsEntity;

  @Column('int4', {
    name: 'media_id',
    nullable: false,
  })
  mediaID?: number;

  @ManyToOne(() => MediaEntity, media => media.cardsMedia, {
    nullable: false,
  })
  @JoinColumn({
    name: 'media_id',
    referencedColumnName: 'media_id',
  })
  media?: MediaEntity;

  @Column('int4', {
    name: 'list_order',
    nullable: true,
  })
  listOrder?: number;

  @Column('timestamp', { name: 'created_at', select: false })
  createdAt?: Date;

  @Column('timestamp', { name: 'updated_at', select: false })
  updatedAt?: Date;

  constructor(
    restaurantProfileSectionCardMediaID?: number,
    restaurantProfileSectionCardID?: number,
    card?: ProfileCardsEntity,
    mediaID?: number,
    media?: MediaEntity,
    listOrder?: number,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.restaurantProfileSectionCardMediaID = restaurantProfileSectionCardMediaID;
    this.restaurantProfileSectionCardID = restaurantProfileSectionCardID;
    this.card = card;
    this.mediaID = mediaID;
    this.media = media;
    this.listOrder = listOrder;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static createProfileCardsMediaEntityFromCreateRequest(
    request: RestaurantProfileSectionCardsMediaInterface,
    media: MediaEntity,
  ): ProfileCardsMediaEntity {
    return new ProfileCardsMediaEntity(
      request.restaurantProfileSectionCardID,
      request.restaurantProfileSectionCardMediaID,
      request.card,
      media.media_id,
      media,
      request.listOrder,
      request.createdAt,
      request.updatedAt,
    );
  }

  static async deleteMediaById(mediaId: number): Promise<void> {
    const profileCardsMediaRepository = getRepository(ProfileCardsMediaEntity);
    await profileCardsMediaRepository.delete(mediaId);
  }
}
