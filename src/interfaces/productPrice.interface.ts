import { EntityManager } from 'typeorm';
import { ProductPriceEntity } from '@/entities/productPrice.entity';

export interface ProductPriceServiceInterface {
  getProductPriceByStripePriceID: (stripePriceID: string) => Promise<ProductPriceEntity>;
}

export interface ProductPriceModelInterface {
  findProductPriceByStripePriceID: (stripePriceID: string, repository?: EntityManager) => Promise<ProductPriceEntity>;
}
