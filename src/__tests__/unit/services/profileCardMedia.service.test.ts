import ProfileCardMediaService from '@/services/profileCardMedia.service';
import { ProfileCardMediaModelInterface } from '@/interfaces/profileCardsMedia.interface';
import { HttpException } from '@exceptions/HttpException';
import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';

jest.mock('typeorm', () => ({
  EntityManager: jest.fn(),
}));

jest.mock('@utils/dbUtils', () => ({
  ormConnection: jest.fn(),
}));

jest.mock('@utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('ProfileCardMediaService', () => {
  let profileCardMediaService: ProfileCardMediaService;
  let mockProfileCardMediaModel: ProfileCardMediaModelInterface;

  beforeEach(() => {
    mockProfileCardMediaModel = {
      deleteProfileCardMediaByCardID: jest.fn(),
      insertProfileCardMedia: jest.fn(),
    };
    profileCardMediaService = new ProfileCardMediaService(mockProfileCardMediaModel);
  });

  describe('linkMediaToProfileCard', () => {
    const transaction = jest.fn();
    beforeEach(() => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });
    });
    const mediaID = 1;
    const cardID = 1;

    it('should successfully call transaction for linking media to profile card', async () => {
      await profileCardMediaService.linkMediaToProfileCard(mediaID, cardID);

      expect(ormConnection).toHaveBeenCalledTimes(1);
      expect(transaction).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException with 500 status and log error if an unexpected error occurs', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await profileCardMediaService.linkMediaToProfileCard(mediaID, cardID);
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.status).toEqual(500);
      }
    });
  });
});
