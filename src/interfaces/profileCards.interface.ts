import { ProfileCardsEntity } from '@/entities/profileCards.entity';
import { ProfileCardsMediaEntity } from '@/entities/profileCardsMedia.entity';
import { ProfileSectionEntity } from '@/entities/profileSection.entity';
import { EntityManager } from 'typeorm';
import { MediaResponseInterface } from './mediaLibrary.interface';

export interface ProfileCardsServiceInterface {
  deleteCard: (cardID: number, entityManager?: EntityManager) => Promise<void>;
  upsertCard: (card: Partial<ProfileCardsEntity>, entityManager?: EntityManager) => Promise<ProfileCardsEntity>;
  linkMediaToProfileCard: (mediaID: number, cardID: number) => Promise<void>;
}

export interface ProfileCardsModelInterface {
  deleteCard: (cardID: number, entityManager?: EntityManager) => Promise<void>;
  fetchPageSectionCardByID: (cardID: number) => Promise<ProfileCardsEntity>;
  upsertCard: (card: Partial<ProfileCardsEntity>, entityManager?: EntityManager) => Promise<ProfileCardsEntity>;
}

export interface RestaurantProfileSectionCardsInterface {
  cardID?: number;
  restaurantProfileSectionCardID?: number;
  restaurantProfileSectionID?: number;
  section?: ProfileSectionEntity;
  title?: string;
  content?: string;
  subtitle?: string;
  linkURL?: string;
  listOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
  cardsMedia?: Array<ProfileCardsMediaEntity>;
}

export interface ProfileSectionCardResponseInterface {
  cardID?: number;
  title?: string;
  content?: string;
  subtitle?: string;
  linkURL?: string;
  cardMedia?: MediaResponseInterface[];
}
