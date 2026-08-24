import { TapManagerError } from '@/exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import { RestaurantMenuSnapshotEntity } from '@entities/restaurantMenuSnapshot.entity';
import RestaurantMenuSnapshotModel from '@models/restaurantMenuSnapshot.model';
import { EXTERNAL_PARTY } from '@constants/externalParty.constants';

jest.mock('@/utils/logger', () => {
  const logger = { error: jest.fn(), warn: jest.fn() };
  return { __esModule: true, logger };
});
jest.mock('@/utils/dbUtils', () => {
  return { __esModule: true, ormConnection: jest.fn() };
});

const restaurantMenuSnapshotModel = new RestaurantMenuSnapshotModel();
const RESTAURANT_ID = 123;
const MENU_JSON = [{ id: 'menu-1', name: 'Menu', sections: [] }] as any;

describe('RestaurantMenuSnapshotModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('createMenuSnapshot', () => {
    it('saves the snapshot entity as-is, tagged with whichever external_party it was constructed with', async () => {
      const snapshot = new RestaurantMenuSnapshotEntity(RESTAURANT_ID, MENU_JSON, 'hash-otter', EXTERNAL_PARTY.OTTER);
      const save = jest.fn().mockResolvedValueOnce(snapshot);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ save });

      const result = await restaurantMenuSnapshotModel.createMenuSnapshot(snapshot);

      expect(save).toHaveBeenCalledWith(RestaurantMenuSnapshotEntity, snapshot);
      expect(result).toEqual(snapshot);
    });

    it('uses the provided EntityManager instead of opening a new connection when given one', async () => {
      const snapshot = new RestaurantMenuSnapshotEntity(RESTAURANT_ID, MENU_JSON, 'hash-checkmate', EXTERNAL_PARTY.CHECKMATE);
      const save = jest.fn().mockResolvedValueOnce(snapshot);
      const manager: any = { save };

      await restaurantMenuSnapshotModel.createMenuSnapshot(snapshot, manager);

      expect(ormConnection).not.toHaveBeenCalled();
      expect(save).toHaveBeenCalledWith(RestaurantMenuSnapshotEntity, snapshot);
    });

    it('throws HttpException 500 if saving the snapshot fails', async () => {
      const snapshot = new RestaurantMenuSnapshotEntity(RESTAURANT_ID, MENU_JSON, 'hash-otter', EXTERNAL_PARTY.OTTER);
      const save = jest.fn().mockRejectedValueOnce(new Error('db down'));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ save });

      try {
        await restaurantMenuSnapshotModel.createMenuSnapshot(snapshot);
        fail('expected createMenuSnapshot to throw');
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });

  describe('getLatestMenuSnapshotByRestaurantID', () => {
    it('queries by restaurantID and externalParty together, ordered by most recent', async () => {
      const findOne = jest.fn().mockResolvedValueOnce(null);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ findOne });

      await restaurantMenuSnapshotModel.getLatestMenuSnapshotByRestaurantID(RESTAURANT_ID, EXTERNAL_PARTY.OTTER);

      expect(findOne).toHaveBeenCalledWith(RestaurantMenuSnapshotEntity, {
        where: { restaurantID: RESTAURANT_ID, externalParty: EXTERNAL_PARTY.OTTER },
        order: { createdAt: 'DESC' },
      });
    });

    it('defaults externalParty to checkmate when not provided', async () => {
      const findOne = jest.fn().mockResolvedValueOnce(null);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ findOne });

      await restaurantMenuSnapshotModel.getLatestMenuSnapshotByRestaurantID(RESTAURANT_ID);

      expect(findOne).toHaveBeenCalledWith(
        RestaurantMenuSnapshotEntity,
        expect.objectContaining({ where: { restaurantID: RESTAURANT_ID, externalParty: EXTERNAL_PARTY.CHECKMATE } }),
      );
    });

    it('returns null when no snapshot exists yet for that restaurant + external party', async () => {
      const findOne = jest.fn().mockResolvedValueOnce(null);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ findOne });

      const result = await restaurantMenuSnapshotModel.getLatestMenuSnapshotByRestaurantID(RESTAURANT_ID, EXTERNAL_PARTY.OTTER);

      expect(result).toBeNull();
    });

    it('throws HttpException 500 if the query fails', async () => {
      const findOne = jest.fn().mockRejectedValueOnce(new Error('db down'));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({ findOne });

      try {
        await restaurantMenuSnapshotModel.getLatestMenuSnapshotByRestaurantID(RESTAURANT_ID, EXTERNAL_PARTY.OTTER);
        fail('expected getLatestMenuSnapshotByRestaurantID to throw');
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
