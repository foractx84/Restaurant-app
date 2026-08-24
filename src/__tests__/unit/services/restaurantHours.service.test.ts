import { Day } from '@/enums/day';
import { TapManagerError } from '@/exceptions/HttpException';
import RestaurantHoursModel from '@/models/restaurantHours.model';
import RestaurantHoursService from '@/services/restaurantHours.service';

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
// mock the restaurantHours model
jest.mock('@/models/restaurantHours.model', () => {
  const mockRestaurantHoursModel = {
    deleteRestaurantHours: jest.fn(),
    insertRestaurantHours: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockRestaurantHoursModel) };
});
// create mock restaurantHours model object
const mockRestaurantHoursModel = new RestaurantHoursModel();
const restaurantHoursService = new RestaurantHoursService(mockRestaurantHoursModel);

describe('RestaurantHoursService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const RESTAURANT_ID = 1;

  const restaurantHours = [
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
  ];

  const mockRestaurantHoursModelResponse = [
    {
      restaurant_hours_id: 117,
      restaurant_id: 1,
      day: 'Monday',
      start: '08:00',
      end: '10:00',
    },
    {
      restaurant_hours_id: 118,
      restaurant_id: 1,
      day: 'Tuesday',
      start: '08:00',
      end: '10:00',
    },
    {
      restaurant_hours_id: 119,
      restaurant_id: 1,
      day: 'Tuesday',
      start: '18:00',
      end: '20:00',
    },
  ];

  describe('createRestaurantHours', () => {
    it('should successfully create hours for restaurant', async () => {
      (mockRestaurantHoursModel.insertRestaurantHours as jest.MockedFunction<any>).mockResolvedValueOnce(mockRestaurantHoursModelResponse);
      // call on the service like the controller would
      const result = await restaurantHoursService.createRestaurantHours(restaurantHours, RESTAURANT_ID);
      // enforce test expectations
      expect(mockRestaurantHoursModel.insertRestaurantHours).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRestaurantHoursModelResponse);
    });
    it('should throw HttpException 500 if an error occurs while inserting / updating restaurantHours', async () => {
      (mockRestaurantHoursModel.insertRestaurantHours as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantHoursService.createRestaurantHours(restaurantHours, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('removeRestaurantHours', () => {
    it('should successfully remove all restaurant hours for restaurant', async () => {
      // set up mock restaurantHours model to return our mock response to service
      (mockRestaurantHoursModel.deleteRestaurantHours as jest.MockedFunction<any>).mockResolvedValueOnce(mockRestaurantHoursModelResponse);
      // call on the service like the controller would
      await restaurantHoursService.removeRestaurantHours(RESTAURANT_ID);
      // enforce test expectations
      expect(mockRestaurantHoursModel.deleteRestaurantHours).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while removing restaurantHours', async () => {
      (mockRestaurantHoursModel.deleteRestaurantHours as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await restaurantHoursService.removeRestaurantHours(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
