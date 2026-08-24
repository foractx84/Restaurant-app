import { MenuItemMediaType } from '@/enums/menuItemMediaTypes';

export interface MenuItemMediaTypeDBInterface {
  menu_item_media_type_id: number;
  type: MenuItemMediaType;
  description: string;
}
