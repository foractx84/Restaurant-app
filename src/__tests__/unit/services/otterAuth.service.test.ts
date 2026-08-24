import OtterAuthService from '@/services/otterAuth.service';
import { fetchOtterToken } from '@/api/otter.api';
import { PlatformIntegrationServiceInterface } from '@interfaces/platformIntegration.interface';
import { PlatformIntegrationEntity } from '@entities/platformIntegration.entity';
import { logger } from '@utils/logger';

const mockAcquireAdvisoryLock = jest.fn();
const mockBustCache = jest.fn();
const mockIsExpiredOrStale = jest.fn();
const mockGetAccessToken = jest.fn();
const mockGetPlatformIntegration = jest.fn();
const mockSet = jest.fn();

jest.mock('@/api/token-store.api', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    acquireAdvisoryLock: mockAcquireAdvisoryLock,
    bustCache: mockBustCache,
    isExpiredOrStale: mockIsExpiredOrStale,
    getAccessToken: mockGetAccessToken,
    getPlatformIntegration: mockGetPlatformIntegration,
    set: mockSet,
  })),
}));

jest.mock('@/api/otter.api', () => ({
  fetchOtterToken: jest.fn(),
}));

jest.mock('@databases', () => ({
  pool: {},
}));

jest.mock('@utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockPlatformIntegrationService: PlatformIntegrationServiceInterface = {
  createPlatformIntegration: jest.fn(),
  updatePlatformIntegration: jest.fn(),
  getPlatformIntegrationByLocationIDAndPlatform: jest.fn(),
  getPlatformIntegrationByStoreIDAndPlatform: jest.fn(),
  getPlatformIntegrationByRestaurantIDAndPlatform: jest.fn(),
  getAllConnectedPlatformIntegrations: jest.fn(),
};

const TOKEN_RESPONSE = {
  access_token: 'otter-access-token',
  expires_in: 2627999,
  scope: 'ping',
  token_type: 'bearer',
};

const createIntegration = (overrides: Partial<PlatformIntegrationEntity> = {}): PlatformIntegrationEntity => {
  const integration = new PlatformIntegrationEntity({
    restaurantID: null,
    accessToken: 'existing-token',
    refreshToken: '',
    expiresIn: 3600,
    externalParty: 'otter',
    locationID: 0,
  });
  integration.platformID = 1;
  return Object.assign(integration, overrides);
};

describe('OtterAuthService', () => {
  let service: OtterAuthService;
  const mockRelease = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAcquireAdvisoryLock.mockResolvedValue({ acquired: true, release: mockRelease });
    service = new OtterAuthService(mockPlatformIntegrationService);
  });

  describe('getValidAccessToken', () => {
    it('returns cached token when not expired', async () => {
      mockIsExpiredOrStale.mockResolvedValueOnce(false);
      mockGetAccessToken.mockResolvedValueOnce('cached-token');

      const token = await service.getValidAccessToken();

      expect(token).toBe('cached-token');
      expect(fetchOtterToken).not.toHaveBeenCalled();
      expect(mockAcquireAdvisoryLock).not.toHaveBeenCalled();
    });

    it('acquires a new token when cached token is expired', async () => {
      mockIsExpiredOrStale.mockResolvedValueOnce(true);
      mockBustCache.mockImplementation(() => undefined);
      mockIsExpiredOrStale.mockResolvedValueOnce(true);
      mockGetPlatformIntegration.mockResolvedValueOnce(null);
      (fetchOtterToken as jest.Mock).mockResolvedValueOnce(TOKEN_RESPONSE);
      (mockPlatformIntegrationService.createPlatformIntegration as jest.Mock).mockResolvedValueOnce(createIntegration());

      const token = await service.getValidAccessToken();

      expect(token).toBe('otter-access-token');
      expect(fetchOtterToken).toHaveBeenCalledTimes(1);
      expect(mockPlatformIntegrationService.createPlatformIntegration).toHaveBeenCalledWith(null, 'otter-access-token', '', 2627999, 'otter', 0);
    });
  });

  describe('acquireAndStoreToken', () => {
    it('creates a new platform integration when none exists', async () => {
      mockBustCache.mockImplementation(() => undefined);
      mockIsExpiredOrStale.mockResolvedValueOnce(true);
      mockGetPlatformIntegration.mockResolvedValueOnce(null);
      (fetchOtterToken as jest.Mock).mockResolvedValueOnce(TOKEN_RESPONSE);
      (mockPlatformIntegrationService.createPlatformIntegration as jest.Mock).mockResolvedValueOnce(createIntegration());

      const token = await service.acquireAndStoreToken();

      expect(token).toBe('otter-access-token');
      expect(mockPlatformIntegrationService.createPlatformIntegration).toHaveBeenCalledWith(null, 'otter-access-token', '', 2627999, 'otter', 0);
      expect(mockSet).not.toHaveBeenCalled();
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    it('updates an existing platform integration', async () => {
      const existing = createIntegration();
      mockBustCache.mockImplementation(() => undefined);
      mockIsExpiredOrStale.mockResolvedValueOnce(true);
      mockGetPlatformIntegration.mockResolvedValueOnce(existing);
      (fetchOtterToken as jest.Mock).mockResolvedValueOnce(TOKEN_RESPONSE);
      mockSet.mockResolvedValueOnce(undefined);

      const token = await service.acquireAndStoreToken();

      expect(token).toBe('otter-access-token');
      expect(mockSet).toHaveBeenCalledWith({
        integration: existing,
        accessToken: 'otter-access-token',
        refreshToken: '',
        expiresIn: 2627999,
      });
      expect(mockPlatformIntegrationService.createPlatformIntegration).not.toHaveBeenCalled();
    });

    it('returns cached token when advisory lock is not acquired', async () => {
      mockAcquireAdvisoryLock.mockResolvedValueOnce({ acquired: false, release: mockRelease });
      mockGetAccessToken.mockResolvedValueOnce('token-from-peer');

      const token = await service.acquireAndStoreToken();

      expect(token).toBe('token-from-peer');
      expect(fetchOtterToken).not.toHaveBeenCalled();
      expect(mockBustCache).toHaveBeenCalled();
    });

    it('returns cached token when another process refreshed while waiting for lock', async () => {
      mockBustCache.mockImplementation(() => undefined);
      mockIsExpiredOrStale.mockResolvedValueOnce(false);
      mockGetAccessToken.mockResolvedValueOnce('fresh-token');

      const token = await service.acquireAndStoreToken();

      expect(token).toBe('fresh-token');
      expect(fetchOtterToken).not.toHaveBeenCalled();
    });

    it('throws when lock is not acquired and no token is available', async () => {
      mockAcquireAdvisoryLock.mockResolvedValueOnce({ acquired: false, release: mockRelease });
      mockGetAccessToken.mockResolvedValueOnce(null);

      await expect(service.acquireAndStoreToken()).rejects.toThrow('Otter token unavailable after waiting for lock');
    });

    it('propagates auth failures from fetchOtterToken', async () => {
      const authError = new Error('Unauthorized');
      mockBustCache.mockImplementation(() => undefined);
      mockIsExpiredOrStale.mockResolvedValueOnce(true);
      (fetchOtterToken as jest.Mock).mockRejectedValueOnce(authError);

      await expect(service.acquireAndStoreToken()).rejects.toThrow('Unauthorized');
      expect(logger.error).not.toHaveBeenCalled();
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    it('uses custom location and restaurant IDs from constructor', async () => {
      const customService = new OtterAuthService(mockPlatformIntegrationService, 99, 42);
      mockBustCache.mockImplementation(() => undefined);
      mockIsExpiredOrStale.mockResolvedValueOnce(true);
      mockGetPlatformIntegration.mockResolvedValueOnce(null);
      (fetchOtterToken as jest.Mock).mockResolvedValueOnce(TOKEN_RESPONSE);
      (mockPlatformIntegrationService.createPlatformIntegration as jest.Mock).mockResolvedValueOnce(
        createIntegration({ locationID: 99, restaurantID: 42 }),
      );

      await customService.acquireAndStoreToken();

      expect(mockPlatformIntegrationService.createPlatformIntegration).toHaveBeenCalledWith(42, 'otter-access-token', '', 2627999, 'otter', 99);
    });
  });
});
