import UsersModel from '@/models/users.model';
import { rawQuery } from '@/utils/dbUtils';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/dbUtils', () => {
  return { __esModule: true, rawQuery: jest.fn() };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});

const usersModel = new UsersModel();

describe('usersModel', () => {
  afterEach(() => {
    (rawQuery as jest.MockedFunction<any>).mockReset();
  });
  describe('validateManagerAuthorized', () => {
    const MANAGER_ID = 3;
    it('should return true if manager restaurant pair exists', async () => {
      const RESTAURANT_ID = 2;
      const mockRawQueryValidateManagerResponse = [
        {
          id: 1,
          restaurant_id: 2,
          external_user_id: MANAGER_ID,
        },
      ];
      (rawQuery as jest.MockedFunction<any>).mockResolvedValueOnce(mockRawQueryValidateManagerResponse);

      const result = await usersModel.validateManagerAuthorized(MANAGER_ID, RESTAURANT_ID);

      expect(rawQuery).toHaveBeenCalledTimes(1);
      expect(result).toBeTruthy();
    });

    it('should return false if manager restaurant pair does not exist', async () => {
      const RESTAURANT_ID = 1;
      const mockRawQueryValidateManagerResponse = [];
      (rawQuery as jest.MockedFunction<any>).mockResolvedValueOnce(mockRawQueryValidateManagerResponse);

      const result = await usersModel.validateManagerAuthorized(MANAGER_ID, RESTAURANT_ID);

      expect(rawQuery).toHaveBeenCalledTimes(1);
      expect(result).toBeFalsy();
    });
  });
  describe('getManager', () => {
    const EMAIL = 'test@email.com';

    it('should return manager with matching email', async () => {
      const mockRawQueryGetManager = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: EMAIL,
          phone: '55555555555',
          pwd: 'encryped_password',
          position_title_id: 6,
        },
      ];
      (rawQuery as jest.MockedFunction<any>).mockResolvedValueOnce(mockRawQueryGetManager);

      const result = await usersModel.getManager(EMAIL);

      expect(rawQuery).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRawQueryGetManager[0]);
    });

    it('should return undefined result since no manager found for email', async () => {
      (rawQuery as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      const result = await usersModel.getManager(EMAIL);

      expect(rawQuery).toHaveBeenCalledTimes(1);
      expect(result).toEqual(undefined);
    });
  });
});
