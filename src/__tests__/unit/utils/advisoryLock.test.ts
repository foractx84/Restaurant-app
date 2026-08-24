import { Pool } from 'pg';
import { acquireAdvisoryLock } from '@utils/advisoryLock';

describe('acquireAdvisoryLock', () => {
  const makeMockClient = (acquired: boolean) => ({
    query: jest.fn().mockResolvedValue({ rows: [{ acquired }] }),
    release: jest.fn(),
  });

  const makePool = (client: ReturnType<typeof makeMockClient>) =>
    ({
      connect: jest.fn().mockResolvedValue(client),
    } as unknown as Pool);

  it('reports acquired:true and calls pg_try_advisory_lock with a deterministic int4 key', async () => {
    const client = makeMockClient(true);
    const pool = makePool(client);

    const lock = await acquireAdvisoryLock(pool, 'otter-menu-sync:store-1');

    expect(lock.acquired).toBe(true);
    expect(client.query).toHaveBeenCalledWith('SELECT pg_try_advisory_lock($1) AS acquired', [expect.any(Number)]);
    const [, [lockKey]] = client.query.mock.calls[0];
    expect(Number.isInteger(lockKey)).toBe(true);
    expect(lockKey).toBeGreaterThanOrEqual(0);
  });

  it('hashes the same key to the same lock id across calls', async () => {
    const clientA = makeMockClient(true);
    const clientB = makeMockClient(true);

    await acquireAdvisoryLock(makePool(clientA), 'otter-menu-sync:store-1');
    await acquireAdvisoryLock(makePool(clientB), 'otter-menu-sync:store-1');

    expect(clientA.query.mock.calls[0][1]).toEqual(clientB.query.mock.calls[0][1]);
  });

  it('hashes different keys to different lock ids', async () => {
    const clientA = makeMockClient(true);
    const clientB = makeMockClient(true);

    await acquireAdvisoryLock(makePool(clientA), 'otter-menu-sync:store-1');
    await acquireAdvisoryLock(makePool(clientB), 'otter-menu-sync:store-2');

    expect(clientA.query.mock.calls[0][1]).not.toEqual(clientB.query.mock.calls[0][1]);
  });

  it('reports acquired:false when the lock is already held', async () => {
    const client = makeMockClient(false);
    const lock = await acquireAdvisoryLock(makePool(client), 'otter-menu-sync:store-1');

    expect(lock.acquired).toBe(false);
  });

  it('release() unlocks and releases the client back to the pool', async () => {
    const client = makeMockClient(true);
    const lock = await acquireAdvisoryLock(makePool(client), 'otter-menu-sync:store-1');

    await lock.release();

    expect(client.query).toHaveBeenCalledWith('SELECT pg_advisory_unlock($1)', [expect.any(Number)]);
    expect(client.release).toHaveBeenCalled();
  });
});
