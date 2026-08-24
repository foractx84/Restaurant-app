import RestaurantController from '@controllers/restaurant.controller';
import RestaurantsService from '@services/restaurants.service';
import { NextFunction, Request, Response } from 'express-serve-static-core';
import { GetRestaurantDetailResponse, GetRestaurantsResponse, RestaurantsModelInterface } from '@interfaces/restaurants.interface';
import { deleteImageIfExists } from '@utils/imageUtils';
import { CuisinesServiceInterface } from '@/interfaces/cuisines.interface';
import { CountryServiceInterface } from '@/interfaces/country.interface';
import { RestaurantAddressServiceInterface } from '@/interfaces/restaurantAddress.interface';
import { ManagerRestaurantServiceInterface } from '@/interfaces/managerRestaurant.interface';
import { RestaurantImagesInterface, RestaurantImagesServiceInterface } from '@interfaces/restaurantImages.interface';
import { RestaurantSocialsServiceInterface } from '@/interfaces/restaurantSocials.interface';
import { RestaurantHoursServiceInterface } from '@/interfaces/restaurantHours.interface';
import { Day } from '@/enums/day';
import { RestaurantProfileAlbumsServiceInterface } from '@/interfaces/restaurantProfileAlbums.interface';
import { MediaType } from '@/enums/mediaType';
import RestaurantBackupService from '@services/restaurantBackup.service';
import { MenusServiceInterface } from '@interfaces/menus.interface';
import { StripeConnectServiceInterface } from '@/services/stripeConnect.service';
import { RestaurantTypographyServiceInterface } from '@/interfaces/restaurantTypography.interface';

jest.mock('@/utils/imageUtils', () => {
  return { __esModule: true, deleteImageIfExists: jest.fn() };
});
jest.mock('@/services/restaurants.service', () => {
  const mockRestaurantsService = {
    assignPackageToRestaurant: jest.fn(),
    createRestaurant: jest.fn(),
    editRestaurant: jest.fn(),
    findRestaurantsByManagerID: jest.fn(),
    getRestaurantDetails: jest.fn(),
    uploadRestaurantImages: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantsService) };
});

const mockRestaurantsService = new RestaurantsService(
  {} as CountryServiceInterface,
  {} as CuisinesServiceInterface,
  {} as ManagerRestaurantServiceInterface,
  {} as RestaurantAddressServiceInterface,
  {} as RestaurantImagesServiceInterface,
  {} as RestaurantsModelInterface,
  {} as RestaurantSocialsServiceInterface,
  {} as RestaurantHoursServiceInterface,
  {} as RestaurantProfileAlbumsServiceInterface,
  { createConnectedAccountForRestaurant: jest.fn(), linkExistingConnectAccount: jest.fn() } as StripeConnectServiceInterface,
);
const mockRestaurantBackupService = new RestaurantBackupService({} as MenusServiceInterface, {} as RestaurantsModelInterface);
const mockStripeConnectService: StripeConnectServiceInterface = {
  createConnectedAccountForRestaurant: jest.fn(),
  linkExistingConnectAccount: jest.fn(),
};
const mockRestaurantTypographyService: RestaurantTypographyServiceInterface = {
  getFontSettings: jest.fn(),
  saveFontSettings: jest.fn(),
  getColorSettings: jest.fn(),
  saveColorSettings: jest.fn(),
};
const restaurantController = new RestaurantController(
  mockRestaurantsService,
  mockRestaurantBackupService,
  mockStripeConnectService,
  mockRestaurantTypographyService,
);

describe('restaurantController', () => {
  const RESTAURANT_ID = 1;
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('readRestaurants', () => {
    it('should successfully fetch restaurants', async () => {
      const MANAGER_ID = 1;
      const RESTAURANTS: GetRestaurantsResponse = {
        restaurants: [
          {
            restaurantUrlID: '11eb3119',
            restaurantID: 8,
            name: 'SF Rest',
          },
        ],
      };

      (mockRestaurantsService.findRestaurantsByManagerID as jest.MockedFunction<any>).mockResolvedValueOnce(RESTAURANTS);

      // mock a request needed by controller
      const mReq = {
        body: {},
      };

      // mock a response object for controller to return into
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { managerID: MANAGER_ID, isSuper: false },
      };

      // call on controller as the router would
      await restaurantController.readRestaurants(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockRestaurantsService.findRestaurantsByManagerID).toHaveBeenCalledWith(MANAGER_ID, false);
      expect(responseObject).toEqual(RESTAURANTS);
    });
    it('should not retrieve restaurants because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await restaurantController.readRestaurants(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockRestaurantsService.findRestaurantsByManagerID).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('uploadRestaurantImages', () => {
    const PROFILE_IMAGES_NAME = ['df94-34ds-23f3-dfsr.jpeg'];
    const LOGO_IMAGE_NAME = 'df94-34ds-23f3-dfsr2.jpeg';
    const THUMBNAIL_IMAGE_NAME = 'df94-34ds-23f3-dfsr3.jpeg';
    const MENU_COVER_IMAGE_NAME = 'df94-34ds-23f3-dfsr4.jpeg';
    const GALLERY_IMAGES = ['df94-34ds-23f3-dfsr5.jpeg', 'df94-34ds-23f3-dfsr6.jpeg'];
    // mock a request needed by controller
    it('should successfully upload restaurants profile / logo / thumbnail / menuCover / and gallery images', async () => {
      const mReq = {
        body: {
          imagesToDelete: '[]',
          galleryImagesToDelete: '[]',
          galleryOrder: '[]',
        },
        files: {
          profile: [{ filename: PROFILE_IMAGES_NAME[0] }],
          logo: [{ filename: LOGO_IMAGE_NAME }],
          thumbnail: [{ filename: THUMBNAIL_IMAGE_NAME }],
          menuCover: [{ filename: MENU_COVER_IMAGE_NAME }],
          gallery: [{ filename: GALLERY_IMAGES[0] }, { filename: GALLERY_IMAGES[1] }],
        },
      } as unknown;
      const imageUploadResponse = {
        profile: [],
        logo: {},
        thumbnail: {},
        menuCover: {},
        albums: [],
      } as unknown as RestaurantImagesInterface;

      (mockRestaurantsService.uploadRestaurantImages as jest.MockedFunction<any>).mockResolvedValueOnce(imageUploadResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await restaurantController.uploadRestaurantImages(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockRestaurantsService.uploadRestaurantImages).toHaveBeenCalledWith(
        GALLERY_IMAGES,
        [],
        [],
        [],
        LOGO_IMAGE_NAME,
        MENU_COVER_IMAGE_NAME,
        PROFILE_IMAGES_NAME,
        RESTAURANT_ID,
        THUMBNAIL_IMAGE_NAME,
      );
      expect(responseObject).toEqual(imageUploadResponse);
    });
    it('should successfully upload restaurants profile image', async () => {
      const mReq = {
        body: {
          imagesToDelete: '[]',
        },
        files: {
          profile: [{ filename: PROFILE_IMAGES_NAME[0] }],
        },
      } as unknown;
      const imageUploadResponse = {
        profile: {},
      } as RestaurantImagesInterface;

      (mockRestaurantsService.uploadRestaurantImages as jest.MockedFunction<any>).mockResolvedValueOnce(imageUploadResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await restaurantController.uploadRestaurantImages(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockRestaurantsService.uploadRestaurantImages).toHaveBeenCalledWith(
        [],
        [],
        [],
        [],
        undefined,
        undefined,
        PROFILE_IMAGES_NAME,
        RESTAURANT_ID,
        undefined,
      );
      expect(responseObject).toEqual(imageUploadResponse);
    });
    it('should successfully upload restaurants logo image', async () => {
      const mReq = {
        body: {
          imagesToDelete: '[]',
        },
        files: {
          logo: [{ filename: LOGO_IMAGE_NAME }],
        },
      } as unknown;
      const imageUploadResponse = {
        logo: {},
      } as RestaurantImagesInterface;

      (mockRestaurantsService.uploadRestaurantImages as jest.MockedFunction<any>).mockResolvedValueOnce(imageUploadResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await restaurantController.uploadRestaurantImages(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockRestaurantsService.uploadRestaurantImages).toHaveBeenCalledWith(
        [],
        [],
        [],
        [],
        LOGO_IMAGE_NAME,
        undefined,
        [],
        RESTAURANT_ID,
        undefined,
      );
      expect(responseObject).toEqual(imageUploadResponse);
    });
    it('should successfully delete restaurant images when ids are provided in request', async () => {
      const mReq = {
        body: {
          imagesToDelete: '[1,2]',
        },
        files: {},
      } as unknown;

      (mockRestaurantsService.uploadRestaurantImages as jest.MockedFunction<any>).mockResolvedValueOnce({});

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: RESTAURANT_ID },
      };

      await restaurantController.uploadRestaurantImages(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockRestaurantsService.uploadRestaurantImages).toHaveBeenCalledWith(
        [],
        [],
        [],
        [1, 2],
        undefined,
        undefined,
        [],
        RESTAURANT_ID,
        undefined,
      );
      expect(responseObject).toEqual({});
    });
    it('should throw 400 Bad Request if imagesToDelete is not an array of numbers and delete profile and logo images for restaurant', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: RESTAURANT_ID },
      };
      const mNext = jest.fn();
      const mReq = {
        body: {
          imagesToDelete: '["test"]',
        },
        files: {
          profile: [{ filename: PROFILE_IMAGES_NAME }],
          logo: [{ filename: LOGO_IMAGE_NAME }],
        },
      } as unknown;

      await restaurantController.uploadRestaurantImages(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockRestaurantsService.uploadRestaurantImages).not.toHaveBeenCalled();
      expect(deleteImageIfExists).toHaveBeenNthCalledWith(1, PROFILE_IMAGES_NAME);
      expect(deleteImageIfExists).toHaveBeenNthCalledWith(2, LOGO_IMAGE_NAME);
      expect(mNext).toHaveBeenCalled();
    });
    it('should delete profile and logo image for restaurant if an exception occurs when uploading both images', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: RESTAURANT_ID },
      };
      const mNext = jest.fn();
      const mReq = {
        body: {
          imagesToDelete: '[]',
        },
        files: {
          profile: [{ filename: PROFILE_IMAGES_NAME }],
          logo: [{ filename: LOGO_IMAGE_NAME }],
        },
      } as unknown;

      (mockRestaurantsService.uploadRestaurantImages as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      await restaurantController.uploadRestaurantImages(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockRestaurantsService.uploadRestaurantImages).toHaveBeenCalledTimes(1);
      expect(deleteImageIfExists).toHaveBeenNthCalledWith(1, PROFILE_IMAGES_NAME);
      expect(deleteImageIfExists).toHaveBeenNthCalledWith(2, LOGO_IMAGE_NAME);

      expect(mNext).toHaveBeenCalled();
    });
    it('should delete profile / logo / thumbnail / menuCover / and gallery images for restaurant if an exception occurs when any images', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: RESTAURANT_ID },
      };
      const mNext = jest.fn();
      const mReq = {
        body: {
          imagesToDelete: '[]',
        },
        files: {
          profile: [{ filename: PROFILE_IMAGES_NAME[0] }],
          logo: [{ filename: LOGO_IMAGE_NAME }],
          thumbnail: [{ filename: THUMBNAIL_IMAGE_NAME }],
          menuCover: [{ filename: MENU_COVER_IMAGE_NAME }],
          gallery: [{ filename: GALLERY_IMAGES[0] }, { filename: GALLERY_IMAGES[1] }],
        },
      } as unknown;

      (mockRestaurantsService.uploadRestaurantImages as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      await restaurantController.uploadRestaurantImages(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockRestaurantsService.uploadRestaurantImages).toHaveBeenCalledTimes(1);
      expect(deleteImageIfExists).toHaveBeenNthCalledWith(1, PROFILE_IMAGES_NAME[0]);
      expect(deleteImageIfExists).toHaveBeenNthCalledWith(2, LOGO_IMAGE_NAME);
      expect(deleteImageIfExists).toHaveBeenNthCalledWith(3, THUMBNAIL_IMAGE_NAME);
      expect(deleteImageIfExists).toHaveBeenNthCalledWith(4, MENU_COVER_IMAGE_NAME);
      expect(deleteImageIfExists).toHaveBeenNthCalledWith(5, GALLERY_IMAGES[0]);
      expect(deleteImageIfExists).toHaveBeenNthCalledWith(6, GALLERY_IMAGES[1]);

      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('createRestaurant', () => {
    const MANAGER_ID = 1;
    const mockRestaurantResponse = {
      restaurantID: 1000,
      restaurantUrlID: '6e01f118',
      name: 'Test Restaurant',
      description: 'test description',
      phone: '1112223333',
      email: 'test@email.com',
      isPublished: false,
      cuisine: {
        name: 'Asian',
      },
      website: 'test website',
      address: {
        restaurantAddressID: 1,
        address1: '123 fake street',
        address2: '',
        streetNumber: '',
        streetName: '',
        city: 'New York',
        governingDistrict: 'NY',
        country: 'United States',
        postalCode: '12345',
        coordinates: {
          lat: '17.875082',
          long: '-17.489149',
        },
        timezone: 'America/New_York',
      },
      currency: {
        code: 'USD',
        symbol: '$',
      },
      restaurant_hours: [
        {
          day: ['Sunday'],
          start: '21:01',
          end: '21:02',
        },
        {
          day: ['Sunday', 'Tuesday'],
          start: '11:58',
          end: '20:59',
        },
      ],
      availabilityNotes: 'test',
    };
    const mReq = {
      body: {
        name: 'Test Restaurant',
        description: 'test description',
        phone: '1112223333',
        email: 'test@email.com',
        cuisineID: 1,
        website: 'test website',
        address: {
          address1: '123 fake street',
          address2: '',
          streetNumber: '',
          streetName: '',
          city: 'New York',
          governingDistrict: 'NY',
          country: 'United States',
          postalCode: '12345',
          timezone: 'America/New_York',
          coordinates: {
            lat: 17,
            long: 17,
          },
        },
        restaurant_hours: [
          {
            day: ['Sunday'],
            start: '21:01',
            end: '21:02',
          },
          {
            day: ['Sunday', 'Tuesday'],
            start: '11:58',
            end: '20:59',
          },
        ],
        availabilityNotes: 'test',
      },
    };
    it('should successfully create restaurant (non super user)', async () => {
      (mockRestaurantsService.createRestaurant as jest.MockedFunction<any>).mockResolvedValueOnce(mockRestaurantResponse);
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { managerID: MANAGER_ID, isSuper: false },
      };

      await restaurantController.createRestaurant(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockRestaurantsService.createRestaurant).toHaveBeenCalledWith(MANAGER_ID, mReq.body, false);
      expect(responseObject).toEqual(mockRestaurantResponse);
    });
    it('should successfully create restaurant (super user = true)', async () => {
      (mockRestaurantsService.createRestaurant as jest.MockedFunction<any>).mockResolvedValueOnce(mockRestaurantResponse);
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { managerID: MANAGER_ID, isSuper: true },
      };

      await restaurantController.createRestaurant(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockRestaurantsService.createRestaurant).toHaveBeenCalledWith(MANAGER_ID, mReq.body, true);
      expect(responseObject).toEqual(mockRestaurantResponse);
    });
    it('should not create restaurant because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await restaurantController.createRestaurant(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockRestaurantsService.createRestaurant).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('editRestaurant', () => {
    const MANAGER_ID = 1;
    const RESTAURANT_ID = 1;
    const mReq = {
      body: {
        name: 'Test Restaurant',
        description: 'test description',
        phone: '1112223333',
        email: 'test@email.com',
        cuisineID: 1,
        website: 'test website',
        address: {
          restaurantAddressID: 1,
          address1: '123 fake street',
          address2: '',
          streetNumber: '',
          streetName: '',
          city: 'New York',
          governingDistrict: 'NY',
          country: 'United States',
          postalCode: '12345',
          timezone: 'America/New_York',
          coordinates: {
            lat: 17,
            long: 17,
          },
        },
        restaurant_hours: [
          {
            day: ['Sunday'],
            start: '21:01',
            end: '21:02',
          },
          {
            day: ['Sunday', 'Tuesday'],
            start: '11:58',
            end: '20:59',
          },
        ],
        availabilityNotes: 'test',
      },
    };
    it('should successfully update restaurant', async () => {
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { managerID: MANAGER_ID, restaurantID: RESTAURANT_ID },
      };

      await restaurantController.editRestaurant(mReq as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockRestaurantsService.editRestaurant).toHaveBeenCalledWith(mReq.body, RESTAURANT_ID);
    });
    it('should not edit restaurant because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await restaurantController.editRestaurant(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockRestaurantsService.editRestaurant).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });

  describe('getRestaurantDetails', () => {
    it('should successfully get restaurant details', async () => {
      const RESTAURANT_ID = 1;
      const RESTAURANT: GetRestaurantDetailResponse = {
        restaurantUrlID: '11eb3119',
        restaurantID: 8,
        name: 'SF Rest',
        description: '',
        phone: '2138209166',
        email: 'SFRestaurant@sfrestaurant.com',
        isPublished: true,
        website: '',
        address: {
          restaurantAddressID: 1,
          address1: '1035 Aster Avenue',
          address2: '',
          city: 'San Francisco',
          governingDistrict: 'CA',
          country: 'United States',
          postalCode: '94086',
          timezone: 'America/New York',
        },
        cuisine: {
          cuisineID: 1,
          name: 'Asian',
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
          logo: {
            imageID: 1,
            imageURL: '9abb6429-51bb-4876-9a29-8208712c1883.jpeg',
          },
          profile: [
            {
              imageID: 2,
              imageURL: '9abb6429-51bb-4876-9a29-8208712c1883.jpeg',
            },
            {
              imageID: 3,
              imageURL: '9abb6429-51bb-4876-9a29-8208712c1883.jpeg',
            },
          ],
          thumbnail: {
            imageID: 6,
            imageURL: 'https://resources-dev.trytaptab.com/images/f1c5d825-2699-497c-8b8a-3d86e65b596e.jpeg',
          },
          menuCover: {
            imageID: 7,
            imageURL: 'https://resources-dev.trytaptab.com/images/2afe0c79-0f16-4e7d-aa43-996776fccb4c.jpeg',
          },
          albums: [
            {
              isHidden: false,
              albumID: 3,
              name: 'default',
              media: [
                {
                  mediaURL: 'https://resources-dev.trytaptab.com/images/6cb008e2-deae-40b2-a8f9-d0371a103ca3.jpeg',
                  mediaID: 12,
                  type: MediaType.IMAGE,
                  smallMobile: '',
                  largeMobile: '',
                  smallDesktop: '',
                  largeDesktop: '',
                },
                {
                  mediaURL: 'https://resources-dev.trytaptab.com/images/c83df5ab-c6a0-42dd-b233-b73c2c0c13f3.jpeg',
                  mediaID: 13,
                  type: MediaType.IMAGE,
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
            menuName: 'One and Only',
            menuID: 287,
            isHidden: false,
            menuSections: [
              {
                name: 'Pasta',
                menuSectionID: 27,
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
          facebook: '',
          instagram: '',
          snapchat: '',
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

      (mockRestaurantsService.getRestaurantDetails as jest.MockedFunction<any>).mockResolvedValueOnce(RESTAURANT);

      // mock a request needed by controller
      const mReq: Partial<Request> = {};

      // mock a response object for controller to return into
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: 1 },
      };

      // call on controller as the router would
      await restaurantController.getRestaurantDetails(mReq as Request, mRes as Response, jest.fn() as NextFunction);
      // enforce test expectations
      expect(mockRestaurantsService.getRestaurantDetails).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(responseObject).toEqual(RESTAURANT);
    });
    it('should not retrieve restaurant because invalid request', async () => {
      const mReq = undefined;
      const mRes: Partial<Response> = {};
      const mNext = jest.fn();
      await restaurantController.getRestaurantDetails(mReq as Request, mRes as Response, mNext as NextFunction);
      expect(mockRestaurantsService.getRestaurantDetails).not.toHaveBeenCalled();
      expect(mNext).toHaveBeenCalled();
    });
  });
  describe('getRestaurantFontSettings', () => {
    const RESTAURANT_ID = 1;

    it('should return restaurant font settings', async () => {
      const mockResponse = {
        fonts: {
          navigation: { fontFamily: 'Inter', color: '#112233' },
          body: { fontFamily: 'Inter', color: '#111111' },
          pageHeaders: { fontFamily: 'Playfair Display', color: '#111111' },
          subheaders: { fontFamily: 'Playfair Display', color: '#111111' },
          menus: { fontFamily: 'Inter', color: '#111111' },
          menuSections: { fontFamily: 'Inter', color: '#111111' },
          menuItems: { fontFamily: 'Inter', color: '#111111' },
        },
      };

      (mockRestaurantTypographyService.getFontSettings as jest.MockedFunction<any>).mockResolvedValueOnce(mockResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: String(RESTAURANT_ID) },
      };

      await restaurantController.getRestaurantFontSettings({} as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockRestaurantTypographyService.getFontSettings).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(responseObject).toEqual(mockResponse);
    });

    it('should call next when getFontSettings fails', async () => {
      const err = new Error('typography error');
      (mockRestaurantTypographyService.getFontSettings as jest.MockedFunction<any>).mockRejectedValueOnce(err);

      const mNext = jest.fn();
      const mRes: Partial<Response> = { json: jest.fn(), locals: { restaurantID: String(RESTAURANT_ID) } };
      await restaurantController.getRestaurantFontSettings({} as Request, mRes as Response, mNext as NextFunction);

      expect(mNext).toHaveBeenCalledWith(err);
    });
  });

  describe('saveRestaurantFontSettings', () => {
    const RESTAURANT_ID = 1;

    it('should save restaurant font settings from the request body', async () => {
      const body = {
        navigation: { fontFamily: 'Inter', color: '#112233' },
        body: { fontFamily: 'Source Serif 4', color: '#111111' },
        pageHeaders: { fontFamily: 'Playfair Display', color: '#111111' },
        subheaders: { fontFamily: 'Playfair Display', color: '#111111' },
        menus: { fontFamily: 'Inter', color: '#111111' },
        menuSections: { fontFamily: 'Inter', color: '#111111' },
        menuItems: { fontFamily: 'Inter', color: '#111111' },
      };

      (mockRestaurantTypographyService.saveFontSettings as jest.MockedFunction<any>).mockResolvedValueOnce({ fonts: body });

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: String(RESTAURANT_ID) },
      };

      await restaurantController.saveRestaurantFontSettings({ body } as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockRestaurantTypographyService.saveFontSettings).toHaveBeenCalledWith(RESTAURANT_ID, body);
      expect(responseObject).toEqual({ fonts: body });
    });

    it('should call next when saveFontSettings fails', async () => {
      const err = new Error('save failed');
      (mockRestaurantTypographyService.saveFontSettings as jest.MockedFunction<any>).mockRejectedValueOnce(err);

      const mNext = jest.fn();
      const mRes: Partial<Response> = { json: jest.fn(), locals: { restaurantID: String(RESTAURANT_ID) } };
      await restaurantController.saveRestaurantFontSettings({ body: {} } as Request, mRes as Response, mNext as NextFunction);

      expect(mNext).toHaveBeenCalledWith(err);
    });
  });

  describe('getRestaurantColorSettings', () => {
    const RESTAURANT_ID = 1;

    it('should return restaurant color settings', async () => {
      const mockResponse = {
        colors: {
          navigationBackground: { color: '#000000' },
          websiteBackground: { color: '#112233' },
          onlineOrderingBackground: { color: '#445566' },
          onlineOrderingActiveSelections: { color: '#778899' },
        },
      };

      (mockRestaurantTypographyService.getColorSettings as jest.MockedFunction<any>).mockResolvedValueOnce(mockResponse);

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: String(RESTAURANT_ID) },
      };

      await restaurantController.getRestaurantColorSettings({} as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockRestaurantTypographyService.getColorSettings).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(responseObject).toEqual(mockResponse);
    });

    it('should call next when getColorSettings fails', async () => {
      const err = new Error('color settings error');
      (mockRestaurantTypographyService.getColorSettings as jest.MockedFunction<any>).mockRejectedValueOnce(err);

      const mNext = jest.fn();
      const mRes: Partial<Response> = { json: jest.fn(), locals: { restaurantID: String(RESTAURANT_ID) } };
      await restaurantController.getRestaurantColorSettings({} as Request, mRes as Response, mNext as NextFunction);

      expect(mNext).toHaveBeenCalledWith(err);
    });
  });

  describe('saveRestaurantColorSettings', () => {
    const RESTAURANT_ID = 1;

    it('should save restaurant color settings from the request body', async () => {
      const body = {
        navigationBackground: { color: '#000000' },
        websiteBackground: { color: '#112233' },
        onlineOrderingBackground: { color: '#445566' },
        onlineOrderingActiveSelections: { color: '#778899' },
      };

      (mockRestaurantTypographyService.saveColorSettings as jest.MockedFunction<any>).mockResolvedValueOnce({ colors: body });

      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: String(RESTAURANT_ID) },
      };

      await restaurantController.saveRestaurantColorSettings({ body } as Request, mRes as Response, jest.fn() as NextFunction);

      expect(mockRestaurantTypographyService.saveColorSettings).toHaveBeenCalledWith(RESTAURANT_ID, body);
      expect(responseObject).toEqual({ colors: body });
    });

    it('should call next when saveColorSettings fails', async () => {
      const err = new Error('save colors failed');
      (mockRestaurantTypographyService.saveColorSettings as jest.MockedFunction<any>).mockRejectedValueOnce(err);

      const mNext = jest.fn();
      const mRes: Partial<Response> = { json: jest.fn(), locals: { restaurantID: String(RESTAURANT_ID) } };
      await restaurantController.saveRestaurantColorSettings({ body: {} } as Request, mRes as Response, mNext as NextFunction);

      expect(mNext).toHaveBeenCalledWith(err);
    });
  });

  describe('getStripeConnectOnboardingUrl', () => {
    const RESTAURANT_ID = 1;
    it('should call createConnectedAccountForRestaurant and return onboarding_url and account_id', async () => {
      const mockResult = {
        account_id: 'acct_xxx',
        onboarding_url: 'https://connect.stripe.com/setup/test',
      };
      (mockStripeConnectService.createConnectedAccountForRestaurant as jest.MockedFunction<any>).mockResolvedValueOnce(mockResult);

      const mReq: Partial<Request> = {};
      let responseObject = {};
      const mRes: Partial<Response> = {
        json: jest.fn().mockImplementation(result => {
          responseObject = result;
        }),
        locals: { restaurantID: String(RESTAURANT_ID) },
      };
      const mNext = jest.fn();

      await restaurantController.getStripeConnectOnboardingUrl(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockStripeConnectService.createConnectedAccountForRestaurant).toHaveBeenCalledTimes(1);
      expect(mockStripeConnectService.createConnectedAccountForRestaurant).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(responseObject).toEqual({ onboarding_url: mockResult.onboarding_url, account_id: mockResult.account_id });
      expect(mNext).not.toHaveBeenCalled();
    });
    it('should call next with error when createConnectedAccountForRestaurant rejects', async () => {
      const err = new Error('Stripe error');
      (mockStripeConnectService.createConnectedAccountForRestaurant as jest.MockedFunction<any>).mockRejectedValueOnce(err);

      const mReq: Partial<Request> = {};
      const mRes: Partial<Response> = {
        json: jest.fn(),
        locals: { restaurantID: String(RESTAURANT_ID) },
      };
      const mNext = jest.fn();

      await restaurantController.getStripeConnectOnboardingUrl(mReq as Request, mRes as Response, mNext as NextFunction);

      expect(mockStripeConnectService.createConnectedAccountForRestaurant).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(mNext).toHaveBeenCalledWith(err);
    });
  });
});
