import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import { ProfileCardsEntity } from '@/entities/profileCards.entity';
import ProfileCardsModel from '@/models/profileCards.model';
import { EntityManager } from 'typeorm';

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

const profileCardsModel = new ProfileCardsModel();

describe('profileCardsModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('deleteCard', () => {
    const cardID = 1;
    it('should successfully delete card of profile section', async () => {
      const deleteSpy = jest.fn();
      const REPOSITORY: any = {
        delete: deleteSpy,
      };
      await profileCardsModel.deleteCard(cardID, REPOSITORY as EntityManager);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs when upserting card by profile section', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });
      try {
        await profileCardsModel.deleteCard(cardID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
  });
  describe('upsertCard', () => {
    const RESTAURANT_PROFILE_SECTION_ID = 2;
    const CARD_ENTITY = new ProfileCardsEntity(
      {
        title: 'test title',
        content: 'test content',
        subtitle: 'test subtitle',
        linkURL: 'test link',
      },
      RESTAURANT_PROFILE_SECTION_ID,
    );
    it('should successfully upsert card of profile section', async () => {
      const save = jest.fn();
      (ormConnection as jest.Mock).mockResolvedValue({
        save,
      });
      (save as jest.MockedFunction<any>).mockResolvedValueOnce(CARD_ENTITY);

      const result = await profileCardsModel.upsertCard(CARD_ENTITY);

      expect(ormConnection).toHaveBeenCalledTimes(1);
      expect(save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(CARD_ENTITY);
    });
    it('should throw 500 HttpException if any error occurs when upserting card by profile section', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await profileCardsModel.upsertCard(CARD_ENTITY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
  });
});
