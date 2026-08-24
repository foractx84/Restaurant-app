import PlatformIntegrationModel from '@models/platformIntegration.model';
import { ormConnection } from '@utils/dbUtils';
import { PlatformIntegrationEntity } from '@entities/platformIntegration.entity';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));
jest.mock('@/utils/dbUtils', () => ({
  __esModule: true,
  ormConnection: jest.fn(),
}));

const platformIntegrationModel = new PlatformIntegrationModel();

describe('platformIntegrationModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('getAllConnectedPlatformIntegrations', () => {
    it('queries by externalParty with restaurantID and deletedAt excluded, and returns the rows', async () => {
      const rows = [
        new PlatformIntegrationEntity({ restaurantID: 1, accessToken: 'a', refreshToken: '', expiresIn: 1, externalParty: 'otter' }),
        new PlatformIntegrationEntity({ restaurantID: 2, accessToken: 'b', refreshToken: '', expiresIn: 1, externalParty: 'otter' }),
      ];
      const find = jest.fn().mockResolvedValue(rows);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValue({ find });

      const result = await platformIntegrationModel.getAllConnectedPlatformIntegrations('otter');

      expect(result).toEqual(rows);
      expect(find).toHaveBeenCalledWith(
        PlatformIntegrationEntity,
        expect.objectContaining({ where: expect.objectContaining({ externalParty: 'otter' }) }),
      );
    });

    it('throws a 500 HttpException when the query fails', async () => {
      const find = jest.fn().mockRejectedValue(new Error('db down'));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValue({ find });

      await expect(platformIntegrationModel.getAllConnectedPlatformIntegrations('otter')).rejects.toMatchObject({ status: 500 });
    });
  });
});
