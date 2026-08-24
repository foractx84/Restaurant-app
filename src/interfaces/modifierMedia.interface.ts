import { MediaType } from '@/enums/mediaType';

export interface ModifierMediaInterface {
  modifierMediaID?: number;
  mediaID: number;
  modifierID: number;
}

export interface GetMenuDetailsModifierMediaResponseInterface {
  type: MediaType.IMAGE;
  listOrder: number;
  mediaURL: string;
}
