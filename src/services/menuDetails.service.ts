import { MenuDetailsServiceInterface } from '@interfaces/menuDetails.interface';
import { CreateAllMenusInterface, CreateMenusRequestInterface, CreateOneMenuInterface, MenusServiceInterface } from '@interfaces/menus.interface';
import { CreateMenuItemResponse, MenuItemServiceInterface } from '@interfaces/menuItem.interface';
import { NormalizedMenu, NormalizedMenuItem, NormalizedModifierGroup } from '@interfaces/platformIntegration.interface';
import MenuTransformer from '@/transformers/menu.transformer';
import { MenuSections } from '@interfaces/menuSections.interface';
import { CreateModifierRequestInterface, ModifierServiceInterface } from '@interfaces/modifier.interface';
import { CreateModifierGroupRequestInterface, ModifierGroupServiceInterface } from '@interfaces/modifierGroup.interface';
import { MediaLibraryServiceInterface, MediaResponseInterface } from '@interfaces/mediaLibrary.interface';
import { MediaEntity } from '@entities/media.entity';
import { LinkMenuItemAndMediaInterface } from '@interfaces/menuItemMedia.interface';
import { logger } from '@utils/logger';
import { EntityManager } from 'typeorm';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';

class MenuDetailsService implements MenuDetailsServiceInterface {
  private mediaService: MediaLibraryServiceInterface;
  private menuService: MenusServiceInterface;
  private menuItemService: MenuItemServiceInterface;
  private modifierService: ModifierServiceInterface;
  private modifierGroupService: ModifierGroupServiceInterface;
  private restaurantService: RestaurantsServiceInterface;

  constructor(
    mediaService: MediaLibraryServiceInterface,
    menuService: MenusServiceInterface,
    menuItemService: MenuItemServiceInterface,
    modifierService: ModifierServiceInterface,
    modifierGroupService: ModifierGroupServiceInterface,
    restaurantService: RestaurantsServiceInterface,
  ) {
    this.mediaService = mediaService;
    this.menuService = menuService;
    this.menuItemService = menuItemService;
    this.modifierService = modifierService;
    this.modifierGroupService = modifierGroupService;
    this.restaurantService = restaurantService;
  }

  createMenusDetailsFromNormalized = async (
    menus: NormalizedMenu[],
    restaurantID: number,
    locationID: number | null,
    manager?: EntityManager,
  ): Promise<void> => {
    for (const normalizedMenu of menus) {
      // locationID is a Checkmate-specific external identifier stored on the restaurant row itself.
      // Platforms that identify restaurants another way (e.g. Otter, via platform_integrations) pass
      // null here and are verified by restaurantID alone.
      const restaurant =
        locationID != null
          ? await this.restaurantService.findRestaurantEntityByIDAndLocationID(restaurantID, locationID, manager)
          : await this.restaurantService.findRestaurantEntityByID(restaurantID);

      if (!restaurant) {
        throw new Error(
          `Restaurant { restaurantID: ${restaurantID} } with locationID: ${locationID} does not exist. Will need to look into this issue if prevalent.`,
        );
      }

      logger.debug(`CREATING MENU ${JSON.stringify({ ...normalizedMenu, sections: 'PLACE HOLDER TO DECREASE LOGGING.' }, undefined, 2)}`);
      const createMenuRequest: CreateMenusRequestInterface = MenuTransformer.fromNormalizedMenuToCreateMenusRequest(normalizedMenu);

      // create menu and get menu id.
      const { menus }: CreateAllMenusInterface = await this.menuService.createMenus(createMenuRequest, restaurantID, manager);
      // grab single menu since we desire to create a menu at a time.
      const menu: CreateOneMenuInterface = menus[0];

      logger.debug(`CREATED MENU ${JSON.stringify({ ...createMenuRequest, menuID: menu.menuID }, undefined, 2)}`);

      await Promise.all(
        menu.menuSections.map((section: MenuSections) => {
          const desiredSection = normalizedMenu.sections?.find(s => s.id === section.externalID);

          if (!desiredSection) {
            logger.warn(`Section not found in normalized menu { externalID: ${section.externalID} }`);
            return;
          }

          logger.debug(`CREATED MENU SECTION ${JSON.stringify({ ...section }, undefined, 2)}`);

          return this.createDetailsForMenuSection(desiredSection.items, section.menuSectionID, restaurantID, manager);
        }),
      );
    }
  };

  createDetailsForMenuSection = async (
    items: NormalizedMenuItem[],
    sectionID: number,
    restaurantID: number,
    manager?: EntityManager,
  ): Promise<void> => {
    await Promise.all(
      items.map(async normalizedItem => {
        const request = MenuTransformer.fromNormalizedMenuItemToCreateMenuItemRequestInterface(normalizedItem, sectionID);
        const createdMenuItem: CreateMenuItemResponse = await this.menuItemService.createMenuItem(request, manager);

        logger.debug(`CREATED MENU ITEM ${JSON.stringify({ ...request, menuItemID: createdMenuItem.menuItemID }, undefined, 2)}`);

        await Promise.all([
          this.createDetailsForModifierGroup(normalizedItem.modifierGroups, createdMenuItem.menuItemID, restaurantID, [], manager),
          // TODO: uncomment code if wanting to store images
          // this.createDetailsForMenuItem(normalizedItem.imageURLs, createdMenuItem.menuItemID, restaurantID, manager),
        ]);
      }),
    );
  };

  createDetailsForModifierGroup = async (
    modifierGroups: NormalizedModifierGroup[],
    itemID: number,
    restaurantID: number,
    existingModifierGroupIDs: number[],
    manager?: EntityManager,
  ): Promise<void> => {
    const modifierGroupIDs = await Promise.all(
      modifierGroups.map(async normalizedModifierGroup => {
        const modifierIDs = await Promise.all(
          normalizedModifierGroup.modifiers.map(async normalizedModifier => {
            const modifierRequest: CreateModifierRequestInterface = {
              name: normalizedModifier.name,
              description: normalizedModifier.description ?? null,
              price: normalizedModifier.price ?? 0,
              externalID: normalizedModifier.id,
              isHidden: normalizedModifier.isHidden,
            };

            const modifierResponse = await this.modifierService.createModifier(modifierRequest, restaurantID, manager);
            logger.debug(`CREATED MODIFIER ${JSON.stringify({ ...modifierRequest, modifierID: modifierResponse.modifierID }, undefined, 2)}`);
            return modifierResponse.modifierID;
          }),
        );

        const createRequest: CreateModifierGroupRequestInterface = {
          name: normalizedModifierGroup.name,
          label: normalizedModifierGroup.name,
          modifierIDs,
          externalID: normalizedModifierGroup.id,
          minimumSelections: normalizedModifierGroup.minimumSelections,
          maximumSelections: normalizedModifierGroup.maximumSelections,
          maxPerModifierSelectionQuantity: normalizedModifierGroup.maxPerModifierSelectionQuantity,
        };
        const modifierGroup = await this.modifierGroupService.createModifierGroup(createRequest, restaurantID, true, manager);
        logger.debug(`CREATED MODIFIER GROUP ${JSON.stringify({ ...createRequest, modifierGroupID: modifierGroup.modifierGroupID }, undefined, 2)}`);
        return modifierGroup.modifierGroupID;
      }),
    );

    logger.debug(`LINK MODIFIER GROUP IDS ${JSON.stringify([...existingModifierGroupIDs, ...modifierGroupIDs])} TO ITEM: ${itemID}.`);
    await this.menuItemService.linkModifierGroupsToMenuItem(itemID, [...existingModifierGroupIDs, ...modifierGroupIDs], restaurantID, manager);
  };

  createDetailsForMenuItem = async (images: { link: string }[], itemID: number, restaurantID: number, manager?: EntityManager): Promise<void> => {
    if (!images.length) return;

    // upload image for menu item if exists
    const imageEntities: Partial<MediaEntity>[] = images.map((image): Partial<MediaEntity> => {
      return { media_url: image.link };
    });

    // TODO: Add functionality to check existing images with the url from integration
    // if existing then will want to connect that media to the menu item and remove existing from entities to create
    // const existingImages: MediaEntity[] = await this.mediaService.getMediaByRestaurantID(restaurantID);

    const uploadedImages: MediaResponseInterface[] = await this.mediaService.insertImages(imageEntities, restaurantID, manager);
    const imageIDs = uploadedImages.map(image => image.mediaID);

    const mediaEntities: MediaEntity[] = uploadedImages.map(({ mediaUrl, type, name }) =>
      MediaEntity.createEntityFromRequest(mediaUrl, restaurantID, type, name),
    );
    await this.menuItemService.linkMediaToMenuItem(
      mediaEntities,
      {
        menuItemID: itemID,
        mediaIDs: imageIDs,
        thumbnails: [],
      } as LinkMenuItemAndMediaInterface,
      manager,
    );
  };
}

export default MenuDetailsService;
