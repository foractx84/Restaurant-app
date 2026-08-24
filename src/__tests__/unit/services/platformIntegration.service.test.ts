import PlatformIntegrationService from '@services/platformIntegration.service';
import { PlatformIntegrationModelInterface } from '@interfaces/platformIntegration.interface';
import { PlatformIntegrationEntity } from '@entities/platformIntegration.entity';

jest.mock('@utils/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

describe('PlatformIntegrationService', () => {
  const mockModel: PlatformIntegrationModelInterface = {
    upsertPlatformIntegration: jest.fn(),
    getPlatformIntegrationByLocationIDAndPlatform: jest.fn(),
    getPlatformIntegrationByStoreIDAndPlatform: jest.fn(),
    getPlatformIntegrationByRestaurantIDAndPlatform: jest.fn(),
    getAllConnectedPlatformIntegrations: jest.fn(),
  };

  let service: PlatformIntegrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlatformIntegrationService(mockModel);
  });

  describe('getAllConnectedPlatformIntegrations', () => {
    it('passes through the model result', async () => {
      const rows = [new PlatformIntegrationEntity({ restaurantID: 1, accessToken: 'a', refreshToken: '', expiresIn: 1, externalParty: 'otter' })];
      (mockModel.getAllConnectedPlatformIntegrations as jest.Mock).mockResolvedValue(rows);

      const result = await service.getAllConnectedPlatformIntegrations('otter');

      expect(result).toBe(rows);
      expect(mockModel.getAllConnectedPlatformIntegrations).toHaveBeenCalledWith('otter');
    });

    it('wraps a model failure in a 500 HttpException', async () => {
      (mockModel.getAllConnectedPlatformIntegrations as jest.Mock).mockRejectedValue(new Error('db down'));

      await expect(service.getAllConnectedPlatformIntegrations('otter')).rejects.toMatchObject({ status: 500 });
    });
  });
});
