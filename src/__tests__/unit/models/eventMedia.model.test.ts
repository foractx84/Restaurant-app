import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import EventMediaModel from '@/models/eventMedia.model';
import { EventMediaEntity } from '@/entities/eventMedia.entity';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = { error: jest.fn(), warn: jest.fn() };
  return { __esModule: true, logger };
});
jest.mock('@/utils/dbUtils', () => ({ __esModule: true, ormConnection: jest.fn() }));

const eventMediaModel = new EventMediaModel();

const RESTAURANT_ID = 20;
const MEDIA_ID = 5;
const buildEntity = (overrides: Partial<EventMediaEntity> = {}): EventMediaEntity => ({
  event_media_id: MEDIA_ID,
  restaurant_id: RESTAURANT_ID,
  media_url: 'abc.jpg',
  media_type: 'image',
  list_order: 0,
  ...overrides,
});

describe('eventMediaModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('fetchByRestaurantID', () => {
    it('should fetch all active media ordered by list_order', async () => {
      const getMany = jest.fn().mockResolvedValueOnce([buildEntity()]);
      const builder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue(builder),
      });

      const result = await eventMediaModel.fetchByRestaurantID(RESTAURANT_ID);

      expect(result).toHaveLength(1);
      expect(builder.orderBy).toHaveBeenCalledWith('event_media.list_order', 'ASC');
    });
  });

  describe('fetchByID', () => {
    it('should fetch one row by id scoped to restaurant', async () => {
      const getOne = jest.fn().mockResolvedValueOnce(buildEntity());
      const builder = { where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getOne };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue(builder),
      });

      const result = await eventMediaModel.fetchByID(MEDIA_ID, RESTAURANT_ID);

      expect(result).toBeDefined();
      expect(builder.andWhere).toHaveBeenCalledWith('event_media.deleted_at IS NULL');
    });
  });

  describe('fetchMaxListOrder', () => {
    it('should coerce a number result', async () => {
      const getRawOne = jest.fn().mockResolvedValueOnce({ max: 7 });
      const builder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue(builder),
      });

      const result = await eventMediaModel.fetchMaxListOrder(RESTAURANT_ID);
      expect(result).toEqual(7);
    });

    it('should coerce a string result (pg sometimes returns int as string)', async () => {
      const getRawOne = jest.fn().mockResolvedValueOnce({ max: '9' });
      const builder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue(builder),
      });

      const result = await eventMediaModel.fetchMaxListOrder(RESTAURANT_ID);
      expect(result).toEqual(9);
      expect(typeof result).toBe('number');
    });

    it('should return -1 when there are no rows yet', async () => {
      const getRawOne = jest.fn().mockResolvedValueOnce({ max: null });
      const builder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue(builder),
      });

      const result = await eventMediaModel.fetchMaxListOrder(RESTAURANT_ID);
      expect(result).toEqual(-1);
    });
  });

  describe('insertMany', () => {
    it('should create rows starting at the given list_order', async () => {
      const created: any[] = [];
      const create = jest.fn().mockImplementation((_, props) => {
        created.push(props);
        return props;
      });
      const save = jest.fn().mockImplementation((_, rows) => rows.map((r: any, idx: number) => ({ ...r, event_media_id: 100 + idx })));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ create, save });

      const result = await eventMediaModel.insertMany(
        RESTAURANT_ID,
        [
          { mediaUrl: 'a.jpg', mediaType: 'image' },
          { mediaUrl: 'b.jpg', mediaType: 'image' },
        ],
        3,
      );

      expect(created).toHaveLength(2);
      expect(created[0]).toMatchObject({ media_url: 'a.jpg', list_order: 3 });
      expect(created[1]).toMatchObject({ media_url: 'b.jpg', list_order: 4 });
      expect(result[0].event_media_id).toEqual(100);
    });
  });

  describe('setListOrder', () => {
    it('should issue an UPDATE filtered to the restaurant and deleted_at IS NULL', async () => {
      const execute = jest.fn().mockResolvedValueOnce({ affected: 1 });
      const builder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue(builder),
      });

      await eventMediaModel.setListOrder(MEDIA_ID, RESTAURANT_ID, 2);

      expect(builder.set).toHaveBeenCalledWith(expect.objectContaining({ list_order: 2 }));
      expect(builder.andWhere).toHaveBeenCalledWith('deleted_at IS NULL');
    });
  });

  describe('softDelete', () => {
    it('should return the entity it just soft-deleted', async () => {
      const entity = buildEntity();
      // fetchByID: select builder returns the entity
      const selectBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValueOnce(entity),
      };
      // update builder
      const updateBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValueOnce({ affected: 1 }),
      };
      const createQueryBuilder = jest.fn().mockReturnValueOnce(selectBuilder).mockReturnValueOnce(updateBuilder);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ createQueryBuilder });

      const result = await eventMediaModel.softDelete(MEDIA_ID, RESTAURANT_ID);

      expect(result).toEqual(entity);
    });

    it('should return undefined when the row does not exist', async () => {
      const selectBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValueOnce(undefined),
      };
      const createQueryBuilder = jest.fn().mockReturnValueOnce(selectBuilder);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ createQueryBuilder });

      const result = await eventMediaModel.softDelete(MEDIA_ID, RESTAURANT_ID);

      expect(result).toBeUndefined();
    });
  });

  describe('countByRestaurantAndType', () => {
    it('should return the count of active media of a type', async () => {
      const getCount = jest.fn().mockResolvedValueOnce(3);
      const builder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue(builder),
      });

      const result = await eventMediaModel.countByRestaurantAndType(RESTAURANT_ID, 'image');
      expect(result).toEqual(3);
    });

    it('should throw HttpException(500) on db error', async () => {
      const getCount = jest.fn().mockRejectedValueOnce(new Error('boom'));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getCount,
        }),
      });

      try {
        await eventMediaModel.countByRestaurantAndType(RESTAURANT_ID, 'image');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.status).toEqual(500);
      }
    });
  });
});
