import {
  CreateRestaurantRequestInterface,
  EditRestaurantRequestInterface,
  RestaurantReservationOrderingLinksInterface,
  RestaurantsDBInterface,
} from '@/interfaces/restaurants.interface';
import RestaurantsModel from '@/models/restaurants.model';
import RestaurantsService from '@/services/restaurants.service';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import RestaurantImagesService from '@services/restaurantImages.service';
import { RestaurantImagesModelInterface } from '@interfaces/restaurantImages.interface';
import { CuisinesModelInterface } from '@/interfaces/cuisines.interface';
import { CountryModelInterface } from '@/interfaces/country.interface';
import { RestaurantAddressModelInterface } from '@/interfaces/restaurantAddress.interface';
import { ManagerRestaurantServiceInterface } from '@/interfaces/managerRestaurant.interface';
import { CuisineEntity } from '@/entities/cuisine.entity';
import { CountryEntity } from '@/entities/country.entity';
import CuisinesService from '@/services/cuisines.service';
import CountryService from '@/services/country.service';
import { ormConnection } from '@/utils/dbUtils';
import RestaurantAddressService from '@services/restaurantAddress.service';
import RestaurantSocialsService from '@/services/restaurantSocials.service';
import { RestaurantSocialsModelInterface } from '@/interfaces/restaurantSocials.interface';
import { RestaurantHoursModelInterface } from '@/interfaces/restaurantHours.interface';
import RestaurantHoursService from '@/services/restaurantHours.service';
import { Day } from '@/enums/day';
import RestaurantProfileAlbumsService from '@/services/restaurantProfileAlbums.service';
import { RestaurantProfileAlbumsModelInterface } from '@/interfaces/restaurantProfileAlbums.interface';
import { MediaLibraryServiceInterface } from '@/interfaces/mediaLibrary.interface';
import { RestaurantProfileAlbumMediaServiceInterface } from '@/interfaces/restaurantProfileAlbumMedia.interface';
import { RestaurantImageTypesServiceInterface } from '@/interfaces/restaurantImageTypes.interface';
import { StripeConnectServiceInterface } from '@/services/stripeConnect.service';

// mock jwt.verify until a test token is generated
jest.mock('jsonwebtoken', () => {
  const jwt = {
    verify: jest.fn(),
  };
  return { __esModule: true, default: jwt };
});
jest.mock('@/services/cuisines.service', () => {
  const mockCuisineModel = {
    checkIfCuisineExists: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockCuisineModel) };
});
jest.mock('@/services/managerRestaurant.service', () => {
  const mockManagerRestaurantModel = {
    insertManagerRestaurantEntity: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockManagerRestaurantModel) };
});
jest.mock('@/services/country.service', () => {
  const mockCountryModel = {
    checkCountryExistsByName: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockCountryModel) };
});
jest.mock('@/services/restaurantHours.service', () => {
  const mockRestaurantHoursService = {
    buildCreateRestaurantHoursResponse: jest.fn(),
    checkRestaurantHoursOverlappingTimes: jest.fn(),
    createRestaurantHours: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantHoursService) };
});
jest.mock('@/services/restaurantProfileAlbums.service', () => {
  const mockRestaurantProfileAlbumsService = {
    validateGalleryImageUploadAndFetchRestaurantAlbums: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantProfileAlbumsService) };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/configs/config', () => {
  const MOCKED_APP_CONFIG = {
    SERVER: 'localhost',
    IMAGE_BUCKET: 'dummy',
    IMAGE_HOSTING_URL: 'www.test.com/',
  };

  return {
    __esModule: true,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
  };
});
jest.mock('@/services/restaurantAddress.service', () => {
  const mockRestaurantAddressService = {
    getRestaurantAddressByRestaurantID: jest.fn(),
    createRestaurantAddress: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantAddressService) };
});
jest.mock('@/services/restaurantImages.service', () => {
  const mockRestaurantImagesService = {
    getRestaurantImagesByRestaurantID: jest.fn(),
    validateRestaurantImages: jest.fn(),
    validateRestaurantImagesByType: jest.fn(),
    validateImagesToDelete: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantImagesService) };
});
jest.mock('@/services/restaurantSocials.service', () => {
  const mockRestaurantSocialsService = {
    createRestaurantSocials: jest.fn(),
    getRestaurantSocialsByRestaurantID: jest.fn(),
    updateRestaurantSocials: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantSocialsService) };
});
jest.mock('@/models/restaurants.model', () => {
  const mockRestaurantsModel = {
    getRestaurantByID: jest.fn(),
    getRestaurantByNameAndAddress: jest.fn(),
    getRestaurantEntityByID: jest.fn(),
    getRestaurantEntityWithHoursAndAddressByID: jest.fn(),
    getRestaurantEntityWithModifiersByID: jest.fn(),
    getRestaurantsEntityByManagerID: jest.fn(),
    getRestaurantDetailsEntityByRestaurantID: jest.fn(),
    updateRestaurantEntity: jest.fn(),
    insertRestaurantEntity: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantsModel) };
});

const mockRestaurantsModel = new RestaurantsModel();
const mockRestaurantAddressService = new RestaurantAddressService({} as RestaurantAddressModelInterface);
const mockRestaurantImagesService = new RestaurantImagesService(
  {} as RestaurantImagesModelInterface,
  {} as MediaLibraryServiceInterface,
  {} as RestaurantImageTypesServiceInterface,
);
const mockCuisineService = new CuisinesService({} as CuisinesModelInterface);
const mockCountryService = new CountryService({} as CountryModelInterface);
const mockRestaurantSocialsService = new RestaurantSocialsService({} as RestaurantSocialsModelInterface);
const mockRestaurantHoursService = new RestaurantHoursService({} as RestaurantHoursModelInterface);
const mockRestaurantProfileAlbumsService = new RestaurantProfileAlbumsService(
  {} as RestaurantProfileAlbumsModelInterface,
  {} as RestaurantProfileAlbumMediaServiceInterface,
);
const mockManagerRestaurantService: ManagerRestaurantServiceInterface = {
  insertManagerRestaurantEntity: jest.fn(),
};
const mockStripeConnectService: StripeConnectServiceInterface = {
  createConnectedAccountForRestaurant: jest.fn(),
  linkExistingConnectAccount: jest.fn(),
};
const restaurantsService = new RestaurantsService(
  mockCountryService,
  mockCuisineService,
  mockManagerRestaurantService,
  mockRestaurantAddressService,
  mockRestaurantImagesService,
  mockRestaurantsModel,
  mockRestaurantSocialsService,
  mockRestaurantHoursService,
  mockRestaurantProfileAlbumsService,
  mockStripeConnectService,
);

describe('restaurantsService', () => {
  const MOCKED_APP_CONFIG = {
    SERVER: 'localhost',
    IMAGE_BUCKET: 'dummy',
    IMAGE_HOSTING_URL: 'www.test.com/',
  };
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('verifyRestaurants', () => {
    it('should successfully verify all restaurants given', async () => {
      const mockAllGetRestaurantsByID: RestaurantsDBInterface[] = [
        {
          restaurantID: 3,
        },
        {
          restaurantID: 4,
        },
        {
          restaurantID: 5,
        },
      ];
      (mockRestaurantsModel.getRestaurantByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockAllGetRestaurantsByID[0]);
      (mockRestaurantsModel.getRestaurantByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockAllGetRestaurantsByID[1]);
      (mockRestaurantsModel.getRestaurantByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockAllGetRestaurantsByID[2]);
      const mockManagerRestaurantIDs: number[] = [3, 4, 5];

      const result = await restaurantsService.verifyRestaurants(mockManagerRestaurantIDs);
      expect(mockRestaurantsModel.getRestaurantByID).toHaveBeenCalledTimes(3);
      expect(result).toEqual([3, 4, 5]);
    });
    it('should not verify 2 out of 4 restaurants given and throw exception', async () => {
      const mockAllGetRestaurantsByID: RestaurantsDBInterface[] = [
        undefined as RestaurantsDBInterface,
        undefined as RestaurantsDBInterface,
        {
          restaurantID: 3,
        },
        {
          restaurantID: 5,
        },
      ];
      (mockRestaurantsModel.getRestaurantByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockAllGetRestaurantsByID[0]);
      (mockRestaurantsModel.getRestaurantByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockAllGetRestaurantsByID[1]);
      (mockRestaurantsModel.getRestaurantByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockAllGetRestaurantsByID[2]);
      (mockRestaurantsModel.getRestaurantByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockAllGetRestaurantsByID[3]);
      const mockManagerRestaurantIDs: number[] = [1, 2, 3, 5];

      await expect(restaurantsService.verifyRestaurants(mockManagerRestaurantIDs)).rejects.toThrow();
      expect(mockRestaurantsModel.getRestaurantByID).toHaveBeenCalledTimes(4);
    });
    it('should not verify any restaurants given and throw exception', async () => {
      const mockAllGetRestaurantsByID: RestaurantsDBInterface[] = [
        undefined as RestaurantsDBInterface,
        undefined as RestaurantsDBInterface,
        undefined as RestaurantsDBInterface,
        undefined as RestaurantsDBInterface,
      ];
      (mockRestaurantsModel.getRestaurantByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockAllGetRestaurantsByID[0]);
      (mockRestaurantsModel.getRestaurantByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockAllGetRestaurantsByID[1]);
      (mockRestaurantsModel.getRestaurantByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockAllGetRestaurantsByID[2]);
      (mockRestaurantsModel.getRestaurantByID as jest.MockedFunction<any>).mockResolvedValueOnce(mockAllGetRestaurantsByID[3]);
      const mockManagerRestaurantIDs: number[] = [1, 2, 3, 5];

      await expect(restaurantsService.verifyRestaurants(mockManagerRestaurantIDs)).rejects.toThrow();
      expect(mockRestaurantsModel.getRestaurantByID).toHaveBeenCalledTimes(4);
    });
  });
  describe('findRestaurantEntityByID', () => {
    const RESTAURANT_ID = 1;
    it('should successfully get restaurant by id', async () => {
      const restaurantEntity = {
        restaurant_id: RESTAURANT_ID,
        name: 'test menu section',
        description: 'test',
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      };

      (mockRestaurantsModel.getRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(restaurantEntity as RestaurantEntity);

      const result = await restaurantsService.findRestaurantEntityByID(RESTAURANT_ID);
      // enforce test expectations
      expect(mockRestaurantsModel.getRestaurantEntityByID).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(result).toEqual(restaurantEntity);
    });
    it('should throw a HttpException if any error occurs while getting restaurant by id', async () => {
      (mockRestaurantsModel.getRestaurantEntityByID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantsService.findRestaurantEntityByID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantsModel.getRestaurantEntityByID).toHaveBeenCalledTimes(1);
    });
  });
  describe('findRestaurantEntityWithModifiersByID', () => {
    const RESTAURANT_ID = 1;
    it('should successfully get restaurant with modifiers by id', async () => {
      const restaurantEntity = {
        restaurant_id: RESTAURANT_ID,
        name: 'test menu section',
        description: 'test',
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
        modifierGroups: [],
      };

      (mockRestaurantsModel.getRestaurantEntityWithModifiersByID as jest.MockedFunction<any>).mockResolvedValueOnce(
        restaurantEntity as RestaurantEntity,
      );

      const result = await restaurantsService.findRestaurantEntityWithModifiersByID(RESTAURANT_ID);
      // enforce test expectations
      expect(mockRestaurantsModel.getRestaurantEntityWithModifiersByID).toHaveBeenCalledWith(RESTAURANT_ID, undefined);
      expect(result).toEqual(restaurantEntity);
    });
    it('should throw a HttpException if any error occurs while getting restaurant with modifiers by id', async () => {
      (mockRestaurantsModel.getRestaurantEntityWithModifiersByID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantsService.findRestaurantEntityWithModifiersByID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantsModel.getRestaurantEntityWithModifiersByID).toHaveBeenCalledTimes(1);
    });
  });
  describe('findRestaurantEntityWithHoursAndAddressByID', () => {
    const RESTAURANT_ID = 1012;
    it('should successfully get restaurant with hours and address by id', async () => {
      const restaurantEntity = {
        restaurant_id: RESTAURANT_ID,
        name: 'Hours Restaurant',
        hours: [{ day: 'Monday', start: '07:00', end: '17:00' }],
        restaurant_address: { timezone: 'America/New_York' },
      };

      (mockRestaurantsModel.getRestaurantEntityWithHoursAndAddressByID as jest.MockedFunction<any>).mockResolvedValueOnce(
        restaurantEntity as unknown as RestaurantEntity,
      );

      const result = await restaurantsService.findRestaurantEntityWithHoursAndAddressByID(RESTAURANT_ID);
      // enforce test expectations
      expect(mockRestaurantsModel.getRestaurantEntityWithHoursAndAddressByID).toHaveBeenCalledWith(RESTAURANT_ID, undefined);
      expect(result).toEqual(restaurantEntity);
    });
    it('should throw a HttpException if any error occurs while getting restaurant with hours and address by id', async () => {
      (mockRestaurantsModel.getRestaurantEntityWithHoursAndAddressByID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantsService.findRestaurantEntityWithHoursAndAddressByID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantsModel.getRestaurantEntityWithHoursAndAddressByID).toHaveBeenCalledTimes(1);
    });
  });
  describe('findRestaurantsByManagerID', () => {
    const MANAGER_ID = 1000;
    const RESTAURANT = {
      restaurant_url_id: 'test',
      restaurant_id: 1,
      name: 'The Noho Kitchen',
    };
    const EXPECTED = {
      restaurants: [
        {
          restaurantUrlID: 'test',
          restaurantID: 1,
          name: 'The Noho Kitchen',
        },
      ],
    };
    it('should successfully get restaurant entities by manager id', async () => {
      (mockRestaurantsModel.getRestaurantsEntityByManagerID as jest.MockedFunction<any>).mockResolvedValueOnce([
        RESTAURANT,
      ] as unknown as RestaurantEntity[]);

      const result = await restaurantsService.findRestaurantsByManagerID(MANAGER_ID);

      expect(mockRestaurantsModel.getRestaurantsEntityByManagerID).toHaveBeenCalledWith(MANAGER_ID, false);
      expect(result).toEqual(EXPECTED);
    });
    it('should successfully get restaurant entities by manager id and return empty array for menu sections if none exist for menu', async () => {
      const RESTAURANT_NO_SECTIONS = {
        restaurant_url_id: 'test',
        restaurant_id: 1,
        name: 'The Noho Kitchen',
      };
      const EXPECTED_NO_SECTIONS = {
        restaurants: [
          {
            restaurantUrlID: 'test',
            restaurantID: 1,
            name: 'The Noho Kitchen',
          },
        ],
      };
      (mockRestaurantsModel.getRestaurantsEntityByManagerID as jest.MockedFunction<any>).mockResolvedValueOnce([
        RESTAURANT_NO_SECTIONS,
      ] as unknown as RestaurantEntity[]);

      const result = await restaurantsService.findRestaurantsByManagerID(MANAGER_ID);

      expect(mockRestaurantsModel.getRestaurantsEntityByManagerID).toHaveBeenCalledWith(MANAGER_ID, false);
      expect(result).toEqual(EXPECTED_NO_SECTIONS);
    });
    it('should successfully get all restaurant entities for special_users (super user)', async () => {
      (mockRestaurantsModel.getRestaurantsEntityByManagerID as jest.MockedFunction<any>).mockResolvedValueOnce([RESTAURANT]);

      const result = await restaurantsService.findRestaurantsByManagerID(MANAGER_ID, true);

      expect(mockRestaurantsModel.getRestaurantsEntityByManagerID).toHaveBeenCalledTimes(1);
      expect(result).toEqual(EXPECTED);
    });
    it('should throw a HttpException runtime if any error occurs while getting restaurants by manager id', async () => {
      (mockRestaurantsModel.getRestaurantsEntityByManagerID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantsService.findRestaurantsByManagerID(MANAGER_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantsModel.getRestaurantsEntityByManagerID).toHaveBeenCalledTimes(1);
    });
    it('should throw same HttpException if any HttpException occurs while getting restaurants by manager id', async () => {
      (mockRestaurantsModel.getRestaurantsEntityByManagerID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new HttpException(401, getErrorPayload(InternalErrorCode.unauthorizedUser));
      });

      try {
        await restaurantsService.findRestaurantsByManagerID(MANAGER_ID);
      } catch (err) {
        expect(err.status).toEqual(401);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantsModel.getRestaurantsEntityByManagerID).toHaveBeenCalledTimes(1);
    });
  });
  describe('uploadRestaurantImages', () => {
    const PROFILE_IMAGES_NAME = ['df94-34ds-23f3-dfsr.jpeg'];
    const LOGO_IMAGE_NAME = 'df94-34ds-23f3-dfsr2.jpeg';
    const RESTAURANT_ID = 1;
    const IMAGE_ID = 2;
    it('should successfully upload restaurant profile and logo images', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });
      // not able to assert on response since the image values are captured in a transaction
      await restaurantsService.uploadRestaurantImages([], [], [], [], LOGO_IMAGE_NAME, undefined, PROFILE_IMAGES_NAME, RESTAURANT_ID, undefined);

      expect(mockRestaurantImagesService.validateRestaurantImages).toHaveBeenCalledTimes(1);
      expect(mockRestaurantProfileAlbumsService.validateGalleryImageUploadAndFetchRestaurantAlbums).toHaveBeenCalledTimes(1);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should successfully delete image when id is provided', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      // not able to assert on response since the image values are captured in a transaction
      await restaurantsService.uploadRestaurantImages([], [], [], [IMAGE_ID], undefined, undefined, undefined, RESTAURANT_ID, undefined);

      expect(mockRestaurantImagesService.validateRestaurantImages).toHaveBeenCalledTimes(1);
      expect(mockRestaurantProfileAlbumsService.validateGalleryImageUploadAndFetchRestaurantAlbums).toHaveBeenCalledTimes(1);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if gallery images validation fails', async () => {
      (mockRestaurantProfileAlbumsService.validateGalleryImageUploadAndFetchRestaurantAlbums as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });
      const transaction = jest.fn();

      try {
        await restaurantsService.uploadRestaurantImages([], [], [], [], undefined, undefined, undefined, RESTAURANT_ID, undefined);
      } catch (err) {
        // error is thrown since transaction is not being mocked
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantImagesService.validateRestaurantImages).toHaveBeenCalledTimes(1);
      expect(mockRestaurantProfileAlbumsService.validateGalleryImageUploadAndFetchRestaurantAlbums).toHaveBeenCalledTimes(1);
      expect(transaction).not.toHaveBeenCalled();
    });
    it('should throw 500 HttpException if any unhandled errors are thrown', async () => {
      (mockRestaurantImagesService.validateRestaurantImages as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });
      const transaction = jest.fn();

      try {
        await restaurantsService.uploadRestaurantImages([], [], [], [], undefined, undefined, undefined, RESTAURANT_ID, undefined);
      } catch (err) {
        // error is thrown since transaction is not being mocked
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantImagesService.validateRestaurantImages).toHaveBeenCalledTimes(1);
      expect(mockRestaurantProfileAlbumsService.validateGalleryImageUploadAndFetchRestaurantAlbums).not.toHaveBeenCalled();
      expect(transaction).not.toHaveBeenCalled();
    });
  });
  describe('createRestaurant', () => {
    const MANAGER_ID = 1;
    const RESTAURANT_REQUEST: CreateRestaurantRequestInterface = {
      name: 'Test Restaurant',
      description: 'test description',
      phone: '1112223333',
      email: 'test@email.com',
      cuisineID: 1,
      website: 'test website',
      address: {
        address1: '123 fake street',
        address2: '',
        city: 'New York',
        governingDistrict: 'NY',
        country: 'United States',
        postalCode: '12345',
        timezone: 'America/New_York',
        coordinates: {
          lat: 17.875082,
          long: -17.489149,
        },
      },
      socials: {
        facebook: 'https://facebook.com',
        instagram: 'https://facebook.com',
        snapchat: 'https://snapchat.com',
        tiktok: 'https://tiktok.com',
        twitter: 'https://twitter.com',
      },
      restaurantHours: [
        {
          day: [Day.MON, Day.TUE],
          start: '08:00',
          end: '10:00',
        },
        {
          day: [Day.TUE],
          start: '18:00',
          end: '20:00',
        },
      ],
      availabilityNotes: 'test',
    };
    const mockCuisineResponse: CuisineEntity = {
      cuisine_id: 1,
      name: 'Asian',
      date_created: '2022-01-01T00:00:00Z',
    };
    const EXISTING_RESTAURANT = {
      restaurant_id: 1,
      name: 'Test Restaurant',
      address: '123 fake street',
    };
    const mockCountryUnitedStatesResponse: CountryEntity = {
      name: 'United States',
      country_id: 1,
      addresses: [],
      abbreviation: 'US',
      currency_code: 'USD',
    };
    it('should create restaurant successfully for a manager', async () => {
      (mockCuisineService.checkIfCuisineExists as jest.MockedFunction<any>).mockResolvedValueOnce(mockCuisineResponse);
      (mockCountryService.checkCountryExistsByName as jest.MockedFunction<any>).mockResolvedValueOnce(mockCountryUnitedStatesResponse);
      (mockManagerRestaurantService.insertManagerRestaurantEntity as jest.MockedFunction<any>).mockResolvedValueOnce(null);
      (mockRestaurantsModel.insertRestaurantEntity as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: 10,
        restaurant_url_id: 'test-url',
      } as RestaurantEntity);
      (mockRestaurantAddressService.createRestaurantAddress as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_address_id: 20,
      });
      (mockRestaurantHoursService.createRestaurantHours as jest.MockedFunction<any>).mockResolvedValueOnce([]);
      (mockStripeConnectService.createConnectedAccountForRestaurant as jest.MockedFunction<any>).mockResolvedValueOnce({
        account_id: 'acct_test',
        onboarding_url: 'https://connect.stripe.com/setup/test',
      });

      const transaction = jest.fn(async (cb: (conn: any) => Promise<void>) => {
        await cb({});
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
        MANAGER_ID,
      });

      await restaurantsService.createRestaurant(MANAGER_ID, RESTAURANT_REQUEST, false);

      expect(mockRestaurantsModel.getRestaurantByNameAndAddress).toHaveBeenCalledTimes(1);
      expect(mockCuisineService.checkIfCuisineExists).toHaveBeenCalledWith(RESTAURANT_REQUEST.cuisineID);
      expect(mockCountryService.checkCountryExistsByName).toHaveBeenCalledWith(RESTAURANT_REQUEST.address.country);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw a 409 HttpException if restaurant already exists by name and address', async () => {
      (mockCuisineService.checkIfCuisineExists as jest.MockedFunction<any>).mockResolvedValueOnce(mockCuisineResponse);
      (mockCountryService.checkCountryExistsByName as jest.MockedFunction<any>).mockResolvedValueOnce(mockCountryUnitedStatesResponse);
      (mockRestaurantsModel.getRestaurantByNameAndAddress as jest.MockedFunction<any>).mockResolvedValueOnce(EXISTING_RESTAURANT);
      const transaction = jest.fn();

      try {
        await restaurantsService.createRestaurant(MANAGER_ID, RESTAURANT_REQUEST, false);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      expect(mockCuisineService.checkIfCuisineExists).toHaveBeenCalledTimes(1);
      expect(mockCountryService.checkCountryExistsByName).toHaveBeenCalledTimes(1);
      expect(mockRestaurantsModel.getRestaurantByNameAndAddress).toHaveBeenCalledTimes(1);
      expect(transaction).not.toHaveBeenCalled();
    });
    it('should throw some HttpException if HttpException error occurs while creating restaurant', async () => {
      (mockRestaurantsModel.getRestaurantByNameAndAddress as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantsService.createRestaurant(MANAGER_ID, RESTAURANT_REQUEST, false);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should create Stripe Connect account and return onboarding URL on success', async () => {
      (mockCuisineService.checkIfCuisineExists as jest.MockedFunction<any>).mockResolvedValueOnce(mockCuisineResponse);
      (mockCountryService.checkCountryExistsByName as jest.MockedFunction<any>).mockResolvedValueOnce(mockCountryUnitedStatesResponse);
      (mockRestaurantsModel.insertRestaurantEntity as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: 42,
        restaurant_url_id: 'stripe-test-url',
      } as RestaurantEntity);
      (mockRestaurantAddressService.createRestaurantAddress as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_address_id: 21,
      });
      (mockRestaurantHoursService.createRestaurantHours as jest.MockedFunction<any>).mockResolvedValueOnce([]);
      (mockStripeConnectService.createConnectedAccountForRestaurant as jest.MockedFunction<any>).mockResolvedValueOnce({
        account_id: 'acct_123',
        onboarding_url: 'https://connect.stripe.com/setup/abc',
      });

      const transaction = jest.fn(async (cb: (conn: any) => Promise<void>) => {
        await cb({});
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      const result = await restaurantsService.createRestaurant(MANAGER_ID, RESTAURANT_REQUEST, false);

      expect(mockStripeConnectService.createConnectedAccountForRestaurant).toHaveBeenCalledWith(42);
      expect(result.stripeOnboardingUrl).toEqual('https://connect.stripe.com/setup/abc');
      expect(result.stripeAccountId).toEqual('acct_123');
    });
    it('should throw a 500 HttpException with stripeException code if Stripe Connect flow fails', async () => {
      (mockCuisineService.checkIfCuisineExists as jest.MockedFunction<any>).mockResolvedValueOnce(mockCuisineResponse);
      (mockCountryService.checkCountryExistsByName as jest.MockedFunction<any>).mockResolvedValueOnce(mockCountryUnitedStatesResponse);
      (mockRestaurantsModel.insertRestaurantEntity as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: 55,
        restaurant_url_id: 'stripe-error-url',
      } as RestaurantEntity);
      (mockRestaurantAddressService.createRestaurantAddress as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_address_id: 22,
      });
      (mockRestaurantHoursService.createRestaurantHours as jest.MockedFunction<any>).mockResolvedValueOnce([]);
      (mockStripeConnectService.createConnectedAccountForRestaurant as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('stripe down'));

      const transaction = jest.fn(async (cb: (conn: any) => Promise<void>) => {
        await cb({});
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      try {
        await restaurantsService.createRestaurant(MANAGER_ID, RESTAURANT_REQUEST, false);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0].code).toEqual(5000);
      }

      expect(mockStripeConnectService.createConnectedAccountForRestaurant).toHaveBeenCalledTimes(1);
    });
  });
  describe('editRestaurant', () => {
    const RESTAURANT_ID = 1;
    const ADDRESS_ID = 2;
    const RESTAURANT_REQUEST: EditRestaurantRequestInterface = {
      name: 'Test Restaurant',
      description: 'test description',
      phone: '1112223333',
      email: 'test@email.com',
      cuisineID: 1,
      website: 'test website',
      address: {
        restaurantAddressID: ADDRESS_ID,
        address1: '123 fake street',
        address2: '',
        city: 'New York',
        governingDistrict: 'NY',
        country: 'United States',
        postalCode: '12345',
        timezone: 'America/New_York',
        coordinates: {
          lat: 17.875082,
          long: -17.489149,
        },
      },
    };
    const PARTIAL_RESTAURANT_REQUEST: EditRestaurantRequestInterface = {
      description: 'test description',
    };
    const PARTIAL_RESTAURANT_NAME_REQUEST: EditRestaurantRequestInterface = {
      name: 'Test Restaurant',
    };
    const PARTIAL_RESTAURANT_ADDRESS_REQUEST: EditRestaurantRequestInterface = {
      address: {
        restaurantAddressID: ADDRESS_ID,
        address1: '123 fake street',
        address2: '',
        city: 'New York',
        governingDistrict: 'NY',
        country: 'United States',
        postalCode: '12345',
        timezone: 'America/New_York',
        coordinates: {
          lat: 17.875082,
          long: -17.489149,
        },
      },
    };
    const EXISTING_RESTAURANT = {
      restaurant_id: 2,
      name: 'Test Restaurant',
      address: '123 fake street',
    };
    const mockCountryUnitedStatesResponse: CountryEntity = {
      name: 'United States',
      country_id: 1,
      addresses: [],
      abbreviation: 'US',
      currency_code: 'USD',
    };
    it('should edit restaurant successfully with all values provided', async () => {
      (mockCountryService.checkCountryExistsByName as jest.MockedFunction<any>).mockResolvedValueOnce(mockCountryUnitedStatesResponse);
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({
        address1: '123 Test St',
        city: 'Miami',
        governing_district: 'FL',
        country: 'United States',
      });

      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await restaurantsService.editRestaurant(RESTAURANT_REQUEST, RESTAURANT_ID);

      expect(mockRestaurantsModel.getRestaurantByNameAndAddress).toHaveBeenCalledTimes(1);
      expect(mockCuisineService.checkIfCuisineExists).toHaveBeenCalledWith(RESTAURANT_REQUEST.cuisineID);
      expect(mockCountryService.checkCountryExistsByName).toHaveBeenCalledWith(RESTAURANT_REQUEST.address.country);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should edit restaurant successfully with partial values provided', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await restaurantsService.editRestaurant(PARTIAL_RESTAURANT_REQUEST, RESTAURANT_ID);

      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).not.toHaveBeenCalled();
      expect(mockRestaurantsModel.getRestaurantByNameAndAddress).not.toHaveBeenCalled();
      expect(mockCuisineService.checkIfCuisineExists).not.toHaveBeenCalled();
      expect(mockCountryService.checkCountryExistsByName).not.toHaveBeenCalled();
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw a 409 HttpException if restaurant already exists by name and address with only name being provided (determined using restaurant id)', async () => {
      (mockRestaurantAddressService.getRestaurantAddressByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce({
        address1: '123 Test St',
        city: 'Miami',
        governing_district: 'FL',
        country: 'United States',
      });
      (mockRestaurantsModel.getRestaurantByNameAndAddress as jest.MockedFunction<any>).mockResolvedValueOnce(EXISTING_RESTAURANT);
      (mockCountryService.checkCountryExistsByName as jest.MockedFunction<any>).mockResolvedValueOnce(mockCountryUnitedStatesResponse);

      const transaction = jest.fn();

      try {
        await restaurantsService.editRestaurant(PARTIAL_RESTAURANT_NAME_REQUEST, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      expect(mockCuisineService.checkIfCuisineExists).not.toHaveBeenCalled();
      expect(mockCuisineService.checkIfCuisineExists).not.toHaveBeenCalled();
      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).toHaveBeenCalledTimes(1);
      expect(mockRestaurantsModel.getRestaurantByNameAndAddress).toHaveBeenCalledTimes(1);
      expect(transaction).not.toHaveBeenCalled();
    });
    it('should throw a 409 HttpException if restaurant already exists by name and address with name and address being provided', async () => {
      (mockRestaurantsModel.getRestaurantByNameAndAddress as jest.MockedFunction<any>).mockResolvedValueOnce(EXISTING_RESTAURANT);
      (mockCountryService.checkCountryExistsByName as jest.MockedFunction<any>).mockResolvedValueOnce(mockCountryUnitedStatesResponse);

      const transaction = jest.fn();

      try {
        await restaurantsService.editRestaurant(RESTAURANT_REQUEST, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      expect(mockCuisineService.checkIfCuisineExists).toHaveBeenCalledTimes(1);
      expect(mockCountryService.checkCountryExistsByName).toHaveBeenCalledTimes(1);
      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).not.toHaveBeenCalled();
      expect(mockRestaurantsModel.getRestaurantByNameAndAddress).toHaveBeenCalledTimes(1);
      expect(transaction).not.toHaveBeenCalled();
    });
    it('should throw a 409 HttpException if restaurant already exists by name and address with only address provided (determined using restaurant id)', async () => {
      (mockRestaurantsModel.getRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(EXISTING_RESTAURANT);
      (mockRestaurantsModel.getRestaurantByNameAndAddress as jest.MockedFunction<any>).mockResolvedValueOnce(EXISTING_RESTAURANT);
      (mockCountryService.checkCountryExistsByName as jest.MockedFunction<any>).mockResolvedValueOnce(mockCountryUnitedStatesResponse);

      const transaction = jest.fn();

      try {
        await restaurantsService.editRestaurant(PARTIAL_RESTAURANT_ADDRESS_REQUEST, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }

      expect(mockCuisineService.checkIfCuisineExists).not.toHaveBeenCalled();
      expect(mockCountryService.checkCountryExistsByName).toHaveBeenCalledTimes(1);
      expect(mockRestaurantAddressService.getRestaurantAddressByRestaurantID).not.toHaveBeenCalled();
      expect(mockRestaurantsModel.getRestaurantEntityByID).toHaveBeenCalledTimes(1);
      expect(mockRestaurantsModel.getRestaurantByNameAndAddress).toHaveBeenCalledTimes(1);
      expect(transaction).not.toHaveBeenCalled();
    });
    it('should throw some HttpException if HttpException error occurs while editing restaurant', async () => {
      (mockRestaurantsModel.getRestaurantByNameAndAddress as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantsService.editRestaurant(RESTAURANT_REQUEST, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('updateRestaurantReservationOrderingLinks', () => {
    const RESTAURANT_ID = 1;
    const RESTAURANT_LINKS_REQUEST: RestaurantReservationOrderingLinksInterface = {
      orderingUrl: 'https://testOrderingUrl.com',
      reservationUrl: 'https://testReservationUrl.com',
    };
    const RESTAURANT_LINKS_REQUEST_EMPTY: RestaurantReservationOrderingLinksInterface = {
      orderingUrl: '',
      reservationUrl: '',
    };
    const RESTAURANT_LINKS_DB_REQUEST: RestaurantEntity = {
      ordering_url: 'https://testOrderingUrl.com',
      reservation_url: 'https://testReservationUrl.com',
    };
    const RESTAURANT_LINKS_DB_REQUEST_EMPTY: RestaurantEntity = {
      ordering_url: null,
      reservation_url: null,
    };
    it('should update restaurant reservation and ordering links for restaurant', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({});

      await restaurantsService.updateRestaurantReservationOrderingLinks(RESTAURANT_LINKS_REQUEST, RESTAURANT_ID);
      expect(mockRestaurantsModel.updateRestaurantEntity).toHaveBeenCalledWith(RESTAURANT_LINKS_DB_REQUEST, RESTAURANT_ID);
    });
    it('should update restaurant reservation and ordering links for restaurant with empty strings', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({});

      await restaurantsService.updateRestaurantReservationOrderingLinks(RESTAURANT_LINKS_REQUEST_EMPTY, RESTAURANT_ID);

      expect(mockRestaurantsModel.updateRestaurantEntity).toHaveBeenCalledWith(RESTAURANT_LINKS_DB_REQUEST_EMPTY, RESTAURANT_ID);
    });
    it('should not update restaurant reservation and ordering links for restaurant if no urls provided in request', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({});
      await restaurantsService.updateRestaurantReservationOrderingLinks({}, RESTAURANT_ID);

      expect(mockRestaurantsModel.updateRestaurantEntity).not.toHaveBeenCalled();
    });
    it('should only update restaurant reservation link (even if empty string) for restaurant if ordering link not provided in request', async () => {
      const RESERVATION_LINK_REQUEST: RestaurantReservationOrderingLinksInterface = {
        reservationUrl: '',
      };
      const RESERVATION_LINK_DB_REQUEST: RestaurantEntity = {
        reservation_url: null,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({});
      await restaurantsService.updateRestaurantReservationOrderingLinks(RESERVATION_LINK_REQUEST, RESTAURANT_ID);

      expect(mockRestaurantsModel.updateRestaurantEntity).toHaveBeenCalledWith(RESERVATION_LINK_DB_REQUEST, RESTAURANT_ID);
    });
    it('should only update restaurant ordering link (even if empty string) for restaurant if reservation link not provided in request', async () => {
      const ORDERING_LINK_REQUEST: RestaurantReservationOrderingLinksInterface = {
        reservationUrl: '',
      };
      const ORDERING_LINK_DB_REQUEST: RestaurantEntity = {
        reservation_url: null,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({});
      await restaurantsService.updateRestaurantReservationOrderingLinks(ORDERING_LINK_REQUEST, RESTAURANT_ID);

      expect(mockRestaurantsModel.updateRestaurantEntity).toHaveBeenCalledWith(ORDERING_LINK_DB_REQUEST, RESTAURANT_ID);
    });
    it('should throw some HttpException if HttpException error occurs while updating restaurant ordering and reservation links', async () => {
      (mockRestaurantsModel.updateRestaurantEntity as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantsService.updateRestaurantReservationOrderingLinks(RESTAURANT_LINKS_REQUEST, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getRestaurantDetails', () => {
    const IMAGE_NAME = 'df94-34ds-23f3-dfsr.jpeg';
    const RESTAURANT_ID = 1;
    const RESTAURANT = {
      restaurant_url_id: 'test',
      restaurant_id: 1,
      name: 'The Noho Kitchen',
      description: 'Traditional steakhouse fare is served in an ornate setting with a separate piano room & wine cellar.',
      email: 'NohoKitchen@nohokitchen.com',
      phone: '5555555555',
      website: 'test.com',
      is_published: true,
      cuisine_id: {
        cuisine_id: 2,
        name: 'Spanish',
      },
      restaurant_address: {
        restaurant_address_id: 3,
        address1: '555 S Brannon St',
        address2: null,
        city: 'New York',
        governing_district: 'NY',
        country_id: {
          country_id: 1,
          name: 'United States',
          abbreviation: 'US',
          currency_code: 'USD',
        },
        postal_code: '10923',
        timezone: 'America/New York',
      },
      images: [
        {
          restaurant_image_id: 3,
          image_url: `${IMAGE_NAME}`,
          restaurant_image_type_id: {
            restaurant_image_type_id: 1,
            type: 'profile',
          },
        },
        {
          restaurant_image_id: 4,
          image_url: `${IMAGE_NAME}`,
          restaurant_image_type_id: {
            restaurant_image_type_id: 2,
            type: 'logo',
          },
        },
        {
          restaurant_image_id: 5,
          image_url: `${IMAGE_NAME}`,
          restaurant_image_type_id: {
            restaurant_image_type_id: 4,
            type: 'thumbnail',
          },
        },
        {
          restaurant_image_id: 6,
          image_url: `${IMAGE_NAME}`,
          restaurant_image_type_id: {
            restaurant_image_type_id: 5,
            type: 'cover_photo',
          },
        },
      ],
      restaurant_menu_layouts: [
        {
          menu_layout_id: {
            menu_layout_id: 2,
            layout: 'grid no text',
          },
        },
      ],
      menus: [
        {
          name: 'Lunch',
          menu_id: 276,
          is_hidden: false,
          sections: [
            {
              menu_section_id: 1001,
              name: 'menu section 1',
              menu_id: 276,
              list_order: 0,
              deleted: false,
            },
          ],
          is_prix_fixe: false,
        },
      ],
      socials: {
        restaurant_socials_id: 1,
        facebook: 'https://test.com',
        instagram: null,
        tiktok: null,
        snapchat: 'https://test2.com',
        twitter: null,
        restaurant_id: 1,
      },
      hours: [
        {
          restaurant_hours_id: 171,
          restaurant_id: 1039,
          day: Day.MON,
          start: '08:00',
          end: '10:00',
        },
        {
          restaurant_hours_id: 172,
          restaurant_id: 1039,
          day: Day.TUE,
          start: '08:00',
          end: '10:00',
        },
        {
          restaurant_hours_id: 173,
          restaurant_id: 1039,
          day: Day.TUE,
          start: '19:00',
          end: '20:00',
        },
      ],
      restaurant_profile_albums: [
        {
          restaurant_profile_album_id: 3,
          restaurant_id: 1,
          name: 'default',
          description: 'default gallery album used to display a single album in restaurant profile',
          list_order: 0,
          deleted_at: null,
          is_hidden: false,
          restaurant_profile_album_media: [
            {
              restaurant_profile_album_media_id: 12,
              restaurant_profile_album_id: 3,
              media_id: 18,
              list_order: 0,
              deleted_at: null,
              description: 'default gallery album used to display a single album in restaurant profile',
              media: {
                media_type_id: 1,
                media_url: `${IMAGE_NAME}`,
                restaurant_id: 1,
                name: `${IMAGE_NAME}`,
                media_id: 18,
                description: null,
                deleted_at: null,
              },
            },
          ],
        },
      ],
      profilePages: [
        {
          name: 'Noho_About_Page',
          isHidden: false,
          restaurantProfilePageID: 1,
        },
      ],
      availability_notes: 'Test',
      ordering_url: 'https://ordering.com',
      reservation_url: 'https://reservation.com',
      primary_tagline: 'Fresh ingredients, bold flavors',
      secondary_tagline: 'Open since 1987',
    };
    const EXPECTED = {
      restaurantUrlID: 'test',
      restaurantID: 1,
      name: 'The Noho Kitchen',
      description: 'Traditional steakhouse fare is served in an ornate setting with a separate piano room & wine cellar.',
      isPublished: true,
      email: 'NohoKitchen@nohokitchen.com',
      website: 'test.com',
      phone: '5555555555',
      address: {
        restaurantAddressID: 3,
        address1: '555 S Brannon St',
        address2: '',
        city: 'New York',
        country: 'United States',
        governingDistrict: 'NY',
        postalCode: '10923',
        timezone: 'America/New York',
      },
      cuisine: {
        cuisineID: 2,
        name: 'Spanish',
      },
      currency: {
        code: 'USD',
        symbol: '$',
      },
      pages: [
        {
          pageID: 1,
          name: 'Noho_About_Page',
          isHidden: false,
        },
      ],
      images: {
        profile: [
          {
            imageID: 3,
            imageURL: `${MOCKED_APP_CONFIG.IMAGE_HOSTING_URL}${IMAGE_NAME}`,
          },
        ],
        logo: {
          imageID: 4,
          imageURL: `${MOCKED_APP_CONFIG.IMAGE_HOSTING_URL}${IMAGE_NAME}`,
        },
        thumbnail: {
          imageID: 5,
          imageURL: `${MOCKED_APP_CONFIG.IMAGE_HOSTING_URL}${IMAGE_NAME}`,
        },
        menuCover: {
          imageID: 6,
          imageURL: `${MOCKED_APP_CONFIG.IMAGE_HOSTING_URL}${IMAGE_NAME}`,
        },
        albums: [
          {
            isHidden: false,
            albumID: 3,
            name: 'default',
            description: 'default gallery album used to display a single album in restaurant profile',
            media: [
              {
                mediaURL: `${MOCKED_APP_CONFIG.IMAGE_HOSTING_URL}${IMAGE_NAME}`,
                mediaID: 12,
                type: 'image',
                smallMobile: '',
                largeMobile: '',
                smallDesktop: '',
                largeDesktop: '',
              },
            ],
          },
        ],
      },
      menus: [
        {
          menuName: 'Lunch',
          menuID: 276,
          isHidden: false,
          menuSections: [
            {
              menuSectionID: 1001,
              name: 'menu section 1',
            },
          ],
          isPrixFixe: false,
        },
      ],
      menuLayout: {
        layoutID: 2,
        name: 'grid no text',
      },
      socials: {
        facebook: 'https://test.com',
        instagram: '',
        snapchat: 'https://test2.com',
        tiktok: '',
        twitter: '',
      },
      restaurantHours: [
        {
          day: [Day.TUE],
          start: '19:00',
          end: '20:00',
        },
        {
          day: [Day.MON, Day.TUE],
          start: '08:00',
          end: '10:00',
        },
      ],
      availabilityNotes: 'Test',
      orderingUrl: 'https://ordering.com',
      reservationUrl: 'https://reservation.com',
      primaryTagline: 'Fresh ingredients, bold flavors',
      secondaryTagline: 'Open since 1987',
    };
    it('should successfully get restaurant entity by restaurantID', async () => {
      (mockRestaurantsModel.getRestaurantDetailsEntityByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(
        RESTAURANT as unknown as RestaurantEntity,
      );
      (mockRestaurantHoursService.buildCreateRestaurantHoursResponse as jest.MockedFunction<any>).mockReturnValue([
        {
          day: [Day.TUE],
          start: '19:00',
          end: '20:00',
        },
        {
          day: [Day.MON, Day.TUE],
          start: '08:00',
          end: '10:00',
        },
      ]);

      const result = await restaurantsService.getRestaurantDetails(RESTAURANT_ID);

      expect(mockRestaurantsModel.getRestaurantDetailsEntityByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(result).toEqual(EXPECTED);
    });
    it('should successfully get restaurant entity by restaurantID and return empty array for menu sections if none exist for menu', async () => {
      const storeOriginalMenus = RESTAURANT.menus;
      RESTAURANT.menus = [
        {
          name: 'Lunch',
          menu_id: 276,
          is_prix_fixe: false,
          is_hidden: false,
          sections: [],
        },
      ];

      const storeExpectedMenus = EXPECTED.menus;
      (EXPECTED.menus = [
        {
          menuName: 'Lunch',
          menuID: 276,
          isHidden: false,
          menuSections: [],
          isPrixFixe: false,
        },
      ]),
        (mockRestaurantsModel.getRestaurantDetailsEntityByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(
          RESTAURANT as unknown as RestaurantEntity,
        );

      (mockRestaurantHoursService.buildCreateRestaurantHoursResponse as jest.MockedFunction<any>).mockReturnValue([
        {
          day: [Day.TUE],
          start: '19:00',
          end: '20:00',
        },
        {
          day: [Day.MON, Day.TUE],
          start: '08:00',
          end: '10:00',
        },
      ]);

      const result = await restaurantsService.getRestaurantDetails(RESTAURANT_ID);

      expect(mockRestaurantsModel.getRestaurantDetailsEntityByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(result).toEqual(EXPECTED);

      RESTAURANT.menus = storeOriginalMenus;
      EXPECTED.menus = storeExpectedMenus;
    });
    it('should throw a HttpException runtime if any error occurs while getting restaurant by restaurantID', async () => {
      (mockRestaurantsModel.getRestaurantDetailsEntityByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantsService.getRestaurantDetails(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockRestaurantsModel.getRestaurantDetailsEntityByRestaurantID).toHaveBeenCalledTimes(1);
    });
  });
});
