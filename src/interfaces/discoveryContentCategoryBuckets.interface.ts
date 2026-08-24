import { DiscoveryContentCategoryBucketsEntity } from '@/entities/discoveryContentBuckets.entity';
import { EntityManager } from 'typeorm';

export interface DiscoveryContentCategoryBucketsServiceInterface {
  linkDiscoveryContentCategoryBuckets: (
    discoveryContentID: number,
    discoveryContenCategoryBuckets: string[],
    entityManager?: EntityManager,
    optionalDiscoveryContentIDToDelete?: number,
  ) => Promise<DiscoveryContentCategoryBucketsEntity[]>;
}

export interface DiscoveryContentCategoryBucketsModelInterface {
  deleteDiscoveryContentCategoryBuckets: (discoveryContentID: number, conn: EntityManager) => Promise<void>;
  linkDiscoveryContentCategoryBuckets: (
    discoveryContenCategoryBuckets: DiscoveryContentCategoryBucketsEntity[],
    entityManager: EntityManager,
  ) => Promise<DiscoveryContentCategoryBucketsEntity[]>;
}

export interface GetContentCategoryBuckets {
  categoryName: string;
  categoryBucketID: number;
  categoryID: number;
}
