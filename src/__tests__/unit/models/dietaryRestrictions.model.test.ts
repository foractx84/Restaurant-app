import { ormConnection } from '@utils/dbUtils';
import DietaryRestrictionsModel from '@/models/dietaryRestrictions.model';
import { DietaryRestrictionEntity } from '@/entities/dietaryRestriction.entity';
import { HttpException } from '@exceptions/HttpException';
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

const dietaryRestrictionsModel = new DietaryRestrictionsModel();
describe('dietaryRestrictionsModel', () => {
  const DIETARY_RESTRICTION_ID = 123;
  describe('findDietaryRestrictionsByIDs', () => {
    it('should find dietary restrictions by id successfully', async () => {
      const DIETARY_RESTRICTION: DietaryRestrictionEntity = {
        restriction_id: DIETARY_RESTRICTION_ID,
        name: 'test',
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      };

      const findByIds = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findByIds,
      });
      (findByIds as jest.MockedFunction<any>).mockResolvedValueOnce([DIETARY_RESTRICTION]);

      const result = await dietaryRestrictionsModel.findDietaryRestrictionsByIDs([DIETARY_RESTRICTION_ID]);

      expect(findByIds).toHaveBeenCalledTimes(1);
      expect(result).toEqual([DIETARY_RESTRICTION]);
    });
    it('should throw HttpException 500 if an error occurs while finding dietary restrictions by ids', async () => {
      const findByIds = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findByIds,
      });

      try {
        await dietaryRestrictionsModel.findDietaryRestrictionsByIDs([DIETARY_RESTRICTION_ID]);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(findByIds).toHaveBeenCalledTimes(1);
    });
  });
  describe('getAllRestrictions', () => {
    const mockModelResponse: DietaryRestrictionEntity[] = [
      {
        restriction_id: 1,
        name: 'Beef',
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        restriction_id: 3,
        name: 'Chicken',
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        restriction_id: 8,
        name: 'Eggs',
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        restriction_id: 4,
        name: 'Fish',
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        restriction_id: 7,
        name: 'Lactose',
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        restriction_id: 9,
        name: 'Nuts',
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        restriction_id: 2,
        name: 'Pork',
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        restriction_id: 5,
        name: 'Shellfish',
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
      {
        restriction_id: 6,
        name: 'Gluten',
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      },
    ];
    it('should get all dietary restrictions successfully', async () => {
      const find = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });
      (find as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await dietaryRestrictionsModel.getAllRestrictions();

      expect(find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockModelResponse);
    });
    it('should throw HttpException 500 if an error occurs while getting dietary restrictions', async () => {
      const find = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      try {
        await dietaryRestrictionsModel.getAllRestrictions({} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
