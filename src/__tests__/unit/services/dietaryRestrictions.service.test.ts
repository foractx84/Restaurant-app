import { DietaryRestrictionsInterface } from '@interfaces/dietaryRestrictions.interface';
import DietaryRestrictionsService from '@services/dietaryRestrictions.service';
import { DietaryRestrictionEntity } from '@/entities/dietaryRestriction.entity';
import DietaryRestrictionsModel from '@/models/dietaryRestrictions.model';
import { HttpException } from '@exceptions/HttpException';

jest.mock('@/models/dietaryRestrictions.model', () => {
  const mockDietaryRestrictionsModel = {
    findDietaryRestrictionsByIDs: jest.fn(),
    getAllRestrictions: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDietaryRestrictionsModel) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});

const mockDietaryRestrictionsModel = new DietaryRestrictionsModel();
const dietaryRestrictionsService = new DietaryRestrictionsService(mockDietaryRestrictionsModel);

describe('dietaryRestrictionsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validateDietaryRestrictions', () => {
    it('should successfully verify dietary restrictions provided exist', async () => {
      const mockModelResponse: DietaryRestrictionEntity[] = [
        {
          restriction_id: 1,
          name: 'test',
          created_at: '2022-02-02T02:44:11.950Z',
          updated_at: '2022-02-02T02:44:11.950Z',
        },
      ];
      (mockDietaryRestrictionsModel.findDietaryRestrictionsByIDs as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      expect(async () => await dietaryRestrictionsService.validateDietaryRestrictions([1])).not.toThrow();
      expect(mockDietaryRestrictionsModel.findDietaryRestrictionsByIDs).toHaveBeenCalledTimes(1);
    });
    it('should not throw exception if no restriction IDs are provided', async () => {
      (mockDietaryRestrictionsModel.findDietaryRestrictionsByIDs as jest.MockedFunction<any>).mockResolvedValueOnce({});

      expect(async () => await dietaryRestrictionsService.validateDietaryRestrictions(undefined)).not.toThrow();

      expect(mockDietaryRestrictionsModel.findDietaryRestrictionsByIDs).not.toHaveBeenCalled();
    });
    it('should throw 400 Bad Request HttpException if restriction ID provided does not exist', async () => {
      const mockModelResponse: DietaryRestrictionEntity[] = [
        {
          restriction_id: 1,
          name: 'test',
          created_at: '2022-02-02T02:44:11.950Z',
          updated_at: '2022-02-02T02:44:11.950Z',
        },
      ];
      (mockDietaryRestrictionsModel.findDietaryRestrictionsByIDs as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      try {
        await dietaryRestrictionsService.validateDietaryRestrictions([2]);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload instanceof HttpException);
      }

      expect(mockDietaryRestrictionsModel.findDietaryRestrictionsByIDs).toHaveBeenCalledTimes(1);
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

    const mockServiceResponse: DietaryRestrictionsInterface[] = [
      {
        restrictionID: 1,
        name: 'Beef',
      },
      {
        restrictionID: 3,
        name: 'Chicken',
      },
      {
        restrictionID: 8,
        name: 'Eggs',
      },
      {
        restrictionID: 4,
        name: 'Fish',
      },
      {
        restrictionID: 7,
        name: 'Lactose',
      },
      {
        restrictionID: 9,
        name: 'Nuts',
      },
      {
        restrictionID: 2,
        name: 'Pork',
      },
      {
        restrictionID: 5,
        name: 'Shellfish',
      },
      {
        restrictionID: 6,
        name: 'Gluten',
      },
    ];

    it('should successfully get all dietary restrictions in table', async () => {
      (mockDietaryRestrictionsModel.getAllRestrictions as jest.MockedFunction<any>).mockResolvedValueOnce(mockModelResponse);

      const result = await dietaryRestrictionsService.getAllRestrictions();
      expect(mockDietaryRestrictionsModel.getAllRestrictions).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });
    it('should throw 500 Bad Request HttpException if any error exists', async () => {
      (mockDietaryRestrictionsModel.getAllRestrictions as jest.MockedFunction<any>).mockImplementation(() => {
        throw Error;
      });

      try {
        await dietaryRestrictionsService.getAllRestrictions();
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockDietaryRestrictionsModel.getAllRestrictions).toHaveBeenCalledTimes(1);
    });
  });
});
