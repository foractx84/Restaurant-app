import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import {
  CreateRestaurantRequestInterface,
  CreateRestaurantResponseInterface,
  GetRestaurantResponse,
  GetRestaurantsResponse,
  RestaurantsModelInterface,
  RestaurantsServiceInterface,
  EditRestaurantRequestInterface,
  GetRestaurantDetailResponse,
} from '@/interfaces/restaurants.interface';
import { logger } from '@utils/logger';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { GetRestaurantMenuResponse } from '@interfaces/menus.interface';
import { obtainImageURL, obtainUrlHTTPS } from '@utils/imageUtils';
import {
  RestaurantImageResponseInterface,
  RestaurantImagesServiceInterface,
  RestaurantImagesInterface,
  RestaurantImageDetailsInterface,
} from '@interfaces/restaurantImages.interface';
import { RestaurantImageType } from '@/enums/restaurantImageType';
import { RestaurantImageEntity } from '@/entities/restaurantImage.entity';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@/utils/dbUtils';
import getSymbolFromCurrency from 'currency-symbol-map';
import { CuisinesServiceInterface } from '@/interfaces/cuisines.interface';
import { RestaurantAddressInterface, RestaurantAddressServiceInterface } from '@/interfaces/restaurantAddress.interface';
import { CountryServiceInterface } from '@/interfaces/country.interface';
import { ManagerRestaurantServiceInterface } from '@/interfaces/managerRestaurant.interface';
import { CountryEntity } from '@/entities/country.entity';
import { CuisineEntity } from '@/entities/cuisine.entity';
import { RestaurantAddressEntity } from '@/entities/restaurantAddress.entity';
import { RestaurantMenuLayoutEntity } from '@/entities/restaurantMenuLayout.entity';
import { MenuLayoutInterface } from '@interfaces/menuLayout.interface';
import { RestaurantSocialsServiceInterface } from '@/interfaces/restaurantSocials.interface';
import { RestaurantSocialsEntity } from '@/entities/restaurantSocials.entity';
import { RestaurantHoursServiceInterface } from '@/interfaces/restaurantHours.interface';
import { RestaurantHoursEntity } from '@/entities/restaurantHours.entity';
import { MediaEntity } from '@/entities/media.entity';
import { RestaurantProfileAlbumsEntity } from '@/entities/restaurantProfileAlbums.entity';
import { RestaurantProfileAlbumsResponseInterface, RestaurantProfileAlbumsServiceInterface } from '@/interfaces/restaurantProfileAlbums.interface';
import { RestaurantProfileAlbumMediaResponseInterface } from '@/interfaces/restaurantProfileAlbumMedia.interface';
import { RestaurantProfileAlbumMediaEntity } from '@/entities/restaurantProfileAlbumMedia.entity';
import { RestaurantImageTypeEntity } from '@/entities/restaurantImageType.entity';
import { IMAGE_TYPE_ID } from '@/constants/media.constants';
import { GetProfilePageResponseInterface } from '@/interfaces/profilePages.interface';
import { ProfilePageEntity } from '@/entities/profilePage.entity';
import { StripeConnectServiceInterface } from '@/services/stripeConnect.service';
class RestaurantsService implements RestaurantsServiceInterface {
  private restaurantImagesService: RestaurantImagesServiceInterface;
  private restaurantsModel: RestaurantsModelInterface;
  private cuisinesService: CuisinesServiceInterface;
  private countryService: CountryServiceInterface;
  private restaurantAddressService: RestaurantAddressServiceInterface;
  private managerRestaurantService: ManagerRestaurantServiceInterface;
  private restaurantSocialsService: RestaurantSocialsServiceInterface;
  private restaurantHoursService: RestaurantHoursServiceInterface;
  private restaurantProfileAlbumsService: RestaurantProfileAlbumsServiceInterface;
  private stripeConnectService: StripeConnectServiceInterface;

  constructor(
    countryService: CountryServiceInterface,
    cuisinesService: CuisinesServiceInterface,
    managerRestaurantService: ManagerRestaurantServiceInterface,
    restaurantAddressService: RestaurantAddressServiceInterface,
    restaurantImagesService: RestaurantImagesServiceInterface,
    restaurantsModel: RestaurantsModelInterface,
    restaurantSocialsService: RestaurantSocialsServiceInterface,
    restaurantHoursService: RestaurantHoursServiceInterface,
    restaurantProfileAlbumsService: RestaurantProfileAlbumsServiceInterface,
    stripeConnectService: StripeConnectServiceInterface,
  ) {
    this.restaurantsModel = restaurantsModel;
    this.cuisinesService = cuisinesService;
    this.countryService = countryService;
    this.restaurantAddressService = restaurantAddressService;
    this.managerRestaurantService = managerRestaurantService;
    this.restaurantImagesService = restaurantImagesService;
    this.restaurantSocialsService = restaurantSocialsService;
    this.restaurantHoursService = restaurantHoursService;
    this.restaurantProfileAlbumsService = restaurantProfileAlbumsService;
    this.stripeConnectService = stripeConnectService;
  }

  createRestaurant = async (
    managerID: number,
    restaurant: CreateRestaurantRequestInterface,
    isSuper = false,
  ): Promise<CreateRestaurantResponseInterface> => {
    try {
      const createdRestaurant: CreateRestaurantResponseInterface = await this.createRestaurantWithoutManager(restaurant);

      // if not superuser, add managerID and created restaurantID into manager_restaurants table
      if (!isSuper) {
        await this.managerRestaurantService.insertManagerRestaurantEntity(managerID, createdRestaurant?.restaurantID);
      }

      return createdRestaurant;
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while creating restaurant by manager id: ${managerID} and restaurant: ${JSON.stringify(restaurant)} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating restaurants by manager id: ${managerID} and restaurant: ${JSON.stringify(
              restaurant,
            )}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  createRestaurantWithoutManager = async (restaurant: CreateRestaurantRequestInterface): Promise<CreateRestaurantResponseInterface> => {
    try {
      const { name, address, cuisineID, socials, restaurantHours } = restaurant || {};

      const { address1, city, governingDistrict, postalCode, country } = address || {};

      const countryEntity = await this.countryService.checkCountryExistsByName(country);

      const cuisineEntity = await this.cuisinesService.checkIfCuisineExists(cuisineID);

      await this.checkRestaurantAlreadyExistsByNameAndAddress(name, address1, city, governingDistrict, countryEntity.country_id, postalCode);
      const ormConn: EntityManager = await ormConnection();
      let result;
      await ormConn.transaction(async conn => {
        const createdRestaurant = await this.restaurantsModel.insertRestaurantEntity(this.buildRestaurantEntity(restaurant), conn);

        const createdRestaurantAddress = await this.restaurantAddressService.createRestaurantAddress(
          address,
          countryEntity,
          createdRestaurant.restaurant_id,
          conn,
        );

        const createdRestaurantHours = await this.restaurantHoursService.createRestaurantHours(
          restaurantHours,
          createdRestaurant.restaurant_id,
          conn,
        );

        // if any social url exists (i.e. facebook: https....facebook.com) that is longer than an empty string
        let createdRestaurantSocials: RestaurantSocialsEntity;
        if (socials && Object.values(socials)?.some(social => social?.trim()?.length)) {
          createdRestaurantSocials = await this.restaurantSocialsService.createRestaurantSocials(
            { ...socials, restaurantID: createdRestaurant.restaurant_id },
            conn,
          );
        }

        result = this.buildCreateRestaurantResponse(
          countryEntity,
          cuisineEntity,
          createdRestaurant,
          createdRestaurantAddress,
          createdRestaurantSocials,
          createdRestaurantHours,
        );
      });

      try {
        const connectData = await this.stripeConnectService.createConnectedAccountForRestaurant(result.restaurantID);
        result.stripeOnboardingUrl = connectData.onboarding_url;
        result.stripeAccountId = connectData.account_id;
      } catch (stripeErr) {
        logger.error(`Failed to create Stripe Connect account for restaurant ${result.restaurantID}: ${stripeErr}`);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.stripeException, 'Failed to create Stripe Connect account. Please contact support.'),
        );
      }

      return result;
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while creating restaurant: ${JSON.stringify(restaurant)} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating restaurant: ${JSON.stringify(restaurant)}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  editRestaurant = async (restaurant: EditRestaurantRequestInterface, restaurantID: number): Promise<void> => {
    try {
      const { name, address, phone, email, restaurantHours, availabilityNotes } = restaurant || {};

      const { country } = address || {};

      let countryEntity;

      if (address) {
        countryEntity = await this.countryService.checkCountryExistsByName(country);
      }

      if (name && !address) {
        await this.checkRestaurantAlreadyExistsByNameAndRestaurantID(name, restaurantID);
      } else if (name && address) {
        const { address1, city, governingDistrict, postalCode } = address;

        await this.checkRestaurantAlreadyExistsByNameAndAddress(
          name,
          address1,
          city,
          governingDistrict,
          countryEntity.country_id,
          postalCode,
          restaurantID,
        );
      } else if (!name && address) {
        const { address1, city, governingDistrict, postalCode } = address;

        await this.checkRestaurantAlreadyExistsByAddressAndRestaurantID(
          address1,
          city,
          governingDistrict,
          countryEntity.country_id,
          postalCode,
          restaurantID,
        );
      }

      const ormConn: EntityManager = await ormConnection();

      await ormConn.transaction(async conn => {
        const restaurantUpdate: EditRestaurantRequestInterface = {
          name,
          phone,
          email,
          availabilityNotes,
        };

        const shouldUpdateRestaurant = name || phone || email || typeof availabilityNotes === 'string';

        if (shouldUpdateRestaurant) {
          await this.restaurantsModel.updateRestaurantEntity(this.buildRestaurantEntityForUpdate(restaurantUpdate), restaurantID, conn);
        }

        if (address) {
          await this.restaurantAddressService.updateRestaurantAddress(address, countryEntity, restaurantID, conn);
        }

        if (restaurantHours?.length) {
          await this.restaurantHoursService.removeRestaurantHours(restaurantID, conn);

          await this.restaurantHoursService.createRestaurantHours(restaurantHours, restaurantID, conn);
        }
      });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while editing restaurant: ${JSON.stringify(restaurant)} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error occurred while editing restaurant: ${JSON.stringify(restaurant)}. Refer to logs for more info.`,
        ),
      );
    }
  };

  findRestaurantEntityByID = async (restaurantID: number): Promise<RestaurantEntity> => {
    try {
      return await this.restaurantsModel.getRestaurantEntityByID(restaurantID);
    } catch (err) {
      logger.error(`Error occurred while getting restaurant by ID: ${restaurantID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting restaurant by ID: ${restaurantID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  updateRestaurantEntity = async (patch: Partial<RestaurantEntity>, restaurantID: number): Promise<void> => {
    try {
      await this.restaurantsModel.updateRestaurantEntity(patch, restaurantID);
    } catch (err) {
      logger.error(`Error occurred while updating restaurant by ID: ${restaurantID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while updating restaurant by ID: ${restaurantID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  /**
   * Reads the storefront availability flag (`false` == paused). Throws 404 when the restaurant does
   * not exist, so an Otter webhook naming an unknown store surfaces as a real error rather than
   * silently reporting the store as paused.
   */
  findRestaurantAcceptingOrders = async (restaurantID: number): Promise<boolean> => {
    const isAcceptingOrders = await this.restaurantsModel.getRestaurantAcceptingOrdersByID(restaurantID);
    if (isAcceptingOrders === null) {
      throw new HttpException(404, getErrorPayload(InternalErrorCode.inputValueNotInDB, `Restaurant ${restaurantID} does not exist.`));
    }
    return isAcceptingOrders;
  };

  /** Sets the storefront availability flag (`false` == paused). */
  setRestaurantAcceptingOrders = async (restaurantID: number, isAcceptingOrders: boolean): Promise<void> => {
    await this.restaurantsModel.updateRestaurantAcceptingOrders(restaurantID, isAcceptingOrders);
  };

  findRestaurantEntityByIDAndLocationID = async (restaurantID: number, locationID: number, manager?: EntityManager): Promise<RestaurantEntity> => {
    try {
      return await this.restaurantsModel.getRestaurantEntityByIDAndLocationID(restaurantID, locationID, manager);
    } catch (err) {
      logger.error(`Error occurred while getting restaurant by ID: ${restaurantID} and locationID: ${locationID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting restaurant by ID: ${restaurantID} and locationID: ${locationID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  findRestaurantEntityWithModifiersByID = async (restaurantID: number, manager?: EntityManager): Promise<RestaurantEntity> => {
    try {
      return await this.restaurantsModel.getRestaurantEntityWithModifiersByID(restaurantID, manager);
    } catch (err) {
      logger.error(`Error occurred while getting restaurant with modifiers by ID: ${restaurantID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting restaurant with modifiers by ID: ${restaurantID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };

  findRestaurantsByManagerID = async (managerID: number, isSuper = false): Promise<GetRestaurantsResponse> => {
    try {
      return this.buildGetRestaurantsResponse(await this.restaurantsModel.getRestaurantsEntityByManagerID(managerID, isSuper));
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while retrieving restaurants by manager id: ${managerID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while retrieving restaurants by manager id: ${managerID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getRestaurantDetails = async (restaurantID: number): Promise<GetRestaurantDetailResponse> => {
    try {
      return this.buildGetRestaurantDetailsResponse(await this.restaurantsModel.getRestaurantDetailsEntityByRestaurantID(restaurantID));
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while retrieving restaurant by restaurantID: ${restaurantID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while retrieving restaurant by restaurantID: ${restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  uploadRestaurantImages = async (
    galleryImages: string[],
    galleryImagesToDelete: number[],
    galleryOrder: string[],
    imagesToDelete: number[],
    logoImage: string,
    menuCoverImage: string,
    profileImages: string[],
    restaurantID: number,
    thumbnailImage: string,
  ): Promise<RestaurantImagesInterface> => {
    try {
      // check if restaurant images are valid with imagesToDelete
      await this.restaurantImagesService.validateRestaurantImages(
        imagesToDelete,
        logoImage,
        menuCoverImage,
        profileImages,
        restaurantID,
        thumbnailImage,
      );

      // validate gallery image upload, deleting, and reordering, and then get restaurant albums
      const validatedAlbums: RestaurantProfileAlbumsEntity[] =
        (await this.restaurantProfileAlbumsService.validateGalleryImageUploadAndFetchRestaurantAlbums(
          galleryImages,
          galleryImagesToDelete,
          galleryOrder,
          restaurantID,
        )) || [];
      let insertedRestaurantImages: RestaurantImageEntity[] = [];
      let insertedMedia: MediaEntity[] = [];
      const insertedRestaurantProfileAlbumMedia: RestaurantProfileAlbumMediaEntity[] = [];
      let restaurantImageTypes: RestaurantImageTypeEntity[] = [];
      let albumID: number;
      const ormConn: EntityManager = await ormConnection();
      await ormConn.transaction(async conn => {
        // delete restaurant_images
        if (imagesToDelete?.length > 0) {
          await this.restaurantImagesService.deleteImages(imagesToDelete, restaurantID, conn);
        }
        // delete gallery images (leave them untouched in media library)
        if (galleryImagesToDelete?.length > 0) {
          await this.restaurantProfileAlbumsService.deleteGalleryImagesByIDsForAlbum(galleryImagesToDelete, restaurantID, conn);
        }

        // setup restaurant (non gallery) images up to media library and restaurant_images
        const [images, mediaLibrary, restaurantImageTypesResult] = await this.restaurantImagesService.setupRestaurantAndMediaLibraryImages(
          logoImage,
          menuCoverImage,
          profileImages,
          restaurantID,
          thumbnailImage,
        );

        // set restaurant image types for response back to client later
        restaurantImageTypes = images.length ? restaurantImageTypesResult : [];

        // setup gallery images up to media library
        if (galleryImages?.length) {
          galleryImages.map(image => {
            mediaLibrary.push(new MediaEntity(image, IMAGE_TYPE_ID, restaurantID));
          });
        }

        // insert restaurant images and gallery images into media library, and restaurant images into restarant_images db tables
        const [tempInsertedMedia, tempInsertedRestaurantImages] = await this.restaurantImagesService.setupInsertingRestaurantImages(
          images,
          mediaLibrary,
          conn,
        );

        // inserted gallery images
        insertedMedia = tempInsertedMedia;

        // inserted restaurant images for client response
        insertedRestaurantImages = tempInsertedRestaurantImages;

        // now handle uploading gallery images to be linked to album(s) and pointed to media library
        if (galleryImages?.length) {
          await this.restaurantProfileAlbumsService.setupInsertingAlbumAndGalleryImages(
            galleryImages,
            validatedAlbums,
            insertedMedia,
            restaurantID,
            insertedRestaurantProfileAlbumMedia,
            conn,
          );
        }

        // set up list_order (list order can be independent and occur even if not uploading new gallery images)
        if (galleryOrder?.length) {
          albumID = validatedAlbums[0].restaurant_profile_album_id;
          await this.restaurantProfileAlbumsService.setupGalleryImagesListOrder(
            albumID,
            galleryImages,
            galleryOrder,
            insertedRestaurantProfileAlbumMedia,
            conn,
          );
        }
      });
      // returning images based on restaurant_images id for profile, logo, thumbnail, menuCover
      // gallery images returned ids are for the linking table restaurant_profile_album_media
      // if no image is uploaded, then it wont be returned in response
      // if no gallery images uploaded, then no album returned in response
      return this.buildRestaurantImageUploadResponse(insertedRestaurantImages, galleryImages?.length ? validatedAlbums : [], restaurantImageTypes);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while uploading restaurant images for restaurant: ${restaurantID} - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while uploading restaurant images for restaurant: ${restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  verifyRestaurants = async (restaurantIDs: number[]): Promise<number[]> => {
    const verified: number[] = [];
    for (const id of restaurantIDs) {
      const result = await this.restaurantsModel.getRestaurantByID(id);
      if (result) {
        // if result is not empty
        verified.push(result.restaurantID); // add to list of verified restaurants
      }
    }
    if (verified.length !== restaurantIDs.length) {
      // if no restaurants found throw error
      if (verified.length === 0) {
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `No restaurants found with the IDs ${restaurantIDs.join(', ')}`),
        );
      } else {
        // crosscheck verified array and user input array
        const notVerified = restaurantIDs.filter(id => verified.indexOf(id) < 0); // generate list of restaurants that weren't found
        throw new HttpException(
          404,
          getErrorPayload(InternalErrorCode.inputValueNotInDB, `No restaurants found with the IDs ${notVerified.join(', ')}`),
        );
      }
    }
    return verified;
  };

  buildCreateRestaurantResponse = (
    country: CountryEntity,
    cuisine: CuisineEntity,
    restaurant: RestaurantEntity,
    address: RestaurantAddressEntity,
    socials: RestaurantSocialsEntity,
    hours: RestaurantHoursEntity[],
  ): CreateRestaurantResponseInterface => {
    return {
      restaurantID: restaurant?.restaurant_id,
      restaurantUrlID: restaurant?.restaurant_url_id,
      name: restaurant?.name,
      description: restaurant?.description || '',
      phone: restaurant?.phone || '',
      email: restaurant?.email || '',
      isPublished: restaurant?.is_published,
      cuisine: {
        cuisineID: cuisine?.cuisine_id,
        name: cuisine?.name,
      },
      website: restaurant?.website || '',
      address: {
        restaurantAddressID: address.restaurant_address_id,
        address1: address?.address1 || '',
        address2: address?.address2 || '',
        streetNumber: address?.street_number || '',
        streetName: address?.street_name || '',
        city: address?.city || '',
        governingDistrict: address?.governing_district || '',
        country: country?.name || '',
        postalCode: address?.postal_code || '',
        timezone: address?.timezone,
      },
      currency: {
        code: country.currency_code,
        symbol: (getSymbolFromCurrency(country.currency_code) || '') as string,
      },
      socials: {
        facebook: socials?.facebook || '',
        instagram: socials?.instagram || '',
        snapchat: socials?.snapchat || '',
        tiktok: socials?.tiktok || '',
        twitter: socials?.twitter || '',
      },
      restaurantHours: this.restaurantHoursService.buildCreateRestaurantHoursResponse(hours),
      availabilityNotes: restaurant?.availability_notes || '',
    } as CreateRestaurantResponseInterface;
  };

  buildGetRestaurantsResponse = async (restaurants: RestaurantEntity[]): Promise<GetRestaurantsResponse> => {
    const responses: GetRestaurantResponse[] = [];
    for (const restaurant of restaurants)
      responses.push({
        restaurantUrlID: restaurant.restaurant_url_id,
        restaurantID: restaurant.restaurant_id,
        name: restaurant?.name,
      });

    return { restaurants: responses };
  };

  getGalleryAlbumImagesResponse = (albumMedia: RestaurantProfileAlbumMediaEntity[]): RestaurantProfileAlbumMediaResponseInterface[] => {
    return albumMedia
      .sort((a, b) => a.list_order - b.list_order)
      .map(media => ({
        mediaURL: media?.['media_url'] ? obtainImageURL({ imageURL: media?.['media_url'] }) : '',
        mediaID: media?.restaurant_profile_album_media_id,
        type: 'image', // default to image for now
        smallMobile: '',
        largeMobile: '',
        smallDesktop: '',
        largeDesktop: '',
      })) as unknown as RestaurantProfileAlbumMediaResponseInterface[];
  };

  buildGetRestaurantDetailsResponse = async (restaurant: RestaurantEntity): Promise<GetRestaurantDetailResponse> => {
    const buildRestaurantProfileAlbums = (albums: RestaurantProfileAlbumsEntity[]): RestaurantProfileAlbumsResponseInterface[] => {
      albums?.forEach(album => {
        album?.restaurant_profile_album_media.forEach(galleryImage => {
          galleryImage['media_url'] = galleryImage?.media?.media_url || '';
        });
      });
      return albums?.length
        ? albums.map(album => ({
            isHidden: album?.is_hidden,
            albumID: album?.restaurant_profile_album_id,
            name: album?.name,
            description: album?.description || '',
            media: album?.restaurant_profile_album_media?.length ? this.getGalleryAlbumImagesResponse(album?.restaurant_profile_album_media) : [],
          }))
        : null;
    };
    const buildRestaurantMedia = async (
      albums: RestaurantProfileAlbumsEntity[],
      images: RestaurantImageEntity[],
    ): Promise<RestaurantImageDetailsInterface> => {
      const getImageByType = (images: RestaurantImageEntity[], type: RestaurantImageType, profile = false) => {
        if (profile) {
          return images.filter(image => image.restaurant_image_type_id?.['type'] === type);
        }
        return images.find(image => image.restaurant_image_type_id?.['type'] === type);
      };
      // to be refactored
      const logoImage = getImageByType(images, RestaurantImageType.LOGO) as RestaurantImageEntity;
      const profileImages = getImageByType(images, RestaurantImageType.PROFILE, true) as RestaurantImageEntity[];
      const thumbnailImage = getImageByType(images, RestaurantImageType.THUMBNAIL) as RestaurantImageEntity;
      const menuCoverImage = getImageByType(images, RestaurantImageType.MENU_COVER) as RestaurantImageEntity;
      return {
        logo: (logoImage as RestaurantImageEntity)?.restaurant_image_id
          ? {
              imageID: (logoImage as RestaurantImageEntity)?.restaurant_image_id,
              imageURL: obtainImageURL({ imageURL: logoImage?.image_url }),
            }
          : null,
        profile: (profileImages as RestaurantImageEntity[])
          ?.sort((a, b) => a.list_order - b.list_order)
          .map(profileImage => {
            if (profileImage?.restaurant_image_id) {
              return {
                imageID: profileImage?.restaurant_image_id,
                imageURL: obtainImageURL({ imageURL: profileImage?.image_url }),
              };
            }
          })
          ?.filter(Boolean),
        thumbnail: (thumbnailImage as RestaurantImageEntity)?.restaurant_image_id
          ? {
              imageID: (thumbnailImage as RestaurantImageEntity)?.restaurant_image_id,
              imageURL: obtainImageURL({ imageURL: thumbnailImage?.image_url }),
            }
          : null,
        menuCover: (menuCoverImage as RestaurantImageEntity)?.restaurant_image_id
          ? {
              imageID: (menuCoverImage as RestaurantImageEntity)?.restaurant_image_id,
              imageURL: obtainImageURL({ imageURL: menuCoverImage?.image_url }),
            }
          : null,
        albums: buildRestaurantProfileAlbums(albums) || [],
      };
    };
    const buildRestaurantAddress = (restaurantAddress?: RestaurantAddressEntity | null): RestaurantAddressInterface => {
      if (restaurantAddress == null) {
        return {
          address1: '',
          address2: '',
          city: '',
          governingDistrict: '',
          country: '',
          postalCode: '',
        };
      }
      return {
        restaurantAddressID: restaurantAddress.restaurant_address_id,
        address1: restaurantAddress?.address1,
        address2: restaurantAddress?.address2 || '',
        city: restaurantAddress?.city || '',
        governingDistrict: restaurantAddress?.governing_district || '',
        country: restaurantAddress?.country_id?.['name'],
        postalCode: restaurantAddress?.postal_code || '',
        timezone: restaurantAddress?.timezone,
      };
    };
    const buildMenuLayout = (menuLayout: RestaurantMenuLayoutEntity): MenuLayoutInterface => ({
      layoutID: menuLayout?.['menu_layout_id']?.['menu_layout_id'],
      name: menuLayout?.['menu_layout_id']?.['layout'],
    });
    const buildSocialLinks = (socials?: { facebook?: string; instagram?: string; snapchat?: string; tiktok?: string; twitter?: string }) => ({
      facebook: socials?.facebook || '',
      instagram: socials?.instagram || '',
      snapchat: socials?.snapchat || '',
      tiktok: socials?.tiktok || '',
      twitter: socials?.twitter || '',
    });
    const menuResponse: GetRestaurantMenuResponse[] = [];
    for (const menu of restaurant.menus) {
      menuResponse.push({
        menuName: menu.name,
        menuID: menu.menu_id,
        isHidden: menu.is_hidden,
        menuSections:
          menu?.sections?.map(section => ({
            name: section.name,
            menuSectionID: section.menu_section_id,
          })) || [],
        isPrixFixe: menu.is_prix_fixe,
      });
    }

    const {
      restaurant_address: restaurantAddress,
      restaurant_menu_layouts: restaurantMenuLayouts,
      images,
      hours,
      restaurant_profile_albums: albums,
      brand,
    } = restaurant;

    const response: GetRestaurantDetailResponse = {
      restaurantUrlID: restaurant.restaurant_url_id,
      restaurantID: restaurant.restaurant_id,
      name: restaurant?.name,

      description: brand?.description || '',

      phone: restaurant?.phone,
      email: restaurant?.email,
      isPublished: restaurant?.is_published,

      website: brand?.website || '',

      address: buildRestaurantAddress(restaurantAddress),

      cuisine: {
        cuisineID: brand?.cuisine?.['cuisine_id'],
        name: brand?.cuisine?.['name'],
      },

      currency: {
        code: restaurantAddress?.country_id?.['currency_code'] || '',
        symbol: (getSymbolFromCurrency(restaurantAddress?.country_id?.['currency_code']) || '') as string,
      },

      pages: this.buildRestaurantDetailsPageResponse(restaurant?.profilePages) || [],

      images: await buildRestaurantMedia(albums, images),

      menus: menuResponse,

      menuLayout: restaurantMenuLayouts?.length ? buildMenuLayout(restaurantMenuLayouts[0]) : { layoutID: 0, name: '' },

      socials: buildSocialLinks(brand?.socials),

      restaurantHours: this.restaurantHoursService.buildCreateRestaurantHoursResponse(hours),

      availabilityNotes: restaurant?.availability_notes || '',

      reservationUrl: obtainUrlHTTPS(brand?.reservationUrl) || '',
      orderingUrl: obtainUrlHTTPS(brand?.orderingUrl) || '',
      primaryTagline: brand?.primaryTagline || '',
      secondaryTagline: brand?.secondaryTagline || '',
    };

    return response;
  };

  buildRestaurantImageUploadResponse = async (
    images: RestaurantImageEntity[],
    albums: RestaurantProfileAlbumsEntity[],
    restaurantImageTypes: RestaurantImageTypeEntity[],
  ): Promise<RestaurantImagesInterface> => {
    const response = {};
    const getImageByType = (
      restaurantImages: RestaurantImageEntity[],
      typeID: number,
      isProfileType = false,
    ): RestaurantImageEntity | RestaurantImageEntity[] => {
      if (isProfileType) {
        // return multiple for profile images
        return restaurantImages?.filter(image => image?.restaurant_image_type_id === typeID);
      }
      // return singular image for other types
      return restaurantImages?.find(image => image?.restaurant_image_type_id === typeID);
    };

    const imageTypes = {
      profile: restaurantImageTypes?.filter(image => image?.type === 'profile')?.[0]?.restaurant_image_type_id,
      logo: restaurantImageTypes?.filter(image => image?.type === 'logo')?.[0]?.restaurant_image_type_id,
      thumbnail: restaurantImageTypes?.filter(image => image?.type === 'thumbnail')?.[0]?.restaurant_image_type_id,
      menuCover: restaurantImageTypes?.filter(image => image?.type === 'cover_photo')?.[0]?.restaurant_image_type_id,
    };

    const profileImages = getImageByType(images, imageTypes.profile, true) as RestaurantImageEntity[];
    if (profileImages?.length) {
      response['profile'] = [];
      for (const image of profileImages) {
        response['profile'].push({
          imageID: image?.restaurant_image_id,
          imageURL: await obtainImageURL({ imageURL: image?.image_url }),
        }) as RestaurantImageResponseInterface;
      }
    }

    const logoImage = getImageByType(images, imageTypes.logo) as RestaurantImageEntity;
    if (logoImage) {
      response['logo'] = {
        imageID: logoImage.restaurant_image_id,
        imageURL: await obtainImageURL({ imageURL: logoImage.image_url }),
      } as RestaurantImageResponseInterface;
    }
    const thumbnailImage = getImageByType(images, imageTypes.thumbnail) as RestaurantImageEntity;
    if (thumbnailImage) {
      response['thumbnail'] = {
        imageID: thumbnailImage.restaurant_image_id,
        imageURL: await obtainImageURL({ imageURL: thumbnailImage.image_url }),
      } as RestaurantImageResponseInterface;
    }
    const menuCoverImage = getImageByType(images, imageTypes.menuCover) as RestaurantImageEntity;
    if (menuCoverImage) {
      response['menuCover'] = {
        imageID: menuCoverImage.restaurant_image_id,
        imageURL: await obtainImageURL({ imageURL: menuCoverImage.image_url }),
      } as RestaurantImageResponseInterface;
    }
    // album only returned if uploaded images in the request, else it does not return any gallery images no new uploads of images occur
    if (albums?.length) {
      response['albums'] = [];
      response['albums'].push(
        ...albums?.map(album => ({
          name: album.name,
          isHidden: album.is_hidden,
          albumID: album.restaurant_profile_album_id,
          media: this.getGalleryAlbumImagesResponse(album.restaurant_profile_album_media),
        })),
      );
    }
    return response as RestaurantImagesInterface;
  };

  /**
   * Creates a bare-bones Restaurant Entity.
   * @param restaurant
   */
  buildRestaurantEntity = (restaurant: CreateRestaurantRequestInterface): RestaurantEntity => ({
    name: restaurant?.name,
    description: restaurant?.description,
    phone: restaurant?.phone,
    email: restaurant?.email,
    cuisine_id: restaurant?.cuisineID,
    website: restaurant?.website,
    availability_notes: restaurant?.availabilityNotes || null,
  });

  buildRestaurantEntityForUpdate = (restaurant: EditRestaurantRequestInterface): RestaurantEntity => {
    const restaurantEntity = new RestaurantEntity();

    if (restaurant?.name) {
      restaurantEntity.name = restaurant.name;
    }

    if (restaurant?.phone) {
      restaurantEntity.phone = restaurant.phone;
    }

    if (restaurant?.email) {
      restaurantEntity.email = restaurant.email;
    }

    if (typeof restaurant?.availabilityNotes === 'string') {
      restaurantEntity.availability_notes = restaurant.availabilityNotes || null;
    }

    return restaurantEntity;
  };

  /**
   * Check if restaurant already exists by name and provided address information.
   * @param name
   * @param address1
   * @param city
   * @param governingDistrict
   * @param countryID
   * @param postalCode
   * @param restaurantID
   * @throws 409 Resource Conflict
   */
  checkRestaurantAlreadyExistsByNameAndAddress = async (
    name: string,
    address1: string,
    city: string,
    governingDistrict: string,
    countryID: number,
    postalCode: string,
    restaurantID?: number,
  ): Promise<void> => {
    try {
      const restaurantEntity = await this.restaurantsModel.getRestaurantByNameAndAddress(
        name,
        address1,
        city || null,
        governingDistrict || null,
        countryID,
        postalCode || null,
      );
      if (restaurantEntity) {
        if (restaurantID && restaurantEntity.restaurant_id === restaurantID) {
          return;
        }
        logger.error(
          `Restaurant already exists by name: ${name} and address info: { address: ${address1}, city: ${city}, governingDistrict: ${governingDistrict}, countryID: ${countryID}, postalCode: ${postalCode} }.`,
        );
        throw new HttpException(
          409,
          getErrorPayload(
            InternalErrorCode.resourceConflict,
            `Restaurant already exists by name: ${name} and address info: { address: ${address1}, city: ${city}, governingDistrict: ${governingDistrict}, countryID: ${countryID}, postalCode: ${postalCode} }.`,
          ),
        );
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while checking restaurant already exists by name ${name} and address info: { address: ${address1}, city: ${city}, goveringDistrict: ${governingDistrict}, countryID: ${countryID}, postalCode: ${postalCode} }.` +
            err,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while checking restaurant already exists by name ${name} and address info: { address: ${address1}, city: ${city}, goveringDistrict: ${governingDistrict}, countryID: ${countryID}, postalCode: ${postalCode} }. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  /**
   * Check if restaurant already exists by name restaurantID. Restaurant ID is used to retrieve existing address information
   * Then the address is used to check the restaurant is not a duplicate
   * @param name
   * @param restaurantID
   * @throws 409 Resource Conflict
   */
  checkRestaurantAlreadyExistsByNameAndRestaurantID = async (name: string, restaurantID: number): Promise<void> => {
    try {
      const address: RestaurantAddressEntity = await this.restaurantAddressService.getRestaurantAddressByRestaurantID(restaurantID);
      const { address1, city, governing_district, country_id, postal_code } = address;
      await this.checkRestaurantAlreadyExistsByNameAndAddress(name, address1, city, governing_district, country_id, postal_code, restaurantID);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while checking restaurant already exists by name ${name} and address tied to restaurant: ${restaurantID}.` + err,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while checking restaurant already exists by name ${name} and address tied to restaurant: ${restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  /**
   * Check if restaurant already exists by provided address information and restaurantID. Restaurant ID is used to retrieve existing restaurant name
   * Then the name is used to check the restaurant is not a duplicate
   * @param address1
   * @param city
   * @param governingDistrict
   * @param countryID
   * @param postalCode
   * @param restaurantID
   * @throws 409 Resource Conflict
   */
  checkRestaurantAlreadyExistsByAddressAndRestaurantID = async (
    address1: string,
    city: string,
    governingDistrict: string,
    countryID: number,
    postalCode: string,
    restaurantID: number,
  ): Promise<void> => {
    try {
      const restaurant: RestaurantEntity = await this.restaurantsModel.getRestaurantEntityByID(restaurantID);
      await this.checkRestaurantAlreadyExistsByNameAndAddress(
        restaurant.name,
        address1,
        city,
        governingDistrict,
        countryID,
        postalCode,
        restaurantID,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(
          `Error occurred while checking restaurant already exists by address info: { address: ${address1}, city: ${city}, governingDistrict: ${governingDistrict}, countryID: ${countryID}, postalCode: ${postalCode} } and address tied to restaurant: ${restaurantID}.` +
            err,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while checking restaurant already exists by address info: { address: ${address1}, city: ${city}, governingDistrict: ${governingDistrict}, countryID: ${countryID}, postalCode: ${postalCode} } and address tied to restaurant: ${restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  findRestaurantEntityByNameAndAddress = async (
    name: string,
    address1: string,
    city: string,
    governingDistrict: string,
    countryName: string,
    postalCode: string,
  ): Promise<RestaurantEntity | null> => {
    try {
      const countryEntity = await this.countryService.checkCountryExistsByName(countryName);
      return await this.restaurantsModel.getRestaurantByNameAndAddress(
        name,
        address1,
        city || null,
        governingDistrict || null,
        countryEntity.country_id,
        postalCode || null,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      logger.error(`Error occurred while finding restaurant by name ${name} and address ${address1} - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.runtimeError,
          `Error occurred while finding restaurant by name ${name} and address ${address1}. Refer to logs for more info.`,
        ),
      );
    }
  };

  buildRestaurantDetailsPageResponse = (profilePages: ProfilePageEntity[]): GetProfilePageResponseInterface[] | null =>
    profilePages
      ?.sort((a, b) => a.listOrder - b.listOrder) // sort on listOrder first
      ?.map(page => ({
        pageID: page.restaurantProfilePageID,
        name: page.name || '',
        isHidden: page.isHidden || false,
      }));
}

export default RestaurantsService;
