import TitlesModel from '@/models/titles.model';
import { ormConnection } from '@/utils/dbUtils';
import { HttpException, TapManagerError } from '@exceptions/HttpException';
import { TitleEntity } from '@/entities/title.entity';

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
  return { __esModule: true, rawQuery: jest.fn(), ormConnection: jest.fn() };
});

const titlesModel = new TitlesModel();

describe('titlesModel', () => {
  const mockTitle = {
    titleID: 1,
    name: 'Owner',
  };
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  describe('getTitleByName', () => {
    it('should successfully return a title by name', async () => {
      const getRepository = jest.fn();
      const getRawMany = jest.fn();
      const where = jest.fn(() => ({ getRawMany }));
      const addSelect = jest.fn(() => ({ where }));
      const select = jest.fn(() => ({ addSelect }));
      const createQueryBuilder: any = jest.fn(() => ({ select }));
      const REPOSITORY: any = {
        createQueryBuilder,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      (getRawMany as jest.MockedFunction<any>).mockResolvedValueOnce([mockTitle]);

      getRepository.mockImplementation(() => createQueryBuilder);

      const result = await titlesModel.getTitleByName('Owner');

      expect(getRawMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTitle);
    });

    it('should throw an HttpException when a database error occurs', async () => {
      const REPOSITORY = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });

      try {
        await titlesModel.getTitleByName('Owner');
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('insertTitle', () => {
    it('should successfully return the inserted title ID', async () => {
      const expectedResponse = {
        titleID: 1,
      };
      const insert = jest.fn().mockResolvedValue({ raw: [{ titleID: 1 }] });
      const REPOSITORY: any = {
        insert,
      };
      const result = await titlesModel.insertTitle(mockTitle.name, REPOSITORY);
      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should not successfully insert a new title because a database error occurred', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error('Database error occured');
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        insert,
      });
      try {
        await titlesModel.insertTitle('Owner');
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
      expect(insert).toHaveBeenCalledTimes(1);
      expect(insert).toThrow('Database error occured');
    });
  });
  describe('getTitles', () => {
    it('should retrieve all titles successfully', async () => {
      const mockedResponse: TitleEntity = {
        id: 1,
        name: 'Owner',
      };
      const find = jest.fn().mockResolvedValue([mockedResponse]);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      const result = await titlesModel.getTitles();

      expect(find).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockedResponse]);
    });
    it('should throw HttpException 500 if an error occurs while fetching titles', async () => {
      const find = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });
      try {
        await titlesModel.getTitles();
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
