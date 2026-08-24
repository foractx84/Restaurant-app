import {
  NormalizedMenu,
  NormalizedMenuHour,
  NormalizedMenuHours,
  NormalizedMenuItem,
  NormalizedMenuSection,
} from '@interfaces/platformIntegration.interface';
import { CreateMenusRequestInterface } from '@interfaces/menus.interface';
import { MenuHours } from '@interfaces/menuHours.interface';
import { CreateMenuDisclaimersInterface } from '@interfaces/disclaimers.interface';
import { MenuSections } from '@interfaces/menuSections.interface';
import { CreateMenuItemRequestInterface } from '@interfaces/menuItem.interface';
import { CreateItemSizeDto } from '@dtos/itemSize.dto';

class MenuTransformer {
  static fromNormalizedMenuToCreateMenusRequest(normalized: NormalizedMenu): CreateMenusRequestInterface {
    const createMenuDisclaimer = (message: string): CreateMenuDisclaimersInterface => {
      return { message, position: 'menu top bar' };
    };

    const createMenuHours = (normalizedHours: NormalizedMenuHours): MenuHours[] => {
      const hours: MenuHours[] = [];
      const entries = Object.entries(normalizedHours) as [string, NormalizedMenuHour[]][];
      for (const [key, value] of entries) {
        if (value.length > 0) {
          const mappedHours: MenuHours[] = value.map((normHour): MenuHours => {
            return {
              day: key,
              start: normHour.startTime,
              end: normHour.endTime,
            } as MenuHours;
          });
          hours.push(...mappedHours);
        }
      }
      return hours;
    };

    const createMenuSections = (sections: NormalizedMenuSection[]): MenuSections[] => {
      return (
        sections.map(
          (section): MenuSections => ({
            name: section.name,
            message: section.description ?? '',
            externalID: section.id,
          }),
        ) ?? []
      );
    };

    return {
      menus: [
        {
          name: normalized.name,
          isPrixFixe: false,
          isHidden: false,
          externalID: normalized.id,
          menuHours: createMenuHours(normalized.hours),
          disclaimers: !!normalized?.description ? [createMenuDisclaimer(normalized.description)] : [],
          menuSections: createMenuSections(normalized.sections),
        },
      ],
    } as unknown as CreateMenusRequestInterface;
  }

  static fromNormalizedMenuItemToCreateMenuItemRequestInterface(
    normalized: NormalizedMenuItem,
    menuSectionID: number,
  ): CreateMenuItemRequestInterface {
    const itemSize: CreateItemSizeDto = {
      label: 'default',
      price: normalized.price,
    } as CreateItemSizeDto;

    return {
      name: normalized.name,
      description: normalized.description,
      category: 'food',
      baseItemSize: itemSize,
      allItemSizes: [itemSize],
      externalID: normalized.id,
      menuSectionID,
      isHidden: normalized.isHidden,
    } as CreateMenuItemRequestInterface;
  }
}

export default MenuTransformer;
