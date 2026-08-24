import { TapManagerError } from '@/exceptions/HttpException';
import RestaurantSocialsModel from '@/models/restaurantSocials.model';
import RestaurantSocialsService from '@/services/restaurantSocials.service';

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
// mock the restaurantSocials model
jest.mock('@/models/restaurantSocials.model', () => {
  const mockRestaurantSocialsModel = {
    getRestaurantSocialsByRestaurantID: jest.fn(),
    insertRestaurantSocials: jest.fn(),
    updateRestaurantSocials: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantSocialsModel) };
});
// create mock restaurantSocials model object
const mockRestaurantSocialModel = new RestaurantSocialsModel();
const restaurantSocialsService = new RestaurantSocialsService(mockRestaurantSocialModel);

describe('RestaurantSocialsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const RESTAURANT_ID = 1;

  const emptySocials = {
    facebook: '',
    instagram: '',
    snapchat: '',
    tiktok: '',
    twitter: '',
    restaurantID: RESTAURANT_ID,
  };
  const mockEmptySocialsResponse = {
    facebook: '',
    instagram: '',
    snapchat: '',
    tiktok: '',
    twitter: '',
    restaurant_id: RESTAURANT_ID,
  };

  const fullSocials = {
    facebook: 'facebook.com',
    instagram: 'instagram.com',
    snapchat: 'snapchat.com',
    tiktok: 'tiktok.com',
    twitter: 'twitter.com',
    restaurantID: RESTAURANT_ID,
  };
  const mockFullSocialsResponse = {
    facebook: 'facebook.com',
    instagram: 'instagram.com',
    snapchat: 'snapchat.com',
    tiktok: 'tiktok.com',
    twitter: 'twitter.com',
    restaurant_id: RESTAURANT_ID,
  };

  const someSocials = {
    facebook: '',
    instagram: 'instagram.com',
    restaurantID: RESTAURANT_ID,
  };
  const mockSomeSocialsResponse = {
    facebook: '',
    instagram: 'instagram.com',
    snapchat: '',
    tiktok: '',
    twitter: '',
    restaurant_id: RESTAURANT_ID,
  };

  const RESTAURANT_SOCIALS_ID = 1;
  const socialsWithID = {
    facebook: '',
    instagram: 'instagram.com',
    snapchat: '',
    tiktok: '',
    twitter: '',
    restaurantID: RESTAURANT_ID,
    restaurantSocialsID: RESTAURANT_SOCIALS_ID,
  };
  const mockSocialsResponseWithID = {
    facebook: null,
    instagram: 'instagram.com',
    snapchat: null,
    tiktok: null,
    twitter: null,
    restaurant_id: RESTAURANT_ID,
    restaurant_socials_id: RESTAURANT_SOCIALS_ID,
  };

  describe('createRestaurantSocials', () => {
    it('should successfully create all socials for restaurant', async () => {
      // set up mock restaurantSocials model to return our mock response to service
      (mockRestaurantSocialModel.insertRestaurantSocials as jest.MockedFunction<any>).mockResolvedValueOnce(mockFullSocialsResponse);
      // call on the service like the controller would
      const result = await restaurantSocialsService.createRestaurantSocials(fullSocials);
      // enforce test expectations
      expect(mockRestaurantSocialModel.insertRestaurantSocials).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockFullSocialsResponse);
    });
    it('should successfully pass in empty socials for restaurant (empty strings)', async () => {
      // set up mock restaurantSocials model to return our mock response to service
      (mockRestaurantSocialModel.insertRestaurantSocials as jest.MockedFunction<any>).mockResolvedValueOnce(mockEmptySocialsResponse);
      // call on the service like the controller would
      const result = await restaurantSocialsService.createRestaurantSocials(emptySocials);
      // enforce test expectations
      expect(mockRestaurantSocialModel.insertRestaurantSocials).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockEmptySocialsResponse);
    });
    it('should successfully create some socials for restaurant', async () => {
      // set up mock restaurantSocials model to return our mock response to service
      (mockRestaurantSocialModel.insertRestaurantSocials as jest.MockedFunction<any>).mockResolvedValueOnce(mockSomeSocialsResponse);
      // call on the service like the controller would
      const result = await restaurantSocialsService.createRestaurantSocials(someSocials);
      // enforce test expectations
      expect(mockRestaurantSocialModel.insertRestaurantSocials).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSomeSocialsResponse);
    });
    it('should throw HttpException 500 if an error occurs while inserting / updating socials', async () => {
      (mockRestaurantSocialModel.insertRestaurantSocials as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantSocialsService.createRestaurantSocials(someSocials);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('getRestaurantSocialsByRestaurantID', () => {
    it('should successfully get restaurant socials', async () => {
      // set up mock restaurantSocials model to return our mock response to service
      (mockRestaurantSocialModel.getRestaurantSocialsByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(mockSocialsResponseWithID);
      // call on the service like the controller would
      const result = await restaurantSocialsService.getRestaurantSocialsByRestaurantID(RESTAURANT_ID);
      // enforce test expectations
      expect(mockRestaurantSocialModel.getRestaurantSocialsByRestaurantID).toHaveBeenCalledTimes(1);
      expect(result).toEqual(socialsWithID);
    });
    it('should throw HttpException 500 if an error occurs while getting restaurant socials', async () => {
      (mockRestaurantSocialModel.getRestaurantSocialsByRestaurantID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantSocialsService.getRestaurantSocialsByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('updateRestaurantSocials', () => {
    const RESTAURANT_SOCIALS_ID = 1;
    const socialsWithID = {
      facebook: '',
      instagram: 'instagram.com',
      snapchat: '',
      tiktok: '',
      twitter: '',
      restaurantSocialsID: RESTAURANT_SOCIALS_ID,
    };
    it('should successfully update socials for restaurant', async () => {
      // call on the service like the controller would
      await restaurantSocialsService.updateRestaurantSocials(socialsWithID);
      // enforce test expectations
      expect(mockRestaurantSocialModel.updateRestaurantSocials).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while updating socials', async () => {
      (mockRestaurantSocialModel.updateRestaurantSocials as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantSocialsService.updateRestaurantSocials(socialsWithID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
