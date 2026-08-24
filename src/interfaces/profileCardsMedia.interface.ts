import { MediaEntity } from '@/entities/media.entity';
import { ProfileCardsEntity } from '@/entities/profileCards.entity';
import { EntityManager } from 'typeorm';
import { ProfileCardsMediaEntity } from '@/entities/profileCardsMedia.entity';

export interface RestaurantProfileSectionCardsMediaInterface {
  restaurantProfileSectionCardMediaID?: number;
  restaurantProfileSectionCardID?: number;
  card?: ProfileCardsEntity;
  mediaID?: number;
  media?: MediaEntity;
  listOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProfileCardMediaServiceInterface {
  linkMediaToProfileCard: (mediaID: number, cardID: number) => Promise<void>;
}

export interface ProfileCardMediaModelInterface {
  insertProfileCardMedia: (profileCardMedia: ProfileCardsMediaEntity[], repository?: EntityManager) => Promise<void>;
  deleteProfileCardMediaByCardID: (cardID: number, conn: any) => Promise<void>;
}
