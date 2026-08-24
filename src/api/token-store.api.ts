import { Pool } from 'pg';
import { PlatformIntegrationServiceInterface } from '@interfaces/platformIntegration.interface';
import { PlatformIntegrationEntity } from '@entities/platformIntegration.entity';
import { logger } from '@utils/logger';

const EXPIRY_BUFFER_MS = 60_000;

const advisoryLockKey = (locationId: number, externalParty: string): number => {
  const str = `${locationId}:${externalParty}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

class TokenStore {
  private cache: PlatformIntegrationEntity | null = null;

  constructor(
    private platformIntegrationService: PlatformIntegrationServiceInterface,
    private readonly pool: Pool,
    private readonly locationID: number,
    private readonly platform: string,
  ) {}

  get = async (): Promise<PlatformIntegrationEntity | null> => {
    if (!this.cache) {
      logger.debug(`Retrieving platform integration for location ${this.locationID}.`);
      this.cache = await this.platformIntegrationService.getPlatformIntegrationByLocationIDAndPlatform(this.locationID, this.platform);
    }
    return this.cache;
  };

  set = async (tokens: { integration: PlatformIntegrationEntity; accessToken: string; refreshToken: string; expiresIn: number }): Promise<void> => {
    const { integration, accessToken, refreshToken, expiresIn } = tokens;
    await this.platformIntegrationService.updatePlatformIntegration(integration, accessToken, refreshToken, expiresIn);
    this.cache = null; // bust so next get() reads the fresh record
  };

  bustCache = (): void => {
    this.cache = null;
  };

  isExpiredOrStale = async (): Promise<boolean> => {
    const record = await this.get();
    if (!record) return true;
    return Date.now() >= record.expiresAt.getTime() - EXPIRY_BUFFER_MS;
  };

  getAccessToken = async (): Promise<string | null> => {
    return (await this.get())?.accessToken ?? null;
  };

  getPlatformIntegration = async (): Promise<PlatformIntegrationEntity | null> => {
    return (await this.get()) ?? null;
  };

  getRefreshToken = async (): Promise<string | null> => {
    return (await this.get())?.refreshToken ?? null;
  };

  acquireAdvisoryLock = async (): Promise<{ acquired: boolean; release: () => Promise<void> }> => {
    const key = advisoryLockKey(this.locationID, this.platform);
    const pgClient = await this.pool.connect();

    logger.debug(`Acquiring advisory lock for key ${advisoryLockKey}.`);

    const { rows } = await pgClient.query<{ acquired: boolean }>('SELECT pg_try_advisory_lock($1) AS acquired', [key]);

    return {
      acquired: rows[0]?.acquired,
      release: async () => {
        await pgClient.query('SELECT pg_advisory_unlock($1)', [key]);
        pgClient.release();
      },
    };
  };
}

export default TokenStore;
