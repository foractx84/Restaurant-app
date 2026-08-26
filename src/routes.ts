import RouteInterface from '@interfaces/routes.interface';

import AnnouncementRoute from '@routes/announcement.route';
import AnnouncementsRoute from '@routes/announcements.route';
import AuthRoute from '@routes/auth.route';
import BrandsRoute from '@routes/brands.route';
import CareerRequestsRoute from '@routes/careerRequests.route';
import CareersSettingsRoute from '@routes/careersSettings.route';
import PageOrderRoute from '@routes/pageOrder.route';
import CateringRequestsRoute from '@routes/cateringRequests.route';
import CateringSettingsRoute from '@routes/cateringSettings.route';
import CheckmateIntegrationRoute from '@routes/checkmateIntegration.route';
import EventMediaRoute from '@routes/eventMedia.route';
import EventRequestsRoute from '@routes/eventRequests.route';
import EventSettingsRoute from '@routes/eventSettings.route';
import OtterIntegrationRoute from '@routes/otterIntegration.route';
import CuisinesRoute from '@routes/cuisines.route';
import DietaryRestrictionsRoute from '@routes/dietaryRestrictions.route';
import DiscoveryContentRoute from '@routes/discoveryContent.route';
import DrinkItemRoute from '@routes/drinkItem.route';
import DrinkItemsRoute from '@routes/drinkItems.route';
import IndexRoute from '@routes/index.route';
import ManagerRoute from '@routes/manager.route';
import ManagersRoute from '@routes/managers.route';
import MediaLibraryRoute from '@routes/media.route';
import MenuItemRoute from '@routes/menuItem.route';
import MenuItemsRoute from '@routes/menuItems.route';
import MenuLayoutRoute from '@routes/menuLayouts.route';
import MenuSectionsRoute from '@routes/menuSections.route';
import MenusRoute from '@routes/menus.route';
import ModifierGroupRoute from '@routes/modifierGroup.route';
import ModifierGroupsRoute from '@routes/modifierGroups.route';
import ModifierRoute from '@routes/modifier.route';
import ModifiersRoute from '@routes/modifiers.route';
import ProfilePagesRoute from '@routes/profilePages.route';
import ProfileSectionsRoute from '@routes/profileSections.route';
import RestaurantGroupsRoute from '@routes/restaurantGroups.route';
import RestaurantRoute from '@routes/restaurant.route';
import RestaurantsRoute from '@routes/restaurants.route';
import RestaurantUserEmailRoute from '@routes/restaurantUserEmail.route';
import StripeManagerRoute from '@routes/stripeManager.route';
import StripePackagesRoute from '@routes/stripePackages.route';
import StripeRoute from '@routes/stripe.route';
import TagsRoute from '@routes/tags.route';
import TitlesRoute from '@routes/titles.route';
import FontsRoute from '@routes/fonts.route';

import AnnouncementsController from '@controllers/announcements.controller';
import AuthController from '@controllers/auth.controller';
import BrandsController from '@controllers/brands.controller';
import CareerRequestsController from '@controllers/careerRequests.controller';
import CareersSettingsController from '@controllers/careersSettings.controller';
import PageOrderController from '@controllers/pageOrder.controller';
import CateringRequestsController from '@controllers/cateringRequests.controller';
import CateringSettingsController from '@controllers/cateringSettings.controller';
import EventMediaController from '@controllers/eventMedia.controller';
import EventRequestsController from '@controllers/eventRequests.controller';
import EventSettingsController from '@controllers/eventSettings.controller';
import CheckmateIntegrationController from '@controllers/checkmateIntegration.controller';
import OtterIntegrationController from '@controllers/otterIntegration.controller';
import CuisinesController from '@controllers/cuisines.controller';
import DietaryRestrictionsController from '@controllers/dietaryRestrictions.controller';
import DiscoveryContentController from '@controllers/discoveryContent.controller';
import DrinkItemController from '@controllers/drinkItem.controller';
import ManagersController from '@controllers/managers.controller';
import MenuItemController from '@controllers/menuItem.controller';
import MenuLayoutController from '@controllers/menuLayouts.controller';
import MediaLibraryController from '@controllers/media.controller';
import MenusController from '@controllers/menus.controller';
import MenuSectionsController from '@controllers/menuSections.controller';
import ModifierGroupController from '@controllers/modifierGroup.controller';
import ModifierController from '@controllers/modifier.controller';
import PackageController from '@controllers/package.controller';
import ProfilePagesController from '@controllers/profilePages.controller';
import ProfileSectionsController from '@controllers/profileSections.controller';
import RestaurantController from '@controllers/restaurant.controller';
import RestaurantGroupsController from '@controllers/restaurantGroups.controller';
import RestaurantUserEmailsController from '@controllers/restaurantUserEmails.controller';
import StripeController from '@controllers/stripe.controller';
import TagsController from '@controllers/tags.controller';
import TitlesController from '@controllers/titles.controller';
import FontsController from '@controllers/fonts.controller';

import AggregateService from '@services/aggregate.service';
import AnnouncementImagesService from '@services/announcementImages.service';
import AnnouncementsService from '@services/announcements.service';
import AuthService from '@services/auth.service';
import BrandsService from '@services/brands.service';
import BrandSocialsService from '@services/brandSocials.service';
import CareerRequestsService from '@services/careerRequests.service';
import CareersSettingsService from '@services/careersSettings.service';
import PageOrderService from '@services/pageOrder.service';
import CateringRequestsService from '@services/cateringRequests.service';
import CateringSettingsService from '@services/cateringSettings.service';
import EventMediaService from '@services/eventMedia.service';
import EventRequestsService from '@services/eventRequests.service';
import EventSettingsService from '@services/eventSettings.service';
import CheckmateIntegrationService from '@services/checkmateIntegration.service';
import OtterOrganizationService from '@services/otterOrganization.service';
import OtterAuthService from '@services/otterAuth.service';
import OtterIntegrationService from '@services/otterIntegration.service';
import OtterStorefrontService from '@services/otterStorefront.service';
import CountryService from '@services/country.service';
import CuisinesService from '@services/cuisines.service';
import DietaryRestrictionsService from '@services/dietaryRestrictions.service';
import DiscoveryContentService from '@services/discoveryContent.service';
import DrinkItemService from '@services/drinkItem.service';
import ItemSizeService from '@services/itemSize.service';
import ManagerPackageService from '@services/managerPackage.service';
import ManagerRestaurantService from '@services/managerRestaurant.service';
import ManagersService from '@services/managers.service';
import MediaLibraryService from '@services/mediaLibrary.service';
import MenuDisclaimersService from '@services/menuDisclaimers.service';
import MenuDetailsService from '@services/menuDetails.service';
import MenuHoursService from '@services/menuHours.service';
import MenuItemMediaService from '@services/menuItemMedia.service';
import MenuItemService from '@services/menuItem.service';
import MenuItemVideoThumbnailsService from '@services/menuItemVideoThumbnails.service';
import MenuLayoutService from '@services/menuLayouts.service';
import MenuSectionsService from '@services/menuSections.service';
import MenusService from '@services/menus.service';
import ModifierGroupService from '@services/modifierGroup.service';
import ModifierService from '@services/modifier.service';
import ModifierToModifierGroupLinkService from '@services/modifierToModifierGroupLink.service';
import PackagePermissionService from '@services/packagePermission.service';
import PackageService from '@services/package.service';
import PlatformIntegrationService from '@services/platformIntegration.service';
import ProductPriceService from '@services/productPrice.service';
import RestaurantMenuSnapshotService from '@services/restaurantMenuSnapshot.service';
import ProfileCardsService from '@services/profileCards.service';
import ProfilePagesService from '@services/profilePages.service';
import ProfileSectionsService from '@services/profileSections.service';
import ProfileSectionTemplatesService from '@services/profileSectionTemplates.service';
import RestaurantAddressService from '@services/restaurantAddress.service';
import RestaurantBackupService from '@services/restaurantBackup.service';
import RestaurantGroupsService from '@services/restaurantGroups.service';
import RestaurantHoursService from '@services/restaurantHours.service';
import RestaurantImagesService from '@services/restaurantImages.service';
import RestaurantImageTypesService from '@services/restaurantImageTypes.service';
import RestaurantPackageService from '@services/restaurantPackages.service';
import RestaurantProfileAlbumMediaService from '@services/restaurantProfileAlbumMedia.service';
import RestaurantProfileAlbumsService from '@services/restaurantProfileAlbums.service';
import RestaurantProfileMediaService from '@services/restaurantProfileMedia.service';
import RestaurantSocialsService from '@services/restaurantSocials.service';
import RestaurantsService from '@services/restaurants.service';
import RestaurantTypographyService from '@services/restaurantTypography.service';
import RestaurantUserEmailsService from '@services/restaurantUserEmails.service';
import SoftDeleteService from '@services/softDelete.service';
import StripeCustomerService from '@services/stripeCustomer.service';
import StripeIdempotenceService from '@services/stripeIdempotence.service';
import StripeService from '@services/stripe.service';
import StripeTaxService from '@services/stripeTax.service';
import SubscriptionItemService from '@services/subscriptionItem.service';
import SubscriptionService from '@services/subscription.service';
import TagsService from '@services/tags.service';
import TitlesService from '@services/titles.service';
import FontsService from '@services/fonts.service';
import { StripeConnectService, StripeConnectServiceInterface } from '@services/stripeConnect.service';

import AggregateModel from '@models/aggregate.model';
import AnnouncementImagesModel from '@models/announcementImages.model';
import AnnouncementsModel from '@models/announcements.model';
import BrandsModel from '@models/brands.model';
import BrandSocialsModel from '@models/brandSocials.model';
import CareerRequestsModel from '@models/careerRequests.model';
import CareersSettingsModel from '@models/careersSettings.model';
import PageOrderModel from '@models/pageOrder.model';
import CateringRequestsModel from '@models/cateringRequests.model';
import EventMediaModel from '@models/eventMedia.model';
import EventRequestsModel from '@models/eventRequests.model';
import EventSettingsModel from '@models/eventSettings.model';
import CountryModel from '@models/country.model';
import CuisinesModel from '@models/cuisines.model';
import DietaryRestrictionsModel from '@models/dietaryRestrictions.model';
import DiscoveryContentModel from '@models/discoveryContent.model';
import DrinkItemModel from '@models/drinkItem.model';
import ItemSizeTypeModel from '@models/itemSizeType.model';
import ManagerPackageModel from '@models/managerPackage.model';
import ManagerRestaurantModel from '@models/managerRestaurant.model';
import ManagersModel from '@models/managers.model';
import MediaLibraryModel from '@models/mediaLibrary.model';
import MenuDisclaimerModel from '@models/menuDisclaimers.model';
import MenuHoursModel from '@models/menuHours.model';
import MenuItemMediaModel from '@models/menuItemMedia.model';
import MenuItemModel from '@models/menuItem.model';
import MenuItemVideoThumbnailsModel from '@models/menuItemVideoThumbnails.model';
import MenuLayoutModel from '@models/menuLayouts.model';
import MenuSectionsModel from '@models/menuSections.model';
import MenusModel from '@models/menus.model';
import ModifierGroupModel from '@models/modifierGroup.model';
import ModifierModel from '@models/modifier.model';
import ModifierToModifierGroupLinkModel from '@models/modifierToModifierGroupLink.model';
import PackagePermissionModel from '@models/packagePermission.model';
import PlatformIntegrationModel from '@models/platformIntegration.model';
import ProductPriceModel from '@models/productPrice.model';
import RestaurantMenuSnapshotModel from '@models/restaurantMenuSnapshot.model';
import ProfileCardsModel from '@models/profileCards.model';
import ProfilePagesModel from '@models/profilePages.model';
import ProfileSectionsModel from '@models/profileSections.model';
import ProfileSectionTemplatesModel from '@models/profileSectionTemplates.model';
import RestaurantAddressModel from '@models/restaurantAddress.model';
import RestaurantGroupsModel from '@models/restaurantGroups.model';
import RestaurantHoursModel from '@models/restaurantHours.model';
import RestaurantImagesModel from '@models/restaurantImages.model';
import RestaurantImageTypesModel from '@models/restaurantImageTypes.model';
import RestaurantPackageModel from '@models/restaurantPackage.model';
import RestaurantProfileAlbumMediaModel from '@models/restaurantProfileAlbumMedia.model';
import RestaurantProfileAlbumsModel from '@models/restaurantProfileAlbums.model';
import RestaurantProfileMediaModel from '@models/restaurantProfileMedia.model';
import RestaurantsModel from '@models/restaurants.model';
import RestaurantSocialsModel from '@models/restaurantSocials.model';
import RestaurantTypographyModel from '@models/restaurantTypography.model';
import RestaurantUserEmailsModel from '@models/restaurantUserEmails.model';
import SoftDeleteModel from '@models/softDelete.model';
import StripeConnectAccountModel from '@models/stripeConnectAccount.model';
import StripeCustomerModel from '@models/stripeCustomer.model';
import StripeIdempotenceModel from '@models/stripeIdempotence.model';
import StripeTaxModel from '@models/stripeTax.model';
import SubscriptionItemModel from '@/models/subscriptionItem.model';
import SubscriptionModel from '@models/subscription.model';
import TagsModel from '@models/tags.model';
import TitlesModel from '@models/titles.model';
import FontsModel from '@models/fonts.model';
import UsersModel from '@models/users.model';
import DiscoveryContentCategoryBucketsService from './services/discoveryContentCategoryBuckets.service';
import DiscoveryContentMediaService from './services/discoveryContentMedia.service';
import DiscoveryContentCategoriesService from './services/discoveryContentCategories.service';
import DiscoveryContentMetaTagsService from './services/discoveryContentMetaTags.service';
import DiscoveryContentUrlPlatformsService from './services/discoveryContentUrlPlatforms.service';
import DiscoveryContentURLsService from './services/discoveryContentURLs.service';
import DiscoveryContentMediaModel from './models/discoveryContentMedia.model';
import DiscoveryContentCategoriesModel from './models/discoveryContentCategories.model';
import DiscoveryContentURLsModel from './models/discoveryContentURLs.model';
import DiscoveryContentUrlPlatformsModel from './models/discoveryContentUrlPlatforms.model';
import DiscoveryContentMetaTagsModel from './models/discoveryContentMetaTags.model';
import DiscoveryContentCategoryBucketsModel from './models/discoveryContentCategoryBuckets.model';
import ProfileCardMediaService from './services/profileCardMedia.service';
import ProfileCardMediaModel from './models/profileCardMedia.model';

/**********************
 * Models
 **********************/

const aggregateModel = new AggregateModel();
const announcementImagesModel = new AnnouncementImagesModel();
const announcementsModel = new AnnouncementsModel();
const brandsModel = new BrandsModel();
const brandSocialsModel = new BrandSocialsModel();
const careerRequestsModel = new CareerRequestsModel();
const careersSettingsModel = new CareersSettingsModel();
const pageOrderModel = new PageOrderModel();
const cateringRequestsModel = new CateringRequestsModel();
const eventMediaModel = new EventMediaModel();
const eventRequestsModel = new EventRequestsModel();
const eventSettingsModel = new EventSettingsModel();
const countryModel = new CountryModel();
const cuisinesModel = new CuisinesModel();
const dietaryRestrictionsModel = new DietaryRestrictionsModel();
const discoveryContentCategoryBucketsModel = new DiscoveryContentCategoryBucketsModel();
const discoveryContentCategoriesModel = new DiscoveryContentCategoriesModel();
const discoveryContentMediaModel = new DiscoveryContentMediaModel();
const discoveryContentMetaTagsModel = new DiscoveryContentMetaTagsModel();
const discoveryContentModel = new DiscoveryContentModel();
const discoveryContentPlatformModel = new DiscoveryContentUrlPlatformsModel();
const discoveryContentURLsModel = new DiscoveryContentURLsModel();
const drinkItemModel = new DrinkItemModel();
const itemSizeTypeModel = new ItemSizeTypeModel();
const managerPackageModel = new ManagerPackageModel();
const managerRestaurantModel = new ManagerRestaurantModel();
const managersModel = new ManagersModel();
const mediaLibraryModel = new MediaLibraryModel();
const menuDisclaimerModel = new MenuDisclaimerModel();
const menuItemMediaModel = new MenuItemMediaModel();
const menuItemModel = new MenuItemModel();
const menuItemVideoThumbnailsModel = new MenuItemVideoThumbnailsModel();
const menuHoursModel = new MenuHoursModel();
const menuLayoutModel = new MenuLayoutModel();
const menuSectionsModel = new MenuSectionsModel();
const modifierGroupModel = new ModifierGroupModel();
const modifierModel = new ModifierModel();
const modifierToModifierGroupLinkModel = new ModifierToModifierGroupLinkModel();
const packagePermissionModel = new PackagePermissionModel();
const platformIntegrationModel = new PlatformIntegrationModel();
const productPriceModel = new ProductPriceModel();
const restaurantMenuSnapshotModel = new RestaurantMenuSnapshotModel();
const profileCardsModel = new ProfileCardsModel();
const profileCardMediaModel = new ProfileCardMediaModel();
const profilePagesModel = new ProfilePagesModel();
const profileSectionsModel = new ProfileSectionsModel();
const profileSectionTemplatesModel = new ProfileSectionTemplatesModel();
const restaurantAddressModel = new RestaurantAddressModel();
const restaurantGroupsModel = new RestaurantGroupsModel();
const restaurantHoursModel = new RestaurantHoursModel();
const restaurantImagesModel = new RestaurantImagesModel();
const restaurantImageTypeModel = new RestaurantImageTypesModel();
const restaurantPackageModel = new RestaurantPackageModel();
const restaurantProfileAlbumMediaModel = new RestaurantProfileAlbumMediaModel();
const restaurantProfileAlbumsModel = new RestaurantProfileAlbumsModel();
const restaurantProfileMediaModel = new RestaurantProfileMediaModel();
const restaurantsModel = new RestaurantsModel();
const restaurantSocialModel = new RestaurantSocialsModel();
const restaurantTypographyModel = new RestaurantTypographyModel();
const restaurantUserEmailsModel = new RestaurantUserEmailsModel();
const softDeleteModel = new SoftDeleteModel();
const stripeConnectAccountModel = new StripeConnectAccountModel();
const stripeCustomerModel = new StripeCustomerModel();
const stripeIdempotenceModel = new StripeIdempotenceModel();
const stripeTaxModel = new StripeTaxModel();
const subscriptionModel = new SubscriptionModel();
const subscriptionItemModel = new SubscriptionItemModel();
const tagsModel = new TagsModel();
const titlesModel = new TitlesModel();
const fontsModel = new FontsModel();
const usersModel = new UsersModel();

/**********************
 * Services
 **********************/

/**
 * Due to service dependencies, alphabetical order is not possible for services until a dependency injection library is utilized
 */
const aggregateService = new AggregateService(aggregateModel);
const announcementImagesService = new AnnouncementImagesService(announcementImagesModel);
const authService = new AuthService(usersModel);
const restaurantGroupsService = new RestaurantGroupsService(restaurantGroupsModel);
const brandSocialsService = new BrandSocialsService(brandSocialsModel);
const brandsService = new BrandsService(brandsModel, restaurantGroupsService, restaurantsModel, brandSocialsService);
const countryService = new CountryService(countryModel);
const cuisinesService = new CuisinesService(cuisinesModel);
const dietaryRestrictionsService = new DietaryRestrictionsService(dietaryRestrictionsModel);
const discoveryContentCategoriesService = new DiscoveryContentCategoriesService(discoveryContentCategoriesModel);
const discoveryContentCategoryBucketsService = new DiscoveryContentCategoryBucketsService(
  discoveryContentCategoryBucketsModel,
  discoveryContentCategoriesService,
);
const discoveryContentMediaService = new DiscoveryContentMediaService(discoveryContentMediaModel);
const discoveryContentMetaTagsService = new DiscoveryContentMetaTagsService(discoveryContentMetaTagsModel);
const discoveryContentUrlPlatformService = new DiscoveryContentUrlPlatformsService(discoveryContentPlatformModel);
const discoveryContentURLsService = new DiscoveryContentURLsService(discoveryContentURLsModel, discoveryContentUrlPlatformService);
const discoveryContentService = new DiscoveryContentService(
  discoveryContentModel,
  discoveryContentMediaService,
  discoveryContentURLsService,
  discoveryContentMetaTagsService,
  discoveryContentCategoryBucketsService,
);
const drinkItemService = new DrinkItemService(drinkItemModel);
const itemSizeService = new ItemSizeService(aggregateService, itemSizeTypeModel);
const managerPackageService = new ManagerPackageService(managerPackageModel);
const managerRestaurantService = new ManagerRestaurantService(managerRestaurantModel);
const mediaLibraryService = new MediaLibraryService(mediaLibraryModel);
const packagePermissionsService = new PackagePermissionService(packagePermissionModel);
const platformIntegrationService = new PlatformIntegrationService(platformIntegrationModel);
const productPriceService = new ProductPriceService(productPriceModel);
const restaurantMenuSnapshotService = new RestaurantMenuSnapshotService(restaurantMenuSnapshotModel);
const profileCardMediaService = new ProfileCardMediaService(profileCardMediaModel);
const profileCardsService = new ProfileCardsService(profileCardsModel, profileCardMediaService);
const profileSectionTemplatesService = new ProfileSectionTemplatesService(profileSectionTemplatesModel);
const restaurantProfileMediaService = new RestaurantProfileMediaService(restaurantProfileMediaModel);
const profileSectionsService = new ProfileSectionsService(
  profileSectionTemplatesService,
  profileSectionsModel,
  mediaLibraryService,
  restaurantProfileMediaService,
  profileCardsService,
);
const profilePagesService = new ProfilePagesService(profileSectionsService, profilePagesModel);
const restaurantAddressService = new RestaurantAddressService(restaurantAddressModel);
const restaurantHoursService = new RestaurantHoursService(restaurantHoursModel);
const restaurantImageTypesService = new RestaurantImageTypesService(restaurantImageTypeModel);
const restaurantPackageService = new RestaurantPackageService(restaurantPackageModel);
const restaurantImagesService = new RestaurantImagesService(restaurantImagesModel, mediaLibraryService, restaurantImageTypesService);
const restaurantProfileAlbumMediaService = new RestaurantProfileAlbumMediaService(restaurantProfileAlbumMediaModel);
const restaurantProfileAlbumsService = new RestaurantProfileAlbumsService(restaurantProfileAlbumsModel, restaurantProfileAlbumMediaService);
const restaurantSocialsService = new RestaurantSocialsService(restaurantSocialModel);
const stripeConnectServiceRef: { current: StripeConnectServiceInterface | null } = { current: null };
const stripeConnectServiceProxy: StripeConnectServiceInterface = {
  createConnectedAccountForRestaurant: (restaurantId: number) => {
    if (!stripeConnectServiceRef.current) {
      throw new Error('StripeConnectService not initialized');
    }
    return stripeConnectServiceRef.current.createConnectedAccountForRestaurant(restaurantId);
  },
  linkExistingConnectAccount: (restaurantId: number, stripeAccountId: string) => {
    if (!stripeConnectServiceRef.current) {
      throw new Error('StripeConnectService not initialized');
    }
    return stripeConnectServiceRef.current.linkExistingConnectAccount(restaurantId, stripeAccountId);
  },
};
export const restaurantsService = new RestaurantsService(
  countryService,
  cuisinesService,
  managerRestaurantService,
  restaurantAddressService,
  restaurantImagesService,
  restaurantsModel,
  restaurantSocialsService,
  restaurantHoursService,
  restaurantProfileAlbumsService,
  stripeConnectServiceProxy,
);
const restaurantTypographyService = new RestaurantTypographyService(restaurantTypographyModel, fontsModel);
const restaurantUserEmailsService = new RestaurantUserEmailsService(restaurantsService, restaurantUserEmailsModel);
const careerRequestsService = new CareerRequestsService(careerRequestsModel);
const careersSettingsService = new CareersSettingsService(careersSettingsModel, restaurantsService);
const pageOrderService = new PageOrderService(pageOrderModel, restaurantsService);
const cateringRequestsService = new CateringRequestsService(cateringRequestsModel);
const cateringSettingsService = new CateringSettingsService(restaurantsService);
const eventRequestsService = new EventRequestsService(eventRequestsModel);
const eventSettingsService = new EventSettingsService(eventSettingsModel, restaurantsService);
const eventMediaService = new EventMediaService(eventMediaModel);
const softDeleteService = new SoftDeleteService(softDeleteModel);
const stripeCustomerService = new StripeCustomerService(stripeCustomerModel);
const stripeIdempotenceService = new StripeIdempotenceService(stripeIdempotenceModel);
const stripeTaxService = new StripeTaxService(stripeTaxModel);
const subscriptionItemService = new SubscriptionItemService(productPriceService, subscriptionItemModel);
const subscriptionService = new SubscriptionService(subscriptionItemService, subscriptionModel);
const tagsService = new TagsService(tagsModel);
const titlesService = new TitlesService(titlesModel);
const fontsService = new FontsService(fontsModel);
const menuDisclaimersService = new MenuDisclaimersService(menuDisclaimerModel);
const menuItemVideoThumbnailService = new MenuItemVideoThumbnailsService(menuItemVideoThumbnailsModel);
const menuItemMediaService = new MenuItemMediaService(menuItemMediaModel, menuItemVideoThumbnailService);
const menuItemService = new MenuItemService(
  aggregateService,
  dietaryRestrictionsService,
  drinkItemService,
  itemSizeService,
  menuItemModel,
  restaurantsService,
  tagsService,
  menuItemMediaService,
);
const menuHoursService = new MenuHoursService(menuHoursModel);
const menuLayoutService = new MenuLayoutService(menuLayoutModel);
const menuSectionsService = new MenuSectionsService(menuSectionsModel);
const modifierToModifierGroupLinkService = new ModifierToModifierGroupLinkService(modifierToModifierGroupLinkModel);
const modifierGroupService = new ModifierGroupService(modifierGroupModel, modifierToModifierGroupLinkService);
const modifierService = new ModifierService(modifierModel);
const packageService = new PackageService(managerPackageService, packagePermissionsService, restaurantPackageService, subscriptionItemService);
const announcementsService = new AnnouncementsService(announcementImagesService, restaurantAddressService, announcementsModel);
const managersService = new ManagersService(managersModel, titlesModel, restaurantsService);
const menuModel = new MenusModel(menuHoursService, menuSectionsService, menuDisclaimersService, softDeleteService);
const menusService = new MenusService(menuModel, menuHoursService, menuSectionsService, menuItemService, menuDisclaimersService);
export const menuDetailsService = new MenuDetailsService(
  mediaLibraryService,
  menusService,
  menuItemService,
  modifierService,
  modifierGroupService,
  restaurantsService,
);
export const checkmateIntegrationService = new CheckmateIntegrationService(
  platformIntegrationService,
  restaurantsService,
  restaurantMenuSnapshotService,
  menuDetailsService,
);

const otterOrganizationService = new OtterOrganizationService();
const otterAuthService = new OtterAuthService(platformIntegrationService);
// Must precede otterIntegrationService: the webhook ingress routes `storefront.*` events into it.
const otterStorefrontService = new OtterStorefrontService(
  platformIntegrationService,
  restaurantsService,
  restaurantHoursService,
  restaurantAddressService,
  otterAuthService,
);
export const otterIntegrationService = new OtterIntegrationService(
  platformIntegrationService,
  restaurantsService,
  otterOrganizationService,
  otterAuthService,
  restaurantMenuSnapshotService,
  menuDetailsService,
  menusService,
  menuModel,
  menuHoursService,
  modifierGroupModel,
  otterStorefrontService,
);

const restaurantBackupService = new RestaurantBackupService(menusService, restaurantsModel);

const stripeService = new StripeService(
  managerPackageService,
  managersService,
  stripeCustomerService,
  stripeIdempotenceService,
  subscriptionService,
  stripeTaxService,
  subscriptionItemService,
  restaurantPackageService,
);

const stripeConnectService = new StripeConnectService(stripeService, restaurantsModel, stripeConnectAccountModel);
stripeConnectServiceRef.current = stripeConnectService;

/**********************
 * Controllers
 **********************/

const announcementsController = new AnnouncementsController(announcementsService);
const authController = new AuthController(authService);
const brandsController = new BrandsController(brandsService);
const careerRequestsController = new CareerRequestsController(careerRequestsService);
const careersSettingsController = new CareersSettingsController(careersSettingsService);
const pageOrderController = new PageOrderController(pageOrderService);
const cateringRequestsController = new CateringRequestsController(cateringRequestsService);
const cateringSettingsController = new CateringSettingsController(cateringSettingsService);
const eventRequestsController = new EventRequestsController(eventRequestsService);
const eventSettingsController = new EventSettingsController(eventSettingsService);
const eventMediaController = new EventMediaController(eventMediaService);
const checkmateIntegrationController = new CheckmateIntegrationController(checkmateIntegrationService);
const otterIntegrationController = new OtterIntegrationController(otterIntegrationService, otterStorefrontService);
const cuisinesController = new CuisinesController(cuisinesService);
const dietaryRestrictionsController = new DietaryRestrictionsController(dietaryRestrictionsService);
const discoveryContentController = new DiscoveryContentController(discoveryContentService);
const drinkItemController = new DrinkItemController(drinkItemService);
const managersController = new ManagersController(managersService);
const mediaLibraryController = new MediaLibraryController(mediaLibraryService);
const menuItemController = new MenuItemController(menuItemService);
const menuLayoutController = new MenuLayoutController(menuLayoutService);
const menusController = new MenusController(menusService, softDeleteService);
const menuSectionsController = new MenuSectionsController(menuSectionsService, softDeleteService);
const modifierGroupController = new ModifierGroupController(modifierGroupService);
const modifierController = new ModifierController(modifierService);
const packageController = new PackageController(packageService);
const profilePagesController = new ProfilePagesController(profilePagesService);
const profileSectionsController = new ProfileSectionsController(profileSectionsService);
const restaurantGroupsController = new RestaurantGroupsController(restaurantGroupsService);
const restaurantController = new RestaurantController(
  restaurantsService,
  restaurantBackupService,
  stripeConnectServiceProxy,
  restaurantTypographyService,
);
const restaurantUserEmailsController = new RestaurantUserEmailsController(restaurantUserEmailsService);
const stripeController = new StripeController(stripeService);
const tagsController = new TagsController(tagsService);
const titlesController = new TitlesController(titlesService);
const fontsController = new FontsController(fontsService);

/**********************
 * Routes
 **********************/

const announcementRoute = new AnnouncementRoute(announcementsController);
const announcementsRoute = new AnnouncementsRoute(announcementsController);
const authRoute = new AuthRoute(authController, managersController);
const brandsRoute = new BrandsRoute(brandsController);
const careerRequestsRoute = new CareerRequestsRoute(careerRequestsController);
const careersSettingsRoute = new CareersSettingsRoute(careersSettingsController);
const pageOrderRoute = new PageOrderRoute(pageOrderController);
const cateringRequestsRoute = new CateringRequestsRoute(cateringRequestsController);
const cateringSettingsRoute = new CateringSettingsRoute(cateringSettingsController);
const eventRequestsRoute = new EventRequestsRoute(eventRequestsController);
const eventSettingsRoute = new EventSettingsRoute(eventSettingsController);
const eventMediaRoute = new EventMediaRoute(eventMediaController);
const checkmateRoute = new CheckmateIntegrationRoute(checkmateIntegrationController);
const otterRoute = new OtterIntegrationRoute(otterIntegrationController);
const cuisinesRoute = new CuisinesRoute(cuisinesController);
const discoveryContentRoute = new DiscoveryContentRoute(discoveryContentController);
const drinkItemRoute = new DrinkItemRoute(drinkItemController, menuItemController);
const drinkItemsRoute = new DrinkItemsRoute(drinkItemController);
const indexRoute = new IndexRoute();
const managerRoute = new ManagerRoute(managersController);
const managersRoute = new ManagersRoute(managersController);
const mediaLibraryRoute = new MediaLibraryRoute(mediaLibraryController);
const menuItemRoute = new MenuItemRoute(menuItemController);
const menuItemsRoute = new MenuItemsRoute(menuItemController);
const menuLayoutRoute = new MenuLayoutRoute(menuLayoutController);
const menuSectionsRoute = new MenuSectionsRoute(menuSectionsController);
const menusRoute = new MenusRoute(menusController);
const modifierGroupRoute = new ModifierGroupRoute(modifierGroupController);
const modifierGroupsRoute = new ModifierGroupsRoute(modifierGroupController);
const modifierRoute = new ModifierRoute(modifierController);
const modifiersRoute = new ModifiersRoute(modifierController);
const profilePagesRoute = new ProfilePagesRoute(profilePagesController);
const profileSectionsRoute = new ProfileSectionsRoute(profileSectionsController);
const restaurantRoute = new RestaurantRoute(packageController, restaurantController);
const restaurantGroupsRoute = new RestaurantGroupsRoute(restaurantGroupsController, brandsController);
const restaurantsRoute = new RestaurantsRoute(restaurantController);
const restaurantUserEmailsRoute = new RestaurantUserEmailRoute(restaurantUserEmailsController);
const restrictionRoute = new DietaryRestrictionsRoute(dietaryRestrictionsController);
const stripeManagerRoute = new StripeManagerRoute(stripeController);
const stripePackagesRoute = new StripePackagesRoute(stripeController);
const stripeRoute = new StripeRoute(stripeController);

const tagsRoute = new TagsRoute(tagsController);
const titlesRoute = new TitlesRoute(titlesController);
const fontsRoute = new FontsRoute(fontsController);

export const routes: RouteInterface[] = [
  authRoute,
  // Index Route initialized since base path is most generic e.g. '/'
  // but want to check auth router first
  indexRoute,
  announcementRoute,
  announcementsRoute,
  brandsRoute,
  careerRequestsRoute,
  careersSettingsRoute,
  pageOrderRoute,
  cateringRequestsRoute,
  cateringSettingsRoute,
  eventRequestsRoute,
  eventSettingsRoute,
  eventMediaRoute,
  checkmateRoute,
  otterRoute,
  cuisinesRoute,
  discoveryContentRoute,
  drinkItemRoute,
  drinkItemsRoute,
  managerRoute,
  managersRoute,
  mediaLibraryRoute,
  menuItemRoute,
  menuItemsRoute,
  menuLayoutRoute,
  menuSectionsRoute,
  menusRoute,
  modifierGroupRoute,
  modifierGroupsRoute,
  modifierRoute,
  modifiersRoute,
  profilePagesRoute,
  profileSectionsRoute,
  restaurantRoute,
  restaurantGroupsRoute,
  restaurantsRoute,
  restaurantUserEmailsRoute,
  restrictionRoute,
  stripeManagerRoute,
  stripePackagesRoute,
  stripeRoute,
  tagsRoute,
  titlesRoute,
  fontsRoute,
];
