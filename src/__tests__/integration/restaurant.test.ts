import { app } from '@/server';
import request from 'supertest';
import { EntityManager, getConnection } from 'typeorm';
import AuthService from '@/services/auth.service';
import UsersModel from '@/models/users.model';
import jwt from 'jsonwebtoken';
import { ormConnection } from '@/utils/dbUtils';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { RestaurantAddressEntity } from '@/entities/restaurantAddress.entity';
import { getLatLongGeocoderFromAddress } from '@/utils/geocoder';
import { ManagerRestaurantsEntity } from '@/entities/managerRestaurants.entity';
import { RestaurantMenuLayoutEntity } from '@/entities/restaurantMenuLayout.entity';
import {
  CreateRestaurantRequestInterface,
  CreateRestaurantResponseInterface,
  EditRestaurantRequestInterface,
  GetRestaurantDetailResponse,
  GetRestaurantResponse,
  RestaurantCurrencyInterface,
  RestaurantReservationOrderingLinksInterface,
} from '@interfaces/restaurants.interface';
import { ManagerPackageEntity } from '@/entities/managerPackage.entity';
import { PackageEntity } from '@/entities/packageEntity.entity';
import { generatePermissionsToken } from '@/utils/generateToken';
import { SubscriptionEntity } from '@/entities/subscription.entity';
import { getCurrentDate } from '@utils/timeUtils';
import { ManagerEntity } from '@/entities/manager.entity';
import { SubscriptionItemEntity } from '@/entities/subscriptionItem.entity';
import { SubscriptionStatus } from '@/enums/subscriptionStatus';
import { StripeCustomerEntity } from '@/entities/stripeCustomer.entity';
import { v4 as uuidv4 } from 'uuid';
import { RestaurantSocialsRequestInterface } from '@/interfaces/restaurantSocials.interface';
import { RestaurantSocialsEntity } from '@/entities/restaurantSocials.entity';
import { Day } from '@/enums/day';
import { RestaurantHoursEntity } from '@/entities/restaurantHours.entity';
import { RestaurantUserEmailEntity } from '@/entities/restaurantUserEmail.entity';
import { RestaurantUserEmailsResponseInterface } from '@interfaces/restaurantUserEmails.interface';
import { StripeConnectAccountEntity } from '@/entities/stripeConnectAccount.entity';

jest.mock('@/utils/GCP_bucket', () => require('../../../__mocks__/GCP_bucket'));

jest.mock('stripe', () => {
  let createCallCount = 0;
  const stripeMock = {
    accounts: {
      create: jest.fn().mockImplementation(() =>
        Promise.resolve({
          id: `acct_test_${Date.now()}_${++createCallCount}`,
          charges_enabled: false,
          details_submitted: false,
          capabilities: { card_payments: { status: 'pending' }, transfers: { status: 'pending' } },
        }),
      ),
      retrieve: jest.fn().mockImplementation((accountId: string) =>
        Promise.resolve({
          id: accountId,
          charges_enabled: true,
          details_submitted: true,
          capabilities: { card_payments: { status: 'active' }, transfers: { status: 'active' } },
        }),
      ),
    },
    accountLinks: {
      create: jest.fn().mockResolvedValue({ url: 'https://connect.stripe.com/setup/test' }),
    },
  };
  return { __esModule: true, default: jest.fn(() => stripeMock) };
});

jest.mock('@/utils/logger', () => {
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return { __esModule: true, logger: logger, initializeLogger: jest.fn() };
});
// mock jwt.verify until a test token is generated
jest.mock('jsonwebtoken', () => {
  const jwt = {
    verify: jest.fn(),
  };
  return { __esModule: true, default: jwt };
});
jest.mock('@/utils/geocoder', () => {
  return { __esModule: true, getLatLongGeocoderFromAddress: jest.fn() };
});
// mock authService response until Test DB creates proper tables for queries
jest.mock('@/services/auth.service', () => {
  const mockAuthService = {
    validateManager: jest.fn().mockResolvedValue(() => true),
    validateSuperUser: jest.fn().mockResolvedValue(() => true),
  };
  return { __esModule: true, default: jest.fn(() => mockAuthService) };
});
jest.mock('@/utils/generateToken', () => {
  return { __esModule: true, generatePermissionsToken: jest.fn() };
});
const MOCK_TOKEN = {
  permissionToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtYW5hZ2VySUQiOjEwMDAsImlhdCI6MTY1MTQzNDYyMSwiZXhwIjoxODMxNDM0NjIxfQ.g_57QOVmJBTt3ouXpoP9HdlV_jYp761_fbabOvqVjXM999888777666555444333222111',
};
jest.mock('@/configs/config', () => {
  const MOCKED_APP_CONFIG = {
    SERVER: 'localhost',
    IMAGE_BUCKET: 'dummy',
    IMAGE_HOSTING_URL: 'https://dummy_image.jpeg',
    MAX_MULTER_FILE_SIZE_LIMIT: 75000000,
  };

  const originalModule = jest.requireActual('@/configs/config');

  return {
    __esModule: true,
    ...originalModule,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
  };
});
jest.mock('@/utils/imageUtils', () => {
  const originalModule = jest.requireActual('@/utils/imageUtils');
  return {
    __esModule: true,
    ...originalModule,
    default: jest.fn(),
    imageUpload: { fields: jest.fn() },
  };
});

const mockAuthService = new AuthService(new UsersModel());

describe('restaurant API', () => {
  // ensure api is connected to database before starting
  beforeAll(async () => await setUp());
  // clean up database and anything else done by tests
  afterAll(async () => await cleanUp());
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    (mockAuthService.validateSuperUser as jest.MockedFunction<any>).mockResolvedValue(true);
    (mockAuthService.validateManager as jest.MockedFunction<any>).mockResolvedValue(true);
  });
  const buildCreateRestaurantRequest = ({ hasLatAndLong = false, country = 'United States', cuisineID = 1 }): CreateRestaurantRequestInterface => {
    const req: CreateRestaurantRequestInterface = {
      name: `${Date.now()}-Test Restaurant`,
      description: 'test description',
      phone: '1112223333',
      email: `test@email-${Date.now()}.com`,
      cuisineID,
      website: 'test website',
      address: {
        address1: '123 fake street',
        city: 'New York City',
        governingDistrict: 'NY',
        country,
        postalCode: '12345',
        timezone: 'America/New_York',
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
      availabilityNotes: 'TESTING... notes',
    };

    if (hasLatAndLong) {
      req.address.coordinates = {};
      req.address.coordinates.lat = 17.123453;
      req.address.coordinates.long = 17.123412;
    }

    return req;
  };
  const buildEditRestaurantRequest = (restaurant: CreateRestaurantRequestInterface, restaurantAddressID: number): EditRestaurantRequestInterface => {
    const { address } = restaurant;
    return {
      name: restaurant.name,
      description: restaurant.description,
      phone: restaurant.phone,
      email: restaurant.email,
      cuisineID: restaurant.cuisineID,
      website: restaurant.website,
      address: {
        restaurantAddressID,
        address1: address.address1,
        city: address.city,
        governingDistrict: address.governingDistrict,
        country: address.country,
        postalCode: address.postalCode,
        timezone: address.timezone,
        coordinates: {
          lat: address?.coordinates?.lat,
          long: address?.coordinates?.long,
        },
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
      availabilityNotes: 'TESTING... notes',
    };
  };
  describe('GET /restaurants', () => {
    const assertGetRestaurantsResponse = (restaurants: GetRestaurantResponse[]) => {
      restaurants.forEach(restaurant => {
        expect(typeof restaurant.restaurantID).toBe('number');
        expect(typeof restaurant.restaurantUrlID).toBe('string');
        expect(typeof restaurant.name).toBe('string');
      });
    };
    it('should return all restaurants for special_users (super user)', async () => {
      mockVerifySuper();

      const res = await request(app.getServer()).get('/restaurants').set('Authorization', 'token').expect(200);
      assertGetRestaurantsResponse(res.body.restaurants);
    }, 10000);
    it('should return restaurants for manager', async () => {
      mockVerify();
      const res = await request(app.getServer()).get('/restaurants').set('Authorization', 'token').set('restaurantID', '1').expect(200);
      assertGetRestaurantsResponse(res.body.restaurants);
    }, 10000);
  });
  describe('POST /restaurant', () => {
    const US_CURRENCY: RestaurantCurrencyInterface = {
      code: 'USD',
      symbol: '$',
    };
    const FR_CURRENCY: RestaurantCurrencyInterface = {
      code: 'EUR',
      symbol: '€',
    };
    const SOCIALS: RestaurantSocialsRequestInterface = {
      facebook: '',
      instagram: '',
      snapchat: '',
      tiktok: '',
      twitter: '',
    };
    const validateCreateRestaurantResponse = (
      response: CreateRestaurantResponseInterface,
      country: string,
      currency: RestaurantCurrencyInterface,
    ) => {
      expect(response).toMatchObject({
        restaurantID: expect.any(Number),
        restaurantUrlID: expect.any(String),
        name: response.name,
        description: 'test description',
        phone: '1112223333',
        email: response.email,
        isPublished: false,
        cuisine: {
          cuisineID: 1,
          name: expect.any(String),
        },
        website: 'test website',
        address: {
          restaurantAddressID: expect.any(Number),
          address1: '123 fake street',
          address2: '',
          streetNumber: '',
          streetName: '',
          city: 'New York City',
          governingDistrict: 'NY',
          country: country,
          postalCode: '12345',
          timezone: 'America/New_York',
        },
        currency,
        socials: {
          facebook: expect.any(String),
          instagram: expect.any(String),
          snapchat: expect.any(String),
          tiktok: expect.any(String),
          twitter: expect.any(String),
        },
      });
    };
    it('should create restaurant for manager where lat and long provided and country is United States (non super user)', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      validateCreateRestaurantResponse(res.body, 'United States', US_CURRENCY);
      expect(getLatLongGeocoderFromAddress).not.toHaveBeenCalled();

      await removeCreatedRestaurant(res.body.restaurantID, false);
    }, 10000);
    it('should create restaurant for restaurant where availabilityNotes are not provided', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      delete createRestaurantReq.availabilityNotes;
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      validateCreateRestaurantResponse(res.body, 'United States', US_CURRENCY);
      expect(getLatLongGeocoderFromAddress).not.toHaveBeenCalled();

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should create restaurant for restaurant where availabilityNotes are empty string', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.availabilityNotes = '';
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      validateCreateRestaurantResponse(res.body, 'United States', US_CURRENCY);
      expect(getLatLongGeocoderFromAddress).not.toHaveBeenCalled();

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should create restaurant for manager where lat and long are NOT provided, geocoder successfully finds lat and long values, and country is United States (non super user)', async () => {
      mockVerify();
      const LAT = 17.875082;
      const LONG = -17.489149;
      (getLatLongGeocoderFromAddress as jest.MockedFunction<any>).mockResolvedValueOnce([LAT, LONG]);

      const createRestaurantReq = buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'United States', cuisineID: 1 });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      validateCreateRestaurantResponse(res.body, 'United States', US_CURRENCY);
      const { address1, city, governingDistrict, postalCode } = createRestaurantReq.address;
      const geocoderAddress = `${address1}, ${city}, ${governingDistrict}, ${postalCode}`;
      expect(getLatLongGeocoderFromAddress).toHaveBeenCalledWith(geocoderAddress, res.body.restaurantID);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should NOT create restaurant for manager where lat and long are NOT provided, geocoder does NOT find lat and long values, and country is United States (non super user)', async () => {
      mockVerify();
      (getLatLongGeocoderFromAddress as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      const createRestaurantReq = buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'United States', cuisineID: 1 });
      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(422);

      const { address1, city, governingDistrict, postalCode } = createRestaurantReq.address;
      const geocoderAddress = `${address1}, ${city}, ${governingDistrict}, ${postalCode}`;
      expect(getLatLongGeocoderFromAddress).toHaveBeenCalledWith(geocoderAddress, expect.any(Number));
    });
    it('should create restaurant for manager where lat and long provided and country is NOT United States (non super user)', async () => {
      mockVerify();

      const createRestaurantReq = buildCreateRestaurantRequest({ hasLatAndLong: true, country: 'France', cuisineID: 1 });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      validateCreateRestaurantResponse(res.body, 'France', FR_CURRENCY);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should create restaurant for manager where lat and long are NOT provided and country is NOT United States (non super user)', async () => {
      mockVerify();

      const res = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 }))
        .expect(200);

      validateCreateRestaurantResponse(res.body, 'France', FR_CURRENCY);
      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should create restaurant for super user', async () => {
      mockVerifySuper();

      const res = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 }))
        .expect(200);

      validateCreateRestaurantResponse(res.body, 'France', FR_CURRENCY);

      await removeCreatedRestaurant(res.body.restaurantID, true);
    });
    it('should create restaurant for manager with socials empty object provided (socials = {})', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.socials = {} as RestaurantSocialsRequestInterface;
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      validateCreateRestaurantResponse(res.body, 'United States', US_CURRENCY);
      expect(getLatLongGeocoderFromAddress).not.toHaveBeenCalled();

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should create restaurant for manager with socials empty string urls provided (socials = { facebook: "" })', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.socials = SOCIALS as RestaurantSocialsRequestInterface;
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      validateCreateRestaurantResponse(res.body, 'United States', US_CURRENCY);
      expect(getLatLongGeocoderFromAddress).not.toHaveBeenCalled();

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should create restaurant for manager with inserting socials urls provided (socials = { facebook: "", instagram: "some_url" })', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.socials = SOCIALS as RestaurantSocialsRequestInterface;
      createRestaurantReq.socials.instagram = 'www.test.com';

      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      validateCreateRestaurantResponse(res.body, 'United States', US_CURRENCY);
      expect(getLatLongGeocoderFromAddress).not.toHaveBeenCalled();

      await removeCreatedRestaurantSocials(res.body.restaurantID);
      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should throw 409 HttpException due to restaurant already created (via name and address)', async () => {
      mockVerify();

      const createReq = buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createReq).expect(200);
      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createReq).expect(409);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    }, 10000);
    it('should throw 400 HttpException due to restaurant having overlapping restaurantHours within same day without carry over to next day', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.restaurantHours = [
        {
          day: [Day.MON, Day.TUE],
          start: '08:00',
          end: '10:00',
        },
        {
          day: [Day.TUE],
          start: '09:00',
          end: '10:00',
        },
      ];

      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(400);
    });
    it('should throw 400 HttpException due to restaurant having overlapping restaurantHours within same day without carry over to next day with one block inside the other block', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.restaurantHours = [
        {
          day: [Day.MON, Day.TUE],
          start: '08:00',
          end: '11:00',
        },
        {
          day: [Day.TUE],
          start: '09:00',
          end: '10:00',
        },
      ];

      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(400);
    });
    it('should throw 400 HttpException due to restaurant having overlapping restaurantHours within same day with carry over to next day', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.restaurantHours = [
        {
          day: [Day.MON, Day.TUE],
          start: '08:00',
          end: '07:00',
        },
        {
          day: [Day.TUE],
          start: '08:00',
          end: '07:00',
        },
      ];

      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(400);
    });
    it('should throw 400 HttpException due to restaurant having overlapping restaurantHours within same day with carry over for one time block which overlaps with another time block', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.restaurantHours = [
        {
          day: [Day.MON, Day.TUE],
          start: '08:00',
          end: '07:00',
        },
        {
          day: [Day.TUE],
          start: '18:00',
          end: '20:00',
        },
      ];

      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(400);
    });
    it('should throw 400 HttpException due to restaurant having overlapping restaurantHours within same day with carry over for one time block which overlaps with another time block', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.restaurantHours = [
        {
          day: [Day.MON, Day.TUE],
          start: '18:00',
          end: '20:00',
        },
        {
          day: [Day.TUE],
          start: '07:00',
          end: '06:00',
        },
      ];

      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(400);
    });
    it('should throw 400 HttpException due to restaurant having overlapping restaurantHours from yesterday (Saturday) carrying over to today (Sunday)', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.restaurantHours = [
        {
          day: [Day.SUN, Day.TUE],
          start: '05:00',
          end: '20:00',
        },
        {
          day: [Day.SAT],
          start: '07:00',
          end: '06:00',
        },
      ];

      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(400);
    });
    it('should throw 400 HttpException due to restaurant having overlapping restaurantHours from yesterday (Sunday) carrying over to today (Monday)', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.restaurantHours = [
        {
          day: [Day.MON, Day.TUE],
          start: '05:00',
          end: '20:00',
        },
        {
          day: [Day.SUN],
          start: '07:00',
          end: '06:00',
        },
      ];

      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(400);
    });
    it('should throw 400 HttpException due to restaurant not having retaurantHours', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      delete createRestaurantReq.restaurantHours;

      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(400);
    });
    it('should throw 400 HttpException due to restaurant having retaurantHours be empty array', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.restaurantHours = [];

      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(400);
    });
    it('should throw 400 HttpException due to restaurant having retaurantHours having duplicate days for same time slot element', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.restaurantHours[0].day.push(Day.MON);

      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(400);
    });
    it('should throw 400 HttpException due to restaurant having retaurantHours having no days in array', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.restaurantHours[0].day = [];

      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(400);
    });
    it('should throw 400 HttpException due to restaurant having retaurantHours having incorrect string for day type in array', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.restaurantHours[0].day = ['Not a valid day' as Day];

      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(400);
    });
    it('should throw 400 HttpException due to restaurant having retaurantHours having non military string for start and end', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.restaurantHours[0].start = 'not military time';
      createRestaurantReq.restaurantHours[0].end = 'not military time';

      await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(400);
    });
    it('should throw 404 HttpException due to cuisine not existing by cuisineID', async () => {
      mockVerify();

      await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 999 }))
        .expect(404);
    });
    it('should throw 400 HttpException due to country not existing by country name', async () => {
      mockVerify();

      await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'Fake Country', cuisineID: 1 }))
        .expect(400);
    });
  });
  describe('PUT /restaurant', () => {
    it('should edit restaurant for manager with all values and where lat and long provided and country is United States', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      const clonedReq = { ...createRestaurantReq };
      clonedReq.name = 'Edited Restaurant';
      const editRestaurantReq: EditRestaurantRequestInterface = buildEditRestaurantRequest(clonedReq, res.body?.address?.restaurantAddressID);

      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(200);

      expect(getLatLongGeocoderFromAddress).not.toHaveBeenCalled();

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should edit restaurant for manager with all values as previous test but availabilityNotes and restaurantHours are not provided', async () => {
      mockVerify();

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      const clonedReq = { ...createRestaurantReq };
      clonedReq.name = 'Edited Restaurant';
      const editRestaurantReq: EditRestaurantRequestInterface = buildEditRestaurantRequest(clonedReq, res.body?.address?.restaurantAddressID);
      delete editRestaurantReq.availabilityNotes;
      delete editRestaurantReq.restaurantHours;
      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(200);

      expect(getLatLongGeocoderFromAddress).not.toHaveBeenCalled();

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should edit restaurant for manager with all values and where lat and long are NOT provided, geocoder successfully finds lat and long values, and country is United States', async () => {
      mockVerify();
      const LAT = 17.875082;
      const LONG = -17.489149;
      (getLatLongGeocoderFromAddress as jest.MockedFunction<any>).mockResolvedValue([LAT, LONG]);

      const createRestaurantReq = buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'United States', cuisineID: 1 });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      const clonedReq = { ...createRestaurantReq };
      clonedReq.name = 'Edited Restaurant';
      const editRestaurantReq: EditRestaurantRequestInterface = buildEditRestaurantRequest(clonedReq, res.body?.address?.restaurantAddressID);

      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(200);

      const { address1, city, governingDistrict, postalCode } = createRestaurantReq.address;
      const geocoderAddress = `${address1}, ${city}, ${governingDistrict}, ${postalCode}`;
      expect(getLatLongGeocoderFromAddress).toHaveBeenCalledWith(geocoderAddress, res.body.restaurantID);
      expect(getLatLongGeocoderFromAddress).toHaveBeenCalledTimes(2);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should NOT edit restaurant for manager with all values and where lat and long are NOT provided, geocoder does NOT find lat and long values, and country is United States', async () => {
      mockVerify();
      const LAT = 17.875082;
      const LONG = -17.489149;
      (getLatLongGeocoderFromAddress as jest.MockedFunction<any>).mockResolvedValueOnce([LAT, LONG]).mockResolvedValueOnce([undefined, undefined]);

      const createRestaurantReq = buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'United States', cuisineID: 1 });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      const clonedReq = { ...createRestaurantReq };
      clonedReq.name = 'Edited Restaurant';
      const editRestaurantReq: EditRestaurantRequestInterface = buildEditRestaurantRequest(clonedReq, res.body?.address?.restaurantAddressID);

      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(422);

      const { address1, city, governingDistrict, postalCode } = createRestaurantReq.address;
      const geocoderAddress = `${address1}, ${city}, ${governingDistrict}, ${postalCode}`;
      expect(getLatLongGeocoderFromAddress).toHaveBeenCalledWith(geocoderAddress, res.body.restaurantID);
      expect(getLatLongGeocoderFromAddress).toHaveBeenCalledTimes(2);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should edit restaurant for manager with all values and where lat and long provided and country is NOT United States.', async () => {
      mockVerify();

      const createRestaurantReq = buildCreateRestaurantRequest({ hasLatAndLong: true, country: 'France', cuisineID: 1 });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      const clonedReq = { ...createRestaurantReq };
      clonedReq.name = 'Edited Restaurant';
      const editRestaurantReq: EditRestaurantRequestInterface = buildEditRestaurantRequest(clonedReq, res.body?.address?.restaurantAddressID);

      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(200);

      expect(getLatLongGeocoderFromAddress).not.toHaveBeenCalled();

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should edit restaurant for manager with all values and where lat and long are NOT provided and country is NOT United States', async () => {
      mockVerify();

      const createRestaurantReq = buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      const clonedReq = { ...createRestaurantReq };
      clonedReq.name = 'Edited Restaurant';
      const editRestaurantReq: EditRestaurantRequestInterface = buildEditRestaurantRequest(clonedReq, res.body?.address?.restaurantAddressID);

      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(200);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should edit restaurant for manager with partial values', async () => {
      mockVerify();

      const res = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 }))
        .expect(200);

      const editRestaurantReq: EditRestaurantRequestInterface = {
        name: 'Edited Restaurant',
        description: 'Test Description',
        phone: '4121112222',
      };
      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(200);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should edit restaurant for manager with availabilityNotes updated', async () => {
      mockVerify();

      const res = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 }))
        .expect(200);

      const editRestaurantReq: EditRestaurantRequestInterface = {
        availabilityNotes: 'UPDATED',
      };
      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(200);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should edit restaurant for manager with deleted availabilityNotes', async () => {
      mockVerify();

      const res = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 }))
        .expect(200);

      const editRestaurantReq: EditRestaurantRequestInterface = {
        availabilityNotes: '',
      };
      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(200);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should edit restaurant for manager with updated restaurantHours', async () => {
      mockVerify();

      const res = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 }))
        .expect(200);

      const editRestaurantReq: EditRestaurantRequestInterface = {
        restaurantHours: [
          {
            day: [Day.WED, Day.THU],
            start: '08:00',
            end: '10:00',
          },
          {
            day: [Day.TUE],
            start: '18:00',
            end: '20:00',
          },
        ],
      };
      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(200);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should edit restaurant with socials being empty object and created restaurant has no socials', async () => {
      mockVerify();
      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      const clonedReq = { ...createRestaurantReq };
      clonedReq.name = 'Edited Restaurant';
      const editRestaurantReq: EditRestaurantRequestInterface = buildEditRestaurantRequest(clonedReq, res.body?.address?.restaurantAddressID);
      editRestaurantReq.socials = {};

      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(200);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should edit restaurant with socials containting empty strings and created restaurant has no socials', async () => {
      mockVerify();
      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      const clonedReq = { ...createRestaurantReq };
      clonedReq.name = 'Edited Restaurant';
      const editRestaurantReq: EditRestaurantRequestInterface = buildEditRestaurantRequest(clonedReq, res.body?.address?.restaurantAddressID);
      editRestaurantReq.socials = {
        facebook: '',
      };

      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(200);

      await removeCreatedRestaurantSocials(res.body.restaurantID);
      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should edit restaurant with socials containing valid string urls and created restaurant has no socials', async () => {
      mockVerify();
      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      const clonedReq = { ...createRestaurantReq };
      clonedReq.name = 'Edited Restaurant';
      const editRestaurantReq: EditRestaurantRequestInterface = buildEditRestaurantRequest(clonedReq, res.body?.address?.restaurantAddressID);
      editRestaurantReq.socials = {
        facebook: 'https://www.test.com',
        instagram: '',
      };

      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(200);

      await removeCreatedRestaurantSocials(res.body.restaurantID);
      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should update socials of restaurant via edit', async () => {
      mockVerify();
      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.socials = {
        facebook: 'https://test.com',
        instagram: '',
      };
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      const clonedReq = { ...createRestaurantReq };
      clonedReq.name = 'Edited Restaurant';
      const editRestaurantReq: EditRestaurantRequestInterface = buildEditRestaurantRequest(clonedReq, res.body?.address?.restaurantAddressID);
      editRestaurantReq.socials = {
        facebook: 'https://www.test2.com',
        tiktok: '',
      };

      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(200);

      await removeCreatedRestaurantSocials(res.body.restaurantID);
      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should remove socials of restaurant via edit', async () => {
      mockVerify();
      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      createRestaurantReq.socials = {
        facebook: 'https://test.com',
        instagram: '',
      };
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      const clonedReq = { ...createRestaurantReq };
      clonedReq.name = 'Edited Restaurant';
      const editRestaurantReq: EditRestaurantRequestInterface = buildEditRestaurantRequest(clonedReq, res.body?.address?.restaurantAddressID);
      editRestaurantReq.socials = {
        facebook: '',
        tiktok: 'https://test_tiktok.com',
        twitter: '',
      };

      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(200);

      await removeCreatedRestaurantSocials(res.body.restaurantID);
      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should throw 409 HttpException while renaming restaurant due to restaurant name already existing with only name provided (via name and address)', async () => {
      mockVerify();

      const res1 = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 }))
        .expect(200);
      // Set res1's name to 'Test Restaurant' so that renaming res2 to the same name at same address triggers 409
      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res1.body.restaurantID)
        .send({ name: 'Test Restaurant' })
        .expect(200);

      const createReq = buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 });
      const res2 = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createReq).expect(200);

      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res2.body.restaurantID)
        .send({ name: 'Test Restaurant' })
        .expect(409);

      await removeCreatedRestaurant(res1.body.restaurantID, false);
      await removeCreatedRestaurant(res2.body.restaurantID, false);
    }, 10000);
    it('should throw 409 HttpException while renaming restaurant due to restaurant name already existing with only address provided (via name and address)', async () => {
      mockVerify();

      const createReq = buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 });
      const res1 = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createReq).expect(200);

      // Create res2 with the same name as res1 to test duplicate detection
      const createReq2 = buildCreateRestaurantRequest({ hasLatAndLong: true, country: 'United States', cuisineID: 1 });
      createReq2.name = createReq.name; // Use same name as res1
      const res2 = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createReq2).expect(200);

      // Update res2's address to match res1's address - should fail because name+address already exists
      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res2.body.restaurantID)
        .send({
          address: {
            restaurantAddressID: res2.body?.address?.restaurantAddressID,
            ...createReq.address,
          },
        })
        .expect(409);

      await removeCreatedRestaurant(res1.body.restaurantID, false);
      await removeCreatedRestaurant(res2.body.restaurantID, false);
    }, 10000);
    it('should throw 409 HttpException while renaming restaurant due to restaurant name already existing with name and address provided', async () => {
      mockVerify();

      const createReq = buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 });
      const res1 = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createReq).expect(200);
      const res2 = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: true, country: 'United States', cuisineID: 1 }))
        .expect(200);

      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res2.body.restaurantID)
        .send({
          name: createReq.name,
          address: {
            restaurantAddressID: res2.body?.address?.restaurantAddressID,
            ...createReq.address,
          },
        })
        .expect(409);

      await removeCreatedRestaurant(res1.body.restaurantID, false);
      await removeCreatedRestaurant(res2.body.restaurantID, false);
    }, 10000);
    it('should throw 404 HttpException due to cuisine not existing by cuisineID', async () => {
      mockVerify();

      await request(app.getServer()).put('/restaurant').set('Authorization', 'token').set('restaurantID', '1').send({ cuisineID: 999 }).expect(404);
    });
    it('should throw 400 HttpException due to restaurantHours having duplicate days in same time block', async () => {
      mockVerify();

      const res = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 }))
        .expect(200);

      const editRestaurantReq: EditRestaurantRequestInterface = {
        restaurantHours: [
          {
            day: [Day.WED, Day.WED],
            start: '08:00',
            end: '10:00',
          },
          {
            day: [Day.TUE],
            start: '18:00',
            end: '20:00',
          },
        ],
      };
      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(400);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should throw 400 HttpException due to restaurantHours having overlapping time spans days in same day', async () => {
      mockVerify();

      const res = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 }))
        .expect(200);

      const editRestaurantReq: EditRestaurantRequestInterface = {
        restaurantHours: [
          {
            day: [Day.WED, Day.THU],
            start: '08:00',
            end: '10:00',
          },
          {
            day: [Day.WED],
            start: '07:00',
            end: '20:00',
          },
        ],
      };
      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(editRestaurantReq)
        .expect(400);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should throw 400 HttpException due to country not existing by country name', async () => {
      mockVerify();

      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', '1')
        .send({ address: { country: 'Fake Country' } })
        .expect(400);
    });
    it('should throw 401 HttpException if provided restaurantAddressID does not exist for restaurant being edited', async () => {
      mockVerify();

      const createReq = buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createReq).expect(200);

      await request(app.getServer())
        .put('/restaurant')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send({
          address: {
            restaurantAddressID: res.body?.address?.restaurantAddressID + 1,
            ...createReq.address,
          },
        })
        .expect(401);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
  });
  describe('PUT /restaurant/stripe-connect', () => {
    it('should link existing Stripe Connect account to restaurant and return 200', async () => {
      mockVerify();

      const createRestaurantReq = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      const repository = await ormConnection();
      await repository.getRepository(StripeConnectAccountEntity).delete({ restaurant_id: res.body.restaurantID });
      await repository.update(RestaurantEntity, { restaurant_id: res.body.restaurantID }, { stripe_account_id: null });

      const stripeAccountId = 'acct_test_link_123';
      await request(app.getServer())
        .put('/restaurant/stripe-connect')
        .set('Authorization', 'token')
        .set('restaurantID', String(res.body.restaurantID))
        .send({ stripeAccountId })
        .expect(200);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
  });
  describe('POST /restaurant/stripe-connect/onboarding-link', () => {
    it('should return onboarding URL and account_id when restaurant exists', async () => {
      mockVerify();

      const createRestaurantReq = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);

      const onboardingRes = await request(app.getServer())
        .post('/restaurant/stripe-connect/onboarding-link')
        .set('Authorization', 'token')
        .set('restaurantID', String(res.body.restaurantID))
        .expect(200);

      expect(onboardingRes.body).toHaveProperty('onboarding_url');
      expect(onboardingRes.body).toHaveProperty('account_id');
      expect(typeof onboardingRes.body.onboarding_url).toBe('string');
      expect(typeof onboardingRes.body.account_id).toBe('string');
      expect(onboardingRes.body.onboarding_url).toMatch(/^https:\/\//);
      expect(onboardingRes.body.account_id).toMatch(/^acct_/);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should return 401 when Authorization header is missing', async () => {
      await request(app.getServer()).post('/restaurant/stripe-connect/onboarding-link').set('restaurantID', '1').expect(401);
    });
  });
  describe('POST /restaurant/package', () => {
    it('should successfully assign/create package for restaurant', async () => {
      mockVerify();
      const { manager_package_id: MANAGER_PACKAGE_ID, package_id } = await createManagerPackageEntityByManagerID(999);
      await createSubscriptionAndItem(package_id);

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });

      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);
      const restaurantID = res.body.restaurantID.toString();

      const assignPackageToRestaurantReq = {
        managerPackageID: MANAGER_PACKAGE_ID,
      };

      (generatePermissionsToken as jest.MockedFunction<any>).mockImplementation(() => MOCK_TOKEN.permissionToken);

      const resRestaurantPackage = await request(app.getServer())
        .post('/restaurant/package')
        .set('Authorization', 'token')
        .set('restaurantID', restaurantID)
        .send(assignPackageToRestaurantReq)
        .expect(200);

      expect(resRestaurantPackage.body).toEqual(MOCK_TOKEN);

      await removeCreatedSubscriptionItems();
      await removeCreatedRestaurant(parseInt(restaurantID), false);

      await removeCreatedManagerPackage(MANAGER_PACKAGE_ID);
    });
    it('should throw 404 if manager does not have an available package to assign to a restaurant', async () => {
      const MANAGER_PACKAGE_ID = 999999;

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });
      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);
      const restaurantID = res.body.restaurantID.toString();

      const assignPackageToRestaurantReq = {
        managerPackageID: MANAGER_PACKAGE_ID,
      };

      await request(app.getServer())
        .post('/restaurant/package')
        .set('Authorization', 'token')
        .set('restaurantID', restaurantID)
        .send(assignPackageToRestaurantReq)
        .expect(404);

      await removeCreatedRestaurant(parseInt(restaurantID), false);
    });
    it('should throw 409 if restaurant already has this package assigned to it', async () => {
      mockVerify();
      const { manager_package_id: MANAGER_PACKAGE_ID, package_id } = await createManagerPackageEntityByManagerID(999);
      await createSubscriptionAndItem(package_id);

      const createRestaurantReq: CreateRestaurantRequestInterface = buildCreateRestaurantRequest({
        hasLatAndLong: true,
        country: 'United States',
        cuisineID: 1,
      });

      const res = await request(app.getServer()).post('/restaurant').set('Authorization', 'token').send(createRestaurantReq).expect(200);
      const restaurantID = res.body.restaurantID.toString();

      const assignPackageToRestaurantReq = {
        managerPackageID: MANAGER_PACKAGE_ID,
      };

      await request(app.getServer())
        .post('/restaurant/package')
        .set('Authorization', 'token')
        .set('restaurantID', restaurantID)
        .send(assignPackageToRestaurantReq)
        .expect(200);

      const { manager_package_id: NEXT_MANAGER_PACKAGE_ID } = await createManagerPackageEntityByManagerID(999);
      await createSubscriptionAndItem(package_id);

      const newAssignPackageToRestaurantReq = {
        managerPackageID: NEXT_MANAGER_PACKAGE_ID,
      };

      await request(app.getServer())
        .post('/restaurant/package')
        .set('Authorization', 'token')
        .set('restaurantID', restaurantID)
        .send(newAssignPackageToRestaurantReq)
        .expect(409);

      await removeCreatedSubscriptionItems();
      await removeCreatedRestaurant(restaurantID, false);

      await removeCreatedManagerPackage(MANAGER_PACKAGE_ID);
      await removeCreatedManagerPackage(NEXT_MANAGER_PACKAGE_ID);
    });
  });
  describe('PUT /restaurant/urls', () => {
    const restaurantOrderingAndReservationLinks: RestaurantReservationOrderingLinksInterface = {
      orderingUrl: 'https://ordering.com',
      reservationUrl: 'https://ordering.com',
    };
    const restaurantOrderingAndReservationLinksEmpty: RestaurantReservationOrderingLinksInterface = {
      orderingUrl: '',
      reservationUrl: '',
    };
    it('should successfully update ordering and reservation urls for restaurant', async () => {
      mockVerify();

      const res = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 }))
        .expect(200);

      await request(app.getServer())
        .put('/restaurant/urls')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(restaurantOrderingAndReservationLinks)
        .expect(200);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should successfully update ordering and reservation urls for restaurant if restaurant links are empty strings', async () => {
      mockVerify();

      const res = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 }))
        .expect(200);

      await request(app.getServer())
        .put('/restaurant/urls')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(restaurantOrderingAndReservationLinksEmpty)
        .expect(200);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should successfully update ordering url for restaurant', async () => {
      mockVerify();

      const res = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 }))
        .expect(200);

      const restaurantOrderingLink = {
        orderingUrl: 'https://ordering.com',
      };

      await request(app.getServer())
        .put('/restaurant/urls')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(restaurantOrderingLink)
        .expect(200);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should successfully update reservation url for restaurant', async () => {
      mockVerify();

      const res = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 }))
        .expect(200);

      const restaurantReservationLink = {
        reservationUrl: 'https://reservation.com',
      };

      await request(app.getServer())
        .put('/restaurant/urls')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(restaurantReservationLink)
        .expect(200);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
    it('should throw 400 if restaurant ordering and reservation urls are not strings', async () => {
      mockVerify();

      const res = await request(app.getServer())
        .post('/restaurant')
        .set('Authorization', 'token')
        .send(buildCreateRestaurantRequest({ hasLatAndLong: false, country: 'France', cuisineID: 1 }))
        .expect(200);

      const badRequest = {
        reservationUrl: 1,
        orderingUrl: 2,
      };

      await request(app.getServer())
        .put('/restaurant/urls')
        .set('Authorization', 'token')
        .set('restaurantID', res.body.restaurantID)
        .send(badRequest)
        .expect(400);

      await removeCreatedRestaurant(res.body.restaurantID, false);
    });
  });
  describe('GET /restaurants/:restaurantUrlID', () => {
    const assertGetRestaurantDetailsResponse = (restaurants: GetRestaurantDetailResponse[]) => {
      restaurants.forEach(restaurant => {
        expect(typeof restaurant.restaurantID).toBe('number');
        expect(typeof restaurant.restaurantUrlID).toBe('string');
        expect(typeof restaurant.name).toBe('string');
        expect(typeof restaurant.description).toBe('string');
        expect(typeof restaurant.phone).toBe('string');
        expect(typeof restaurant.email).toBe('string');
        expect(typeof restaurant.isPublished).toBe('boolean');
        expect(typeof restaurant.website).toBe('string');
        expect(restaurant.address).toMatchObject({
          restaurantAddressID: expect.any(Number),
          address1: expect.any(String),
          address2: expect.any(String),
          city: expect.any(String),
          governingDistrict: expect.any(String),
          country: expect.any(String),
          postalCode: expect.any(String),
          timezone: expect.any(String),
        });
        expect(restaurant.socials).toMatchObject({
          facebook: expect.any(String),
          instagram: expect.any(String),
          snapchat: expect.any(String),
          tiktok: expect.any(String),
          twitter: expect.any(String),
        });
        expect(restaurant.cuisine).toMatchObject({
          cuisineID: expect.any(Number),
          name: expect.any(String),
        });
        expect(restaurant.currency).toMatchObject({
          code: expect.any(String),
          symbol: expect.any(String),
        });
        restaurant.pages?.forEach(profilePage => {
          expect(typeof profilePage.pageID).toBe('number');
          expect(typeof profilePage.name).toBe('string');
          expect(typeof profilePage.isHidden).toBe('boolean');
        });
        restaurant.menus?.forEach(menu => {
          expect(typeof menu.menuID).toBe('number');
          expect(typeof menu.menuName).toBe('string');
          expect(typeof menu.isPrixFixe).toBe('boolean');
          expect(typeof menu.isHidden).toBe('boolean');
          menu?.menuSections.forEach(menuSection => {
            expect(typeof menuSection.menuSectionID).toBe('number');
            expect(typeof menuSection.name).toBe('string');
          });
        });
        restaurant.restaurantHours?.forEach(hours => {
          expect(typeof hours?.start).toBe('string');
          expect(typeof hours?.end).toBe('string');
          expect(
            hours?.day.forEach(dayOfWeek => {
              expect(typeof dayOfWeek).toBe('string');
            }),
          );
        });
        expect(restaurant?.images).toMatchObject({
          profile: restaurant?.images?.profile?.map(() => ({
            imageID: expect.any(Number),
            imageURL: expect.any(String),
          })),
          logo: restaurant?.images?.logo
            ? {
                imageID: expect.any(Number),
                imageURL: expect.any(String),
              }
            : null,
          thumbnail: restaurant?.images?.thumbnail
            ? {
                imageID: expect.any(Number),
                imageURL: expect.any(String),
              }
            : null,
          menuCover: restaurant?.images?.logo
            ? {
                imageID: expect.any(Number),
                imageURL: expect.any(String),
              }
            : null,
          albums: restaurant?.images?.albums?.map(album => ({
            isHidden: expect.any(Boolean),
            name: expect.any(String),
            albumID: expect.any(Number),
            media: album?.media?.map(() => ({
              mediaURL: expect.any(String),
              mediaID: expect.any(Number),
              type: expect.any(String),
              smallMobile: expect.any(String),
              largeMobile: expect.any(String),
              smallDesktop: expect.any(String),
              largeDesktop: expect.any(String),
            })),
          })),
        });
        expect(typeof restaurant.orderingUrl).toBe('string');
        expect(typeof restaurant.reservationUrl).toBe('string');
        expect(typeof restaurant.availabilityNotes).toBe('string');
      });
    };
    it('should return restaurant using restaurantID', async () => {
      mockVerifySuper();

      const res1 = await request(app.getServer()).get(`/restaurant`).set('Authorization', 'token').set('restaurantID', '1').expect(200);

      assertGetRestaurantDetailsResponse([res1.body]);
    }, 10000);
  });
  describe('GET /restaurant/emails', () => {
    const EMAIL_1 = 'test1@email.com';
    const EMAIL_2 = 'test2@email.com';
    it('should return restaurant using restaurantID', async () => {
      mockVerify();

      const entityManager: EntityManager = await ormConnection();

      const rRes = await request(app.getServer()).get('/restaurants').set('Authorization', 'token').expect(200);
      const restaurant: GetRestaurantResponse = rRes.body.restaurants[0] as GetRestaurantResponse;

      // Clean up any existing emails with the same email addresses to avoid duplicate key constraint
      await entityManager.delete(RestaurantUserEmailEntity, {
        email: EMAIL_1,
        restaurant_url_id: restaurant.restaurantUrlID,
      });
      await entityManager.delete(RestaurantUserEmailEntity, {
        email: EMAIL_2,
        restaurant_url_id: restaurant.restaurantUrlID,
      });

      const entities: RestaurantUserEmailEntity[] = [
        new RestaurantUserEmailEntity(EMAIL_1, restaurant.restaurantUrlID, undefined, '2023-02-02T02:44:11.950Z'),
        new RestaurantUserEmailEntity(EMAIL_2, restaurant.restaurantUrlID, undefined, '2022-02-02T02:44:11.950Z'),
      ];

      const userEmails: RestaurantUserEmailEntity[] = await entityManager.save(RestaurantUserEmailEntity, entities);

      const res = await request(app.getServer())
        .get(`/restaurant/emails`)
        .set('Authorization', 'token')
        .set('restaurantID', restaurant.restaurantID.toString())
        .expect(200);
      const emails = res.body as RestaurantUserEmailsResponseInterface[];

      expect(emails.length).toEqual(2);
      expect(typeof emails[0].id).toEqual('number');
      expect(emails[0].email).toEqual(EMAIL_2);
      expect(emails[0].createdAt).toEqual('2022-02-02T02:44:11.950Z');
      expect(emails[0].userID).toBeNull();
      expect(typeof emails[1].id).toEqual('number');
      expect(emails[1].email).toEqual(EMAIL_1);
      expect(emails[1].createdAt).toEqual('2023-02-02T02:44:11.950Z');
      expect(emails[1].userID).toBeNull();

      await entityManager.delete(
        RestaurantUserEmailEntity,
        userEmails.map(userEmail => userEmail.id),
      );
    });
  });
});

/**
 * set up database items needed for test cases
 *  - connect to database
 */
const setUp = async () => {
  await getConnection().connect();
};
/**
 * clean up anything done by test cases
 *  - close connections
 */
const cleanUp = async () => {
  await getConnection().close();
};

/**
 * bypass authorization layer
 */
const mockVerify = () => {
  const decoded = {
    managerID: 999,
    superUser: false,
  };
  (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
    callback(null, decoded);
  });
};

const mockVerifySuper = () => {
  const decoded = {
    managerID: 1000,
    superUser: true,
  };
  (jwt.verify as jest.MockedFunction<any>).mockImplementation((token, secretKey, callback) => {
    callback(null, decoded);
  });
};

// delete restaurant
const deleteRestaurantByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<void> => {
  if (!repository) {
    repository = await ormConnection();
  }
  await repository.delete(RestaurantEntity, { restaurant_id: restaurantID });
};

const deleteRestaurantsMenuLayoutByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<void> => {
  if (!repository) {
    repository = await ormConnection();
  }
  await repository.delete(RestaurantMenuLayoutEntity, { restaurant_id: restaurantID });
};

// delete restaurant
const deleteRestaurantAddressByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<void> => {
  if (!repository) {
    repository = await ormConnection();
  }
  await repository.delete(RestaurantAddressEntity, { restaurant_id: restaurantID });
};

// delete restaurant
const deleteManagerRestaurantByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<void> => {
  if (!repository) {
    repository = await ormConnection();
  }
  await repository.delete(ManagerRestaurantsEntity, { restaurant_id: restaurantID });
};

// delete restaurant hours
const deleteRestaurantHoursByRestaurantID = async (restaurantID: number, repository: EntityManager): Promise<void> => {
  if (!repository) {
    repository = await ormConnection();
  }
  await repository.delete(RestaurantHoursEntity, { restaurant_id: restaurantID });
};

/**
 * Helper function to remove created restaurant (restaurants, manager_restaurants, and restaurant_addresses tables)
 * to be removed once DELETE Restaurant functionality is implemented
 * @param restaurantID
 * @param isSuperUser
 */
const removeCreatedRestaurant = async (restaurantID: number, isSuperUser = false): Promise<void> => {
  const repository = await ormConnection();
  await repository.transaction(async conn => {
    if (!isSuperUser) {
      await deleteManagerRestaurantByRestaurantID(restaurantID, conn);
    }
    await deleteRestaurantsMenuLayoutByRestaurantID(restaurantID, conn);
    await deleteRestaurantAddressByRestaurantID(restaurantID, conn);
    await deleteRestaurantHoursByRestaurantID(restaurantID, conn);
    await conn.getRepository(StripeConnectAccountEntity).delete({ restaurant_id: restaurantID });
    await deleteRestaurantByRestaurantID(restaurantID, conn);
  });
};

const createManagerPackageEntityByManagerID = async (managerID = 1) => {
  const repository = await ormConnection();
  const packageEntity = await repository.findOne(PackageEntity, { name: 'beta' });
  const PACKAGE_ID = packageEntity?.package_id;
  const managerPackageEntity = {
    package_id: PACKAGE_ID,
    external_user_id: managerID,
  };
  const managerPackageResult = await repository.save(ManagerPackageEntity, managerPackageEntity);
  return managerPackageResult as ManagerPackageEntity;
};

const createSubscriptionAndItem = async (packageID: number) => {
  const CUSTOMER_ID = uuidv4();
  const repository = await ormConnection();

  await repository.insert(StripeCustomerEntity, { stripe_customer_id: CUSTOMER_ID });
  await repository.update(ManagerEntity, 999, { stripe_customer_id: CUSTOMER_ID });

  const subscription: SubscriptionEntity = {
    started_at: getCurrentDate(),
    stripe_subscription_id: uuidv4(),
    stripe_customer_id: CUSTOMER_ID,
  };
  const subscriptionResult = await repository.save(SubscriptionEntity, subscription);
  const subscriptionItem: SubscriptionItemEntity = {
    subscription_id: subscriptionResult.subscription_id,
    package_id: packageID,
    amount: 5700,
    tax_amount: 0,
    status: SubscriptionStatus.ACTIVE,
    stripe_subscription_item_id: uuidv4(),
    price_id: 2,
  };
  await repository.save(SubscriptionItemEntity, subscriptionItem);
};

/**
 * Helper function to remove manager tied to package in manager_packages table
 * to be removed once DELETE manager package functionality is implemented
 * @param managerPackageID
 */
const removeCreatedManagerPackage = async (managerPackageID: number): Promise<void> => {
  const repository = await ormConnection();
  await repository.delete(ManagerPackageEntity, managerPackageID);
};

const removeCreatedSubscriptionItems = async (): Promise<void> => {
  const repository = await ormConnection();
  await repository.createQueryBuilder().delete().from(SubscriptionItemEntity).where('subscription_item_id IS NOT NULL').execute();
  await repository.createQueryBuilder().delete().from(SubscriptionEntity).where('subscription_id IS NOT NULL').execute();
};

const removeCreatedRestaurantSocials = async (restaurantID: number): Promise<void> => {
  const repository = await ormConnection();
  await repository.createQueryBuilder().delete().from(RestaurantSocialsEntity).where('restaurant_id = :restaurantID', { restaurantID }).execute();
};
