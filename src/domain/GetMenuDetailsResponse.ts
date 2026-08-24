import { GetMenuDetailsResponseInterface } from '@interfaces/menus.interface';
import { GetMenuSectionsForMenuDetailsInterface } from '@interfaces/menuSections.interface';
import { MenuHours } from '@interfaces/menuHours.interface';
import { MenuDisclaimerInterface } from '@interfaces/disclaimers.interface';

class GetMenuDetailsResponse implements GetMenuDetailsResponseInterface {
  menuID: number;
  menuName: string;
  restaurantID: number;
  messages: MenuDisclaimerInterface[];
  menuSections: GetMenuSectionsForMenuDetailsInterface[];
  menuHours: MenuHours[];
  isPrixFixe: boolean;
  isHidden: boolean;
  externalID?: string;
}

export default GetMenuDetailsResponse;
