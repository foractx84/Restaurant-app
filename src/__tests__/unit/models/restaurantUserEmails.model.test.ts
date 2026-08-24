import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import RestaurantUserEmailsModel from '@/models/restaurantUserEmails.model';
import { RestaurantUserEmailEntity } from '@/entities/restaurantUserEmail.entity';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/dbUtils', () => {
  return { __esModule: true, ormConnection: jest.fn() };
});

const restaurantUserEmailsModel = new RestaurantUserEmailsModel();

describe('restaurantUserEmailsModel', () => {
  const URL_ID = 'F84DL3';
  const USER_EMAILS_ENTITIES: RestaurantUserEmailEntity[] = [
    {
      id: 1,
      email: 'Owner',
      restaurant_url_id: URL_ID,
      created_at: '2022-02-02T02:44:11.950Z',
      user_id: 123,
    },
  ];

  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  describe('fetchRestaurantUserEmailsByRestaurantID', () => {
    it('should successfully fetch restaurant user emails by restaurant id', async () => {
      const find = jest.fn();

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });
      (find as jest.MockedFunction<any>).mockResolvedValueOnce(USER_EMAILS_ENTITIES);

      const result = await restaurantUserEmailsModel.fetchRestaurantUserEmailsByRestaurantID(URL_ID);

      expect(find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(USER_EMAILS_ENTITIES);
    });

    it('should throw an HttpException when a database error occurs', async () => {
      const find = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      try {
        await restaurantUserEmailsModel.fetchRestaurantUserEmailsByRestaurantID(URL_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
