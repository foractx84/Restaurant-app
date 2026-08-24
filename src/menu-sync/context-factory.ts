import { MenuUpdateContext } from '@menu-sync/interfaces/menu-sync.interface';
import MenusService from '@services/menus.service';
import MenuSectionsService from '@services/menuSections.service';
import MenuSectionsModel from '@models/menuSections.model';
import MenuHoursService from '@services/menuHours.service';
import MenuHoursModel from '@models/menuHours.model';
import MenuItemService from '@services/menuItem.service';
import MenuDisclaimersService from '@services/menuDisclaimers.service';
import MenuDisclaimerModel from '@models/menuDisclaimers.model';
import AggregateService from '@services/aggregate.service';
import AggregateModel from '@models/aggregate.model';
import DietaryRestrictionsService from '@services/dietaryRestrictions.service';
import DietaryRestrictionsModel from '@models/dietaryRestrictions.model';
import DrinkItemService from '@services/drinkItem.service';
import DrinkItemModel from '@models/drinkItem.model';
import ItemSizeService from '@services/itemSize.service';
import ItemSizeTypeModel from '@models/itemSizeType.model';
import MenuItemModel from '@models/menuItem.model';
import RestaurantsService from '@services/restaurants.service';
import CountryService from '@services/country.service';
import CuisinesService from '@services/cuisines.service';
import ManagerRestaurantService from '@services/managerRestaurant.service';
import RestaurantAddressService from '@services/restaurantAddress.service';
import RestaurantImagesService from '@services/restaurantImages.service';
import RestaurantSocialsService from '@services/restaurantSocials.service';
import RestaurantHoursService from '@services/restaurantHours.service';
import RestaurantProfileAlbumsService from '@services/restaurantProfileAlbums.service';
import { StripeConnectServiceInterface } from '@services/stripeConnect.service';
import RestaurantsModel from '@models/restaurants.model';
import CuisinesModel from '@models/cuisines.model';
import CountryModel from '@models/country.model';
import ManagerRestaurantModel from '@models/managerRestaurant.model';
import RestaurantAddressModel from '@models/restaurantAddress.model';
import RestaurantHoursModel from '@models/restaurantHours.model';
import RestaurantImagesModel from '@models/restaurantImages.model';
import MediaLibraryService from '@services/mediaLibrary.service';
import MediaLibraryModel from '@models/mediaLibrary.model';
import RestaurantImageTypesService from '@services/restaurantImageTypes.service';
import RestaurantImageTypesModel from '@models/restaurantImageTypes.model';
import RestaurantProfileAlbumsModel from '@models/restaurantProfileAlbums.model';
import RestaurantProfileAlbumMediaService from '@services/restaurantProfileAlbumMedia.service';
import RestaurantProfileAlbumMediaModel from '@models/restaurantProfileAlbumMedia.model';
import RestaurantSocialsModel from '@models/restaurantSocials.model';
import TagsService from '@services/tags.service';
import TagsModel from '@models/tags.model';
import MenuItemMediaService from '@services/menuItemMedia.service';
import MenuItemMediaModel from '@models/menuItemMedia.model';
import MenuItemVideoThumbnailsService from '@services/menuItemVideoThumbnails.service';
import MenuItemVideoThumbnailsModel from '@models/menuItemVideoThumbnails.model';
import MenusModel from '@models/menus.model';
import SoftDeleteService from '@services/softDelete.service';
import SoftDeleteModel from '@models/softDelete.model';
import ModifierGroupService from '@services/modifierGroup.service';
import ModifierService from '@services/modifier.service';
import ModifierModel from '@models/modifier.model';
import ModifierGroupModel from '@models/modifierGroup.model';
import ModifierToModifierGroupLinkService from '@services/modifierToModifierGroupLink.service';
import ModifierToModifierGroupLinkModel from '@models/modifierToModifierGroupLink.model';
import MenuDetailsService from '@services/menuDetails.service';

export const buildMenuSyncContext = (): MenuUpdateContext => {
  const aggregateModel = new AggregateModel();
  const countryModel = new CountryModel();
  const cuisinesModel = new CuisinesModel();
  const dietaryRestrictionsModel = new DietaryRestrictionsModel();
  const drinkItemModel = new DrinkItemModel();
  const itemSizeTypeModel = new ItemSizeTypeModel();
  const managerRestaurantModel = new ManagerRestaurantModel();
  const mediaLibraryModel = new MediaLibraryModel();
  const menuDisclaimerModel = new MenuDisclaimerModel();
  const menuHoursModel = new MenuHoursModel();
  const menuItemMediaModel = new MenuItemMediaModel();
  const menuItemModel = new MenuItemModel();
  const menuItemVideoThumbnailsModel = new MenuItemVideoThumbnailsModel();
  const menuSectionsModel = new MenuSectionsModel();
  const modifierModel = new ModifierModel();
  const modifierGroupModel = new ModifierGroupModel();
  const modifierToModifierGroupLinkModel = new ModifierToModifierGroupLinkModel();
  const restaurantAddressModel = new RestaurantAddressModel();
  const restaurantHoursModel = new RestaurantHoursModel();
  const restaurantImagesModel = new RestaurantImagesModel();
  const restaurantImageTypeModel = new RestaurantImageTypesModel();
  const restaurantProfileAlbumsModel = new RestaurantProfileAlbumsModel();
  const restaurantProfileAlbumMediaModel = new RestaurantProfileAlbumMediaModel();
  const restaurantsModel = new RestaurantsModel();
  const restaurantSocialModel = new RestaurantSocialsModel();
  const softDeleteModel = new SoftDeleteModel();
  const tagsModel = new TagsModel();

  const aggregateService = new AggregateService(aggregateModel);
  const countryService = new CountryService(countryModel);
  const cuisinesService = new CuisinesService(cuisinesModel);
  const dietaryRestrictionsService = new DietaryRestrictionsService(dietaryRestrictionsModel);
  const drinkItemService = new DrinkItemService(drinkItemModel);
  const itemSizeService = new ItemSizeService(aggregateService, itemSizeTypeModel);
  const managerRestaurantService = new ManagerRestaurantService(managerRestaurantModel);
  const mediaService = new MediaLibraryService(mediaLibraryModel);
  const menuDisclaimerService = new MenuDisclaimersService(menuDisclaimerModel);
  const menuItemVideoThumbnailService = new MenuItemVideoThumbnailsService(menuItemVideoThumbnailsModel);
  const menuItemMediaService = new MenuItemMediaService(menuItemMediaModel, menuItemVideoThumbnailService);
  const restaurantAddressService = new RestaurantAddressService(restaurantAddressModel);
  const restaurantHoursService = new RestaurantHoursService(restaurantHoursModel);
  const restaurantImageTypesService = new RestaurantImageTypesService(restaurantImageTypeModel);
  const restaurantImagesService = new RestaurantImagesService(restaurantImagesModel, mediaService, restaurantImageTypesService);
  const restaurantProfileAlbumMediaService = new RestaurantProfileAlbumMediaService(restaurantProfileAlbumMediaModel);
  const restaurantProfileAlbumsService = new RestaurantProfileAlbumsService(restaurantProfileAlbumsModel, restaurantProfileAlbumMediaService);
  const restaurantSocialsService = new RestaurantSocialsService(restaurantSocialModel);
  const softDeleteService = new SoftDeleteService(softDeleteModel);
  const stripeConnectServiceNoOp = null as unknown as StripeConnectServiceInterface;
  const restaurantService = new RestaurantsService(
    countryService,
    cuisinesService,
    managerRestaurantService,
    restaurantAddressService,
    restaurantImagesService,
    restaurantsModel,
    restaurantSocialsService,
    restaurantHoursService,
    restaurantProfileAlbumsService,
    stripeConnectServiceNoOp,
  );
  const tagsService = new TagsService(tagsModel);
  const menuItemService = new MenuItemService(
    aggregateService,
    dietaryRestrictionsService,
    drinkItemService,
    itemSizeService,
    menuItemModel,
    restaurantService,
    tagsService,
    menuItemMediaService,
  );
  const menuHoursService = new MenuHoursService(menuHoursModel);
  const menuSectionService = new MenuSectionsService(menuSectionsModel);
  const menuModel = new MenusModel(menuHoursService, menuSectionService, menuDisclaimerService, softDeleteService);
  const menuService = new MenusService(menuModel, menuHoursService, menuSectionService, menuItemService, menuDisclaimerService);
  const modifierToModifierGroupLinkService = new ModifierToModifierGroupLinkService(modifierToModifierGroupLinkModel);
  const modifierGroupService = new ModifierGroupService(modifierGroupModel, modifierToModifierGroupLinkService);
  const modifierService = new ModifierService(modifierModel);
  const menuDetailsService = new MenuDetailsService(
    mediaService,
    menuService,
    menuItemService,
    modifierService,
    modifierGroupService,
    restaurantService,
  );

  return {
    menuService,
    menuDetailsService,
    menuSectionService,
    menuItemService,
    modifierGroupService,
    modifierService,
    modifierToModifierGroupLinkService,
    menuHoursService,
    menuDisclaimerService,
    menuItemMediaService,
    restaurantService,
    softDeleteService,
  };
};
