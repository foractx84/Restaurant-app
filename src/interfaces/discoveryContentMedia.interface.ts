import { DiscoveryContentMediaEntity } from '@/entities/discoveryContentMedia.entity';
import { EntityManager } from 'typeorm';

export interface DiscoveryContentMediaServiceInterface {
  linkDiscoveryContentMedia: (
    discoveryContenMedia: DiscoveryContentMediaEntity[],
    entityManager?: EntityManager,
    deleteExisting?: boolean,
  ) => Promise<DiscoveryContentMediaEntity[]>;
}

export interface DiscoveryContentMediaModelInterface {
  deleteDiscoveryContentMedia: (discoveryContentID: number, conn: EntityManager) => Promise<void>;
  linkDiscoveryContentMedia: (
    discoveryContenMedia: DiscoveryContentMediaEntity[],
    entityManager?: EntityManager,
  ) => Promise<DiscoveryContentMediaEntity[]>;
}
