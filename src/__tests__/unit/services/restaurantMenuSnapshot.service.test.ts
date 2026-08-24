import { TapManagerError } from '@/exceptions/HttpException';
import RestaurantMenuSnapshotService from '@services/restaurantMenuSnapshot.service';
import { RestaurantMenuSnapshotModelInterface } from '@interfaces/restaurantMenuSnapshot.interface';
import { RestaurantMenuSnapshotEntity } from '@entities/restaurantMenuSnapshot.entity';
import { EXTERNAL_PARTY } from '@constants/externalParty.constants';

jest.mock('@/utils/logger', () => {
  const logger = { error: jest.fn(), warn: jest.fn() };
  return { __esModule: true, logger };
});

const RESTAURANT_ID = 123;
const MENU_JSON = [{ id: 'menu-1', name: 'Menu', sections: [] }] as any;

describe('RestaurantMenuSnapshotService', () => {
  let mockModel: jest.Mocked<RestaurantMenuSnapshotModelInterface>;
  let service: RestaurantMenuSnapshotService;

  beforeEach(() => {
    mockModel = {
      createMenuSnapshot: jest.fn(),
      getLatestMenuSnapshotByRestaurantID: jest.fn(),
    };
    service = new RestaurantMenuSnapshotService(mockModel);
  });

  describe('createMenuSnapshot', () => {
    it('persists a snapshot tagged with external_party: otter', async () => {
      const saved = new RestaurantMenuSnapshotEntity(RESTAURANT_ID, MENU_JSON, 'hash-otter', EXTERNAL_PARTY.OTTER);
      mockModel.createMenuSnapshot.mockResolvedValueOnce(saved);

      const result = await service.createMenuSnapshot(RESTAURANT_ID, MENU_JSON, 'hash-otter', EXTERNAL_PARTY.OTTER);

      const [snapshotArg] = mockModel.createMenuSnapshot.mock.calls[0];
      expect(snapshotArg).toMatchObject({
        restaurantID: RESTAURANT_ID,
        menuJson: MENU_JSON,
        menuHash: 'hash-otter',
        externalParty: EXTERNAL_PARTY.OTTER,
      });
      expect(result).toEqual(saved);
    });

    it('defaults external_party to checkmate for existing callers that do not pass one', async () => {
      const saved = new RestaurantMenuSnapshotEntity(RESTAURANT_ID, MENU_JSON, 'hash-checkmate', EXTERNAL_PARTY.CHECKMATE);
      mockModel.createMenuSnapshot.mockResolvedValueOnce(saved);

      await service.createMenuSnapshot(RESTAURANT_ID, MENU_JSON, 'hash-checkmate');

      const [snapshotArg] = mockModel.createMenuSnapshot.mock.calls[0];
      expect(snapshotArg).toMatchObject({ externalParty: EXTERNAL_PARTY.CHECKMATE });
    });

    it('wraps model errors in a 500 HttpException', async () => {
      mockModel.createMenuSnapshot.mockRejectedValueOnce(new Error('db down'));

      try {
        await service.createMenuSnapshot(RESTAURANT_ID, MENU_JSON, 'hash-otter', EXTERNAL_PARTY.OTTER);
        fail('expected createMenuSnapshot to throw');
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });

  describe('getLatestMenuSnapshot', () => {
    it('passes external_party through to the model so otter and checkmate snapshots stay scoped separately', async () => {
      mockModel.getLatestMenuSnapshotByRestaurantID.mockResolvedValueOnce(null);

      await service.getLatestMenuSnapshot(RESTAURANT_ID, EXTERNAL_PARTY.OTTER);

      expect(mockModel.getLatestMenuSnapshotByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, EXTERNAL_PARTY.OTTER);
    });

    it('returns null when no snapshot exists yet', async () => {
      mockModel.getLatestMenuSnapshotByRestaurantID.mockResolvedValueOnce(null);

      const result = await service.getLatestMenuSnapshot(RESTAURANT_ID, EXTERNAL_PARTY.OTTER);

      expect(result).toBeNull();
    });

    it('returns the snapshot found for that restaurant + external party', async () => {
      const snapshot = new RestaurantMenuSnapshotEntity(RESTAURANT_ID, MENU_JSON, 'hash-otter', EXTERNAL_PARTY.OTTER);
      mockModel.getLatestMenuSnapshotByRestaurantID.mockResolvedValueOnce(snapshot);

      const result = await service.getLatestMenuSnapshot(RESTAURANT_ID, EXTERNAL_PARTY.OTTER);

      expect(result).toEqual(snapshot);
    });

    it('wraps model errors in a 500 HttpException', async () => {
      mockModel.getLatestMenuSnapshotByRestaurantID.mockRejectedValueOnce(new Error('db down'));

      try {
        await service.getLatestMenuSnapshot(RESTAURANT_ID, EXTERNAL_PARTY.OTTER);
        fail('expected getLatestMenuSnapshot to throw');
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
