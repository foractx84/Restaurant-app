import { DiscoveryContentCategoriesEntity } from '@/entities/discoveryContentCategories.entity';
import { EntityManager } from 'typeorm';

export interface DiscoveryContentCategoriesServiceInterface {
  getAllCategories: (entityManager?: EntityManager) => Promise<DiscoveryContentCategoriesEntity[]>;
}

export interface DiscoveryContentCategoriesModelInterface {
  getAllCategories: (entityManager?: EntityManager) => Promise<DiscoveryContentCategoriesEntity[]>;
}
