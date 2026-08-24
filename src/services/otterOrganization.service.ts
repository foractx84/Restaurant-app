import {
  createOtterStoreConnection,
  deleteOtterStoreConnection,
  getOtterStoreConnection,
  listOtterBrands,
  listOtterStoresForBrand,
} from '@/api/otter.api';
import { OtterOrganizationServiceInterface, OtterOrgStore } from '@interfaces/otter.interface';
import { logger } from '@utils/logger';

/**
 * Otter organization-domain API for store discovery and connection management.
 *
 * @see https://developer-guides.tryotter.com/docs/organization-integrations-onboarding-flow/
 */
class OtterOrganizationService implements OtterOrganizationServiceInterface {
  listSelectableStores = async (accessToken: string): Promise<Array<{ brandId: string; brandName: string; store: OtterOrgStore }>> => {
    const brandsPage = await listOtterBrands(accessToken);
    const brands = brandsPage.items ?? [];
    const selectable: Array<{ brandId: string; brandName: string; store: OtterOrgStore }> = [];

    for (const brand of brands) {
      const storesPage = await listOtterStoresForBrand(accessToken, brand.id);
      for (const store of storesPage.items ?? []) {
        selectable.push({ brandId: brand.id, brandName: brand.name, store });
      }
    }

    return selectable;
  };

  connectStore = async (accessToken: string, brandId: string, otterStoreId: string, partnerStoreId: string): Promise<void> => {
    const existing = await getOtterStoreConnection(accessToken, brandId, otterStoreId);

    if (existing?.storeId === partnerStoreId) {
      logger.debug(`Otter store ${otterStoreId} already connected to partner store ${partnerStoreId}`);
      return;
    }

    if (existing) {
      logger.info(`Replacing Otter connection for store ${otterStoreId} (was partner store ${existing.storeId})`);
      await deleteOtterStoreConnection(accessToken, brandId, otterStoreId);
    }

    await createOtterStoreConnection(accessToken, brandId, otterStoreId, partnerStoreId);
    logger.debug(`Created Otter connection for store ${otterStoreId} → partner store ${partnerStoreId}`);
  };
}

export default OtterOrganizationService;
