import { Pool } from 'pg';

/**
 * Hashes an arbitrary string key down to the int4 range `pg_advisory_lock` expects. Same approach as
 * `TokenStore`'s internal advisory lock in `token-store.api.ts`, generalized to a string key so
 * callers aren't limited to a numeric (Checkmate-style) location id.
 */
const advisoryLockKey = (key: string): number => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (Math.imul(31, hash) + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

/**
 * Attempts to acquire a session-level Postgres advisory lock scoped to `key`. Used to serialize
 * concurrent syncs for the same external resource (e.g. an Otter store) so two overlapping webhook
 * events can't both pass a queue's dedup check and run at once.
 *
 * @returns `acquired: false` if another holder already has the lock — the caller should skip its
 *   work rather than block, since a concurrent sync for the same key is already in flight and will
 *   produce the same end state. Always call `release()` when done if `acquired` is `true`.
 */
export const acquireAdvisoryLock = async (pool: Pool, key: string): Promise<{ acquired: boolean; release: () => Promise<void> }> => {
  const lockKey = advisoryLockKey(key);
  const pgClient = await pool.connect();

  const { rows } = await pgClient.query<{ acquired: boolean }>('SELECT pg_try_advisory_lock($1) AS acquired', [lockKey]);

  return {
    acquired: rows[0]?.acquired,
    release: async () => {
      await pgClient.query('SELECT pg_advisory_unlock($1)', [lockKey]);
      pgClient.release();
    },
  };
};
