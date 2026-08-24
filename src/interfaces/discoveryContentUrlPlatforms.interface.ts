import { DiscoveryContentCategoriesEntity } from '@/entities/discoveryContentCategories.entity';
import { DiscoveryContentUrlPlatformsEntity } from '@/entities/discoveryContentURLPlattforms.entity';
import { EntityManager } from 'typeorm';

export interface DiscoveryContentUrlPlatformsServiceInterface {
  getAllPlatforms: (entityManager?: EntityManager) => Promise<DiscoveryContentUrlPlatformsEntity[]>;
}

export interface DiscoveryContentUrlPlatformsModelInterface {
  getAllPlatforms: (entityManager?: EntityManager) => Promise<DiscoveryContentUrlPlatformsEntity[]>;
}
