import { TapManagerError } from '@/exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import ModifierModel from '@/models/modifier.model';
import { ModifierEntity } from '@/entities/modifier.entity';

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

const modifierModel = new ModifierModel();
describe('modifierModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('fetchModifierByID', () => {
    const MODIFIER_ID = 123;
    it('should get modifier by modifier id', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      await modifierModel.fetchModifierByID(MODIFIER_ID);
      expect(findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while fetching modifier by id', async () => {
      const findOne = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await modifierModel.fetchModifierByID(MODIFIER_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('upsertModifier', () => {
    const MODIFIER: ModifierEntity = new ModifierEntity('Test', null, 400, 'This is a test');
    it('should upsert modifier', async () => {
      const mockedSave = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });
      await modifierModel.upsertModifier(MODIFIER);
      expect(mockedSave).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while upserting modifier', async () => {
      const mockedSave = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save: mockedSave,
      });

      try {
        await modifierModel.upsertModifier(MODIFIER);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('findModifiersByRestaurantID', () => {
    const MODIFIER: ModifierEntity = new ModifierEntity('Test', null, 400, 'This is a test');
    const RESTAURANT_ID = 1;
    it('should find modifiers by restaurantID', async () => {
      const getRepository = jest.fn();
      const getMany = jest.fn();
      const addOrderBy = jest.fn(() => ({ getMany }));
      const orderBy = jest.fn(() => ({ addOrderBy }));
      const andWhere1 = jest.fn(() => ({ orderBy }));
      const where1 = jest.fn(() => ({ andWhere: andWhere1 }));
      const leftJoinAndSelect2 = jest.fn(() => ({ where: where1 }));
      const leftJoinAndSelect1 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect: leftJoinAndSelect1,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      (getMany as jest.MockedFunction<any>).mockResolvedValueOnce([MODIFIER]);

      getRepository.mockImplementation(() => createQueryBuilder);

      const result = await modifierModel.findModifiersByRestaurantID(RESTAURANT_ID);
      expect(getMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([MODIFIER]);
    });
    it('should throw HttpException 500 if an error occurs while fetching modifiers by restaurantID', async () => {
      const REPOSITORY = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });

      try {
        await modifierModel.findModifiersByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('softDeleteModifier', () => {
    const MODIFIER_ID = 123;
    it('should soft delete modifier', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });
      await modifierModel.softDeleteModifier(MODIFIER_ID);
      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while soft deleting modifier', async () => {
      const update = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      try {
        await modifierModel.softDeleteModifier(MODIFIER_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
