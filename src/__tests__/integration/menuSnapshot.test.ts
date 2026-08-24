import { app } from '@/server';
import { getConnection } from 'typeorm';
import { ormConnection } from '@/utils/dbUtils';
import RestaurantMenuSnapshotModel from '@models/restaurantMenuSnapshot.model';
import RestaurantMenuSnapshotService from '@services/restaurantMenuSnapshot.service';
import { RestaurantMenuSnapshotEntity } from '@/entities/restaurantMenuSnapshot.entity';
import { generateHash } from '@/utils/hashUtils';
import { EXTERNAL_PARTY } from '@constants/externalParty.constants';

jest.mock('@/utils/GCP_bucket', () => require('../../../__mocks__/GCP_bucket'));
jest.mock('@/utils/logger', () => {
  const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  return { __esModule: true, logger: logger, initializeLogger: jest.fn() };
});

const RESTAURANT_ID = 1;
const restaurantMenuSnapshotService = new RestaurantMenuSnapshotService(new RestaurantMenuSnapshotModel());
const createdSnapshotIDs: number[] = [];

const buildMenuJson = (label: string) => [{ id: `menu-${label}`, name: `Menu ${label}`, sections: [] }] as any;

describe('Menu snapshot storage (otter + checkmate)', () => {
  beforeAll(async () => {
    await getConnection().connect();
    void app;
  });

  afterAll(async () => {
    const repository = await ormConnection();
    if (createdSnapshotIDs.length > 0) {
      await repository.delete(RestaurantMenuSnapshotEntity, createdSnapshotIDs);
    }
    await getConnection().close();
  });

  it('writes a snapshot tagged external_party: otter and retrieves it by restaurant + external_party', async () => {
    const menuJson = buildMenuJson('otter-initial');
    const hash = generateHash(JSON.stringify(menuJson));

    const created = await restaurantMenuSnapshotService.createMenuSnapshot(RESTAURANT_ID, menuJson, hash, EXTERNAL_PARTY.OTTER);
    createdSnapshotIDs.push(created.id);

    const latest = await restaurantMenuSnapshotService.getLatestMenuSnapshot(RESTAURANT_ID, EXTERNAL_PARTY.OTTER);

    expect(latest).toBeTruthy();
    expect(latest.externalParty).toEqual(EXTERNAL_PARTY.OTTER);
    expect(latest.menuHash).toEqual(hash);
    expect(latest.menuJson).toEqual(menuJson);
  });

  it('returns the most recently written otter snapshot when multiple exist for the same restaurant', async () => {
    const olderMenuJson = buildMenuJson('otter-older');
    const olderHash = generateHash(JSON.stringify(olderMenuJson));
    const older = await restaurantMenuSnapshotService.createMenuSnapshot(RESTAURANT_ID, olderMenuJson, olderHash, EXTERNAL_PARTY.OTTER);
    createdSnapshotIDs.push(older.id);

    const newerMenuJson = buildMenuJson('otter-newer');
    const newerHash = generateHash(JSON.stringify(newerMenuJson));
    const newer = await restaurantMenuSnapshotService.createMenuSnapshot(RESTAURANT_ID, newerMenuJson, newerHash, EXTERNAL_PARTY.OTTER);
    createdSnapshotIDs.push(newer.id);

    const latest = await restaurantMenuSnapshotService.getLatestMenuSnapshot(RESTAURANT_ID, EXTERNAL_PARTY.OTTER);

    expect(latest.menuHash).toEqual(newerHash);
  });

  it('keeps otter and checkmate snapshots independent for the same restaurant', async () => {
    const otterMenuJson = buildMenuJson('otter-scoped');
    const otterHash = generateHash(JSON.stringify(otterMenuJson));
    const otterSnapshot = await restaurantMenuSnapshotService.createMenuSnapshot(RESTAURANT_ID, otterMenuJson, otterHash, EXTERNAL_PARTY.OTTER);
    createdSnapshotIDs.push(otterSnapshot.id);

    const checkmateMenuJson = buildMenuJson('checkmate-scoped');
    const checkmateHash = generateHash(JSON.stringify(checkmateMenuJson));
    const checkmateSnapshot = await restaurantMenuSnapshotService.createMenuSnapshot(
      RESTAURANT_ID,
      checkmateMenuJson,
      checkmateHash,
      EXTERNAL_PARTY.CHECKMATE,
    );
    createdSnapshotIDs.push(checkmateSnapshot.id);

    const latestOtter = await restaurantMenuSnapshotService.getLatestMenuSnapshot(RESTAURANT_ID, EXTERNAL_PARTY.OTTER);
    const latestCheckmate = await restaurantMenuSnapshotService.getLatestMenuSnapshot(RESTAURANT_ID, EXTERNAL_PARTY.CHECKMATE);

    expect(latestOtter.menuHash).toEqual(otterHash);
    expect(latestCheckmate.menuHash).toEqual(checkmateHash);
  });

  it('returns null for a restaurant with no snapshot yet for a given external_party', async () => {
    const NO_SNAPSHOT_RESTAURANT_ID = 999999;

    const result = await restaurantMenuSnapshotService.getLatestMenuSnapshot(NO_SNAPSHOT_RESTAURANT_ID, EXTERNAL_PARTY.OTTER);

    expect(result).toBeNull();
  });
});
