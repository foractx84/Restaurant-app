import { ormConnection } from '@utils/dbUtils';
import { HttpException, TapManagerError } from '@exceptions/HttpException';
import ProfileCardMediaModel from '@/models/profileCardMedia.model';
import { ProfileCardsMediaEntity } from '@/entities/profileCardsMedia.entity';

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
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const profileCardMediaModel = new ProfileCardMediaModel();

describe('ProfileCardMediaModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('insertProfileCardMedia', () => {
    it('should successfully insert profile card media', async () => {
      const mockSave = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockSave,
      });

      const profileCardMedia: ProfileCardsMediaEntity[] = [
        new ProfileCardsMediaEntity(
          1, // restaurantProfileSectionCardMediaID
          1, // restaurantProfileSectionCardID
          undefined, // card
          1, // mediaID
          undefined, // media
          1, // listOrder
          new Date(), // createdAt
          new Date(), // updatedAt
        ),
        new ProfileCardsMediaEntity(
          2, // restaurantProfileSectionCardMediaID
          2, // restaurantProfileSectionCardID
          undefined, // card
          2, // mediaID
          undefined, // media
          2, // listOrder
          new Date(), // createdAt
          new Date(), // updatedAt
        ),
      ];

      await profileCardMediaModel.insertProfileCardMedia(profileCardMedia);

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledWith(ProfileCardsMediaEntity, profileCardMedia);
    });

    it('should throw 500 HttpException if any error occurs when inserting profile card media', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw new Error();
      });

      const profileCardMedia: ProfileCardsMediaEntity[] = [
        new ProfileCardsMediaEntity(
          1, // restaurantProfileSectionCardMediaID
          1, // restaurantProfileSectionCardID
          undefined, // card
          1, // mediaID
          undefined, // media
          1, // listOrder
          new Date(), // createdAt
          new Date(), // updatedAt
        ),
        new ProfileCardsMediaEntity(
          2, // restaurantProfileSectionCardMediaID
          2, // restaurantProfileSectionCardID
          undefined, // card
          2, // mediaID
          undefined, // media
          2, // listOrder
          new Date(), // createdAt
          new Date(), // updatedAt
        ),
      ];

      try {
        await profileCardMediaModel.insertProfileCardMedia(profileCardMedia);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });

  describe('deleteProfileCardMediaByCardID', () => {
    it('should successfully delete profile card media by card ID', async () => {
      const mockDelete = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: mockDelete,
      });

      const cardID = 123;

      await profileCardMediaModel.deleteProfileCardMediaByCardID(cardID);

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledWith(ProfileCardsMediaEntity, { restaurantProfileSectionCardID: cardID });
    });

    it('should throw 500 HttpException if any error occurs when deleting profile card media by card ID', async () => {
      const mockDelete = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        delete: mockDelete,
      });

      const cardID = 123;

      try {
        await profileCardMediaModel.deleteProfileCardMediaByCardID(cardID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
