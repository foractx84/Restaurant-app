import { MediaType } from '@/enums/mediaType';

export interface MediaTypeDBInterface {
  media_type_id?: number;
  type: MediaType;
  description?: string;
  created_at?: string;
  updated_at?: string;
}
