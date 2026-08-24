import { CreateOneMenuInterface } from '@interfaces/menus.interface';
import { MenuSections } from '@interfaces/menuSections.interface';
import { MenuHours } from '@interfaces/menuHours.interface';
import { CreateMenuDisclaimersResponseInterface } from '@interfaces/disclaimers.interface';

class CreateOneMenuResponse implements CreateOneMenuInterface {
  menuID: number;
  name: string;
  restaurantID: number;
  listOrder: number;
  menuSections: MenuSections[];
  menuHours: MenuHours[];
  disclaimers: CreateMenuDisclaimersResponseInterface[];
  isPrixFixe?: boolean;
  isHidden: boolean;
  externalID: string;
}

export default CreateOneMenuResponse;
