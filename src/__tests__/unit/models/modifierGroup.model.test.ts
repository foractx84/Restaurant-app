import { TapManagerError } from '@/exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import ModifierGroupModel from '@/models/modifierGroup.model';
import { ModifierGroupEntity } from '@/entities/modifierGroup.entity';

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

const modifierGroupModel = new ModifierGroupModel();
describe('modifierModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('createModifierGroup', () => {
    const MODIFIER_GROUP: ModifierGroupEntity = new ModifierGroupEntity('Tes_label', 'Test_name');

    it('should create modifier group', async () => {
      const save = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });
      await modifierGroupModel.createModifierGroup(MODIFIER_GROUP);
      expect(save).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while creating modifier group', async () => {
      const save = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });

      try {
        await modifierGroupModel.createModifierGroup(MODIFIER_GROUP);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('fetchModifierGroupByID', () => {
    const MODIFIER_GROUP_ID = 123;
    it('should get modifier group by modifier group id', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      await modifierGroupModel.fetchModifierGroupByID(MODIFIER_GROUP_ID);
      expect(findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while fetching modifier group by id', async () => {
      const findOne = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await modifierGroupModel.fetchModifierGroupByID(MODIFIER_GROUP_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('fetchModifierGroupByNameAndRestaurantID', () => {
    const NAME = 'TEST_NAME';
    const RESTAURANT_ID = 1;
    it('should fetch modifier group by name and restaurantID', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      await modifierGroupModel.fetchModifierGroupByNameAndRestaurantID(NAME, RESTAURANT_ID);
      expect(findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while fetching modifier group by name and restaurantID', async () => {
      const ormConnection = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await modifierGroupModel.fetchModifierGroupByNameAndRestaurantID(NAME, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('softDeleteModifierGroup', () => {
    const MODIFIER_GROUP_ID = 123;
    it('should soft delete modifier group', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });
      await modifierGroupModel.softDeleteModifierGroup(MODIFIER_GROUP_ID);
      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while soft deleting modifier group', async () => {
      const update = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      try {
        await modifierGroupModel.softDeleteModifierGroup(MODIFIER_GROUP_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('upsertModifierGroup', () => {
    const MODIFIER_GROUP: ModifierGroupEntity = new ModifierGroupEntity('Tes_label', 'Test_name');

    it('should upsert modifier group', async () => {
      const save = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });
      await modifierGroupModel.upsertModifierGroup(MODIFIER_GROUP);
      expect(save).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while upserting modifier group', async () => {
      const save = jest.fn().mockResolvedValueOnce(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        save,
      });

      try {
        await modifierGroupModel.upsertModifierGroup(MODIFIER_GROUP);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('fetchModifierGroupsByRestaurantID', () => {
    const MODIFIER_GROUPS: ModifierGroupEntity[] = [new ModifierGroupEntity('Tes_label', 'Test_name')];
    const RESTAURANT_ID = 1;
    it('should find modifier groups by restaurantID', async () => {
      const getRepository = jest.fn();
      const getMany = jest.fn();
      const andWhere = jest.fn(() => ({ getMany }));
      const where = jest.fn(() => ({ andWhere }));
      const leftJoinAndSelect4 = jest.fn(() => ({ where }));
      const leftJoinAndSelect3 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect4 }));
      const leftJoinAndSelect2 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect3 }));
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
      (getMany as jest.MockedFunction<any>).mockResolvedValueOnce(MODIFIER_GROUPS);

      getRepository.mockImplementation(() => createQueryBuilder);

      const result = await modifierGroupModel.fetchModifierGroupsByRestaurantID(RESTAURANT_ID);
      expect(getMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(MODIFIER_GROUPS);
    });
    it('should throw HttpException 500 if an error occurs while fetching modifier groups by restaurantID', async () => {
      const REPOSITORY = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });

      try {
        await modifierGroupModel.fetchModifierGroupsByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
