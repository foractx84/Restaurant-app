import { DiscoveryContentMetaTagsEntity } from '@/entities/discoveryContentMetaTags.entity';
import { EntityManager } from 'typeorm';

export interface DiscoveryContentMetaTagsServiceInterface {
  linkDiscoveryContentMetaTags: (
    discoveryContentMetaTags: DiscoveryContentMetaTagsEntity[],
    entityManager?: EntityManager,
    optionalDiscoveryContentIDToDelete?: number,
  ) => Promise<DiscoveryContentMetaTagsEntity[]>;
}

export interface DiscoveryContentMetaTagsModelInterface {
  deleteDiscoveryContentMetaTags: (discoveryContentID: number, conn: EntityManager) => Promise<void>;
  linkDiscoveryContentMetaTags: (
    discoveryContentMetaTags: DiscoveryContentMetaTagsEntity[],
    entityManager?: EntityManager,
  ) => Promise<DiscoveryContentMetaTagsEntity[]>;
}

export interface GetContentMetaTags {
  tag: string;
  metaTagID: number;
}
