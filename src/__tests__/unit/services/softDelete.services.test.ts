import { HttpException } from '@exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import SoftDeleteService from '@/services/softDelete.service';
import SoftDeleteModel from '@/models/softDelete.model';
import { EntityManager } from 'typeorm';

jest.mock('typeorm', () => {
  return {
    getRepository: () => jest.fn(),
    BaseEntity: class Mock {},
    ObjectType: () => jest.fn(),
    Entity: () => jest.fn(),
    InputType: () => jest.fn(),
    Index: () => jest.fn(),
    PrimaryGeneratedColumn: () => jest.fn(),
    Column: () => jest.fn(),
    JoinColumn: () => jest.fn(),
    CreateDateColumn: () => jest.fn(),
    UpdateDateColumn: () => jest.fn(),
    OneToMany: () => jest.fn(),
    ManyToOne: () => jest.fn(),
    EntityRepository: () => jest.fn(),
    getConnection: jest.fn(),
    getCustomRepository: jest.fn(),
    OneToOne: () => jest.fn(),
    ManyToMany: () => jest.fn(),
  };
});

jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/softDelete.model', () => {
  const mockSoftDeleteModel = {
    softDeleteMenuByID: jest.fn(),
    softDeleteMenuItemByMenuID: jest.fn(),
    softDeleteMenuItemByMenuSectionID: jest.fn(),
    softDeleteMenuSectionByID: jest.fn(),
    softDeleteMenuSectionByMenuID: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockSoftDeleteModel) };
});

// create mock menu sections model object
const mockSoftDeleteModel = new SoftDeleteModel();
const mockSoftDeleteService = new SoftDeleteService(mockSoftDeleteModel);

describe('SoftDeleteService', () => {
  afterEach(() => {
    jest.resetAllMocks();
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  describe('softDeleteMenuByID', () => {
    const mockMenuID = 1;
    it('should successfully call softDeleteMenuByID', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await mockSoftDeleteService.softDeleteMenuByID(mockMenuID);

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while calling ormConnection', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mockSoftDeleteService.softDeleteMenuByID(mockMenuID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('softDeleteMenuItemByMenuID', () => {
    const mockMenuID = 1;
    it('should successfully call softDeleteMenuItemByMenuID', async () => {
      (mockSoftDeleteModel.softDeleteMenuItemByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await mockSoftDeleteService.softDeleteMenuItemByMenuID(mockMenuID, {} as EntityManager);

      expect(mockSoftDeleteModel.softDeleteMenuItemByMenuID).toHaveBeenCalledWith(mockMenuID, {} as EntityManager);
    });
  });
  describe('softDeleteMenuItemByMenuSectionID', () => {
    const mockMenuID = 1;
    it('should successfully call softDeleteMenuItemByMenuSectionID', async () => {
      (mockSoftDeleteModel.softDeleteMenuItemByMenuSectionID as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await mockSoftDeleteService.softDeleteMenuItemByMenuSectionID(mockMenuID, {} as EntityManager);

      expect(mockSoftDeleteModel.softDeleteMenuItemByMenuSectionID).toHaveBeenCalledWith(mockMenuID, {} as EntityManager);
    });
  });
  describe('softDeleteMenuSectionByID', () => {
    const mockMenuSectionID = 1;
    it('should successfully call transaction', async () => {
      const transaction = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        transaction,
      });

      await mockSoftDeleteService.softDeleteMenuSectionByID(mockMenuSectionID);

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while calling ormConnection', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await mockSoftDeleteService.softDeleteMenuSectionByID(mockMenuSectionID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('softDeleteMenuSectionByMenuID', () => {
    const mockMenuID = 1;
    it('should successfully call softDeleteMenuSectionsByID', async () => {
      (mockSoftDeleteModel.softDeleteMenuSectionByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await mockSoftDeleteService.softDeleteMenuSectionByMenuID(mockMenuID, {} as EntityManager);

      expect(mockSoftDeleteModel.softDeleteMenuSectionByMenuID).toHaveBeenCalledWith(mockMenuID, {} as EntityManager);
    });
  });
});
