import { TapManagerError } from '@exceptions/HttpException';
import { ProfileCardsEntity } from '@/entities/profileCards.entity';
import ProfileCardsService from '@/services/profileCards.service';
import ProfileCardsModel from '@/models/profileCards.model';
import ProfileCardMediaModel from '@/models/profileCardMedia.model';
import ProfileCardMediaService from '@/services/profileCardMedia.service';
import { ProfileCardMediaModelInterface } from '@/interfaces/profileCardsMedia.interface';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/models/profileCards.model', () => {
  const mockProfileCardsModel = {
    deleteCard: jest.fn(),
    upsertCard: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProfileCardsModel) };
});
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

const mockProfileCardsModel = new ProfileCardsModel();
const mockProfileCardMediaService = new ProfileCardMediaService({} as ProfileCardMediaModelInterface);
const profileCardsService = new ProfileCardsService(mockProfileCardsModel, mockProfileCardMediaService);

describe('profileCardsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('deleteCard', () => {
    const cardID = 1;
    it('should successfully delete card from the profile page section', async () => {
      (mockProfileCardsModel.deleteCard as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await profileCardsService.deleteCard(cardID);

      expect(mockProfileCardsModel.deleteCard).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs while deleting profile section card', async () => {
      (mockProfileCardsModel.deleteCard as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });
      try {
        await profileCardsService.deleteCard(cardID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('upsertCard', () => {
    const RESTAURANT_PROFILE_SECTION_ID = 1;
    const mockCard = new ProfileCardsEntity(
      {
        title: 'test title',
        content: 'test content',
        subtitle: 'test subtitle',
        linkURL: 'test link',
      },
      RESTAURANT_PROFILE_SECTION_ID,
    );
    it('should successfully upsert card to a profile page section', async () => {
      (mockProfileCardsModel.upsertCard as jest.MockedFunction<any>).mockResolvedValueOnce(mockCard);

      await profileCardsService.upsertCard(mockCard);

      expect(mockProfileCardsModel.upsertCard).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs while upserting profile section card', async () => {
      (mockProfileCardsModel.upsertCard as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await profileCardsService.upsertCard(mockCard);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
