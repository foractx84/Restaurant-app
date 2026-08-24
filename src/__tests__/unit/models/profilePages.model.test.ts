import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import ProfilePagesModel from '@/models/profilePages.model';
import { ProfilePageEntity } from '@/entities/profilePage.entity';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';

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

const profilePagesModel = new ProfilePagesModel();

describe('profilePagesModel', () => {
  const RESTAURANT_ID = 1;
  const PAGE_ID = 2;
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  const profilePageEntity = new ProfilePageEntity(
    'test name',
    'test seo title',
    RESTAURANT_ID,
    false,
    'test seo description',
    'url-path',
    'Test Link',
    [],
  );
  describe('fetchProfilePageByPageID', () => {
    it('should successfully fetch profile page by page id', async () => {
      const getRepository = jest.fn();
      const getOne = jest.fn().mockImplementation(({}, { where }: FindManyOptions) => {
        return [{ ...profilePageEntity, restaurantID: RESTAURANT_ID, restaurantProfilePageID: where?.restaurantProfilePageID }];
      });

      const orderBy = jest.fn(() => ({ getOne }));
      const andWhere1 = jest.fn(() => ({ orderBy }));
      const where1 = jest.fn(() => ({ andWhere: andWhere1 }));
      const leftJoinAndSelect1 = jest.fn(() => ({ where: where1 }));
      const leftJoinAndSelect2 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect1 }));
      const leftJoinAndSelect3 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));
      const leftJoinAndSelect4 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect3 }));
      const leftJoinAndSelect5 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect4 }));
      const leftJoinAndSelect6 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect5 }));
      const leftJoinAndSelect7 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect6 }));
      const leftJoinAndSelect8 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect7 }));
      const leftJoinAndSelect9 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect8 }));

      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect: leftJoinAndSelect9,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });

      (getOne as jest.MockedFunction<any>).mockResolvedValueOnce({ ...profilePageEntity, restaurantProfilePageID: PAGE_ID });
      getRepository.mockImplementation(() => createQueryBuilder);

      const result = await profilePagesModel.fetchProfilePageByPageID(PAGE_ID);

      expect(getOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ...profilePageEntity, restaurantProfilePageID: PAGE_ID });
    });
    it('should throw 500 HttpException if any error occurs when fetching restaurant profile page by page id', async () => {
      const REPOSITORY = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });

      try {
        await profilePagesModel.fetchProfilePageByPageID(PAGE_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('fetchProfilePagesByRestaurantID', () => {
    it('should successfully fetch profile pages by restaurant id', async () => {
      const find = jest.fn().mockImplementation(({}, { where }: FindManyOptions) => {
        return [{ ...profilePageEntity, restaurantID: where?.restaurantID, restaurantProfilePageID: PAGE_ID }];
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      const result = await profilePagesModel.fetchProfilePagesByRestaurantID(2);

      expect(find).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ ...profilePageEntity, restaurantProfilePageID: PAGE_ID, restaurantID: 2 }]);
    });
    it('should throw 500 HttpException if any error occurs when fetching restaurant profile page by restaurant id', async () => {
      const find = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      try {
        await profilePagesModel.fetchProfilePagesByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('upsertProfilePage', () => {
    it('should successfully upsert profile page', async () => {
      const save = jest.fn().mockImplementationOnce(({}, entity: ProfilePageEntity) => ({
        ...entity,
        restaurantProfilePageID: PAGE_ID,
      }));
      const REPOSITORY: any = {
        save,
      };

      const result = await profilePagesModel.upsertProfilePage(profilePageEntity, REPOSITORY);

      expect(save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        ...profilePageEntity,
        restaurantProfilePageID: PAGE_ID,
      });
    });
    it('should throw 500 HttpException if any error occurs when inserting restaurant profile page', async () => {
      const REPOSITORY: any = {
        save: () => {
          throw Error;
        },
      };

      try {
        await profilePagesModel.upsertProfilePage({} as ProfilePageEntity, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
