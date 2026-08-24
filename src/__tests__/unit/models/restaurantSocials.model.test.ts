import { TapManagerError } from '@/exceptions/HttpException';
import RestaurantSocialsModel from '@/models/restaurantSocials.model';
import { ormConnection } from '@utils/dbUtils';

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

const restaurantSocialsModel = new RestaurantSocialsModel();
describe('RestaurantSocialsModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  const RESTAURANT_ID = 1;
  const RESTAURANT_SOCIALS_ID = 1;

  const emptySocials = {
    facebook: '',
    instagram: '',
    snapchat: '',
    tiktok: '',
    twitter: '',
    restaurant_id: RESTAURANT_ID,
    restaurant_socials_id: RESTAURANT_SOCIALS_ID,
  };

  const fullSocials = {
    facebook: 'facebook.com',
    instagram: 'instagram.com',
    snapchat: 'snapchat.com',
    tiktok: 'tiktok.com',
    twitter: 'twitter.com',
    restaurant_id: RESTAURANT_ID,
    restaurant_socials_id: RESTAURANT_SOCIALS_ID,
  };

  const someSocials = {
    facebook: '',
    instagram: 'instagram.com',
    restaurant_id: RESTAURANT_ID,
    restaurant_socials_id: RESTAURANT_SOCIALS_ID,
  };
  describe('getRestaurantSocialsByRestaurantID', () => {
    it('should get all socials of restaurant by restaurantID', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      await restaurantSocialsModel.getRestaurantSocialsByRestaurantID(RESTAURANT_ID);
      expect(findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while gettting restaurant socials', async () => {
      const findOne = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await restaurantSocialsModel.getRestaurantSocialsByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('insertRestaurantSocials', () => {
    it('should insert all socials', async () => {
      const mockedSave = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });
      await restaurantSocialsModel.insertRestaurantSocials(fullSocials);
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });
    it('should insert some socials', async () => {
      const mockedSave = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });
      await restaurantSocialsModel.insertRestaurantSocials(someSocials);
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });
    it('should set socials to all null (all socials empty string', async () => {
      const mockedSave = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });
      await restaurantSocialsModel.insertRestaurantSocials(emptySocials);
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while inserting restaurant socials', async () => {
      const mockedSave = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });

      try {
        await restaurantSocialsModel.insertRestaurantSocials(fullSocials);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('updateRestaurantSocials', () => {
    it('should update all socials', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });
      await restaurantSocialsModel.updateRestaurantSocials(fullSocials);
      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should update some socials', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });
      await restaurantSocialsModel.updateRestaurantSocials(someSocials);
      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should set socials to all null (all socials empty string', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });
      await restaurantSocialsModel.updateRestaurantSocials(emptySocials);
      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while updating restaurant socials', async () => {
      const update = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      try {
        await restaurantSocialsModel.updateRestaurantSocials(fullSocials);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
