import OtterOrganizationService from '@/services/otterOrganization.service';
import {
  createOtterStoreConnection,
  deleteOtterStoreConnection,
  getOtterStoreConnection,
  listOtterBrands,
  listOtterStoresForBrand,
} from '@/api/otter.api';

jest.mock('@/api/otter.api', () => ({
  listOtterBrands: jest.fn(),
  listOtterStoresForBrand: jest.fn(),
  getOtterStoreConnection: jest.fn(),
  createOtterStoreConnection: jest.fn(),
  deleteOtterStoreConnection: jest.fn(),
}));

jest.mock('@utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('OtterOrganizationService', () => {
  const service = new OtterOrganizationService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listSelectableStores', () => {
    it('flattens brands and stores into selectable rows', async () => {
      (listOtterBrands as jest.Mock).mockResolvedValue({
        items: [
          { id: 'brand-1', name: 'Brand One' },
          { id: 'brand-2', name: 'Brand Two' },
        ],
      });
      (listOtterStoresForBrand as jest.Mock).mockImplementation(async (_token: string, brandId: string) => {
        if (brandId === 'brand-1') {
          return { items: [{ id: 'store-a', name: 'Store A', address: { fullAddress: '1 Main St' } }] };
        }
        return { items: [{ id: 'store-b', name: 'Store B', address: { fullAddress: '2 Main St' } }] };
      });

      const rows = await service.listSelectableStores('token');

      expect(rows).toEqual([
        { brandId: 'brand-1', brandName: 'Brand One', store: expect.objectContaining({ id: 'store-a' }) },
        { brandId: 'brand-2', brandName: 'Brand Two', store: expect.objectContaining({ id: 'store-b' }) },
      ]);
    });
  });

  describe('connectStore', () => {
    it('creates a connection when none exists', async () => {
      (getOtterStoreConnection as jest.Mock).mockResolvedValue(null);
      (createOtterStoreConnection as jest.Mock).mockResolvedValue(undefined);

      await service.connectStore('token', 'brand-1', 'otter-store', '42');

      expect(createOtterStoreConnection).toHaveBeenCalledWith('token', 'brand-1', 'otter-store', '42');
      expect(deleteOtterStoreConnection).not.toHaveBeenCalled();
    });

    it('no-ops when the same partner storeId is already connected', async () => {
      (getOtterStoreConnection as jest.Mock).mockResolvedValue({ storeId: '42' });

      await service.connectStore('token', 'brand-1', 'otter-store', '42');

      expect(createOtterStoreConnection).not.toHaveBeenCalled();
      expect(deleteOtterStoreConnection).not.toHaveBeenCalled();
    });

    it('replaces an existing connection when the partner storeId differs', async () => {
      (getOtterStoreConnection as jest.Mock).mockResolvedValue({ storeId: '99' });
      (deleteOtterStoreConnection as jest.Mock).mockResolvedValue(undefined);
      (createOtterStoreConnection as jest.Mock).mockResolvedValue(undefined);

      await service.connectStore('token', 'brand-1', 'otter-store', '42');

      expect(deleteOtterStoreConnection).toHaveBeenCalledWith('token', 'brand-1', 'otter-store');
      expect(createOtterStoreConnection).toHaveBeenCalledWith('token', 'brand-1', 'otter-store', '42');
    });
  });
});
