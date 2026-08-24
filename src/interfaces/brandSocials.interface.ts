import { BrandSocialsEntity } from '@/entities/brandSocials.entity';
import { EntityManager } from 'typeorm';

export interface BrandSocialsServiceInterface {
  createBrandSocials: (brandSocials: BrandSocialsInterface, repository?: EntityManager) => Promise<BrandSocialsEntity>;
  getBrandSocialsByBrandID: (brandID: string, repository?: EntityManager) => Promise<BrandSocialsInterface>;
  updateBrandSocials: (brandSocials: BrandSocialsInterface, repository?: EntityManager) => Promise<void>;
}

export interface BrandSocialsModelInterface {
  getBrandSocialsByBrandID: (brandID: string, repository?: EntityManager) => Promise<BrandSocialsEntity>;
  insertBrandSocials: (brandSocials: BrandSocialsDBInterface, repository?: EntityManager) => Promise<BrandSocialsEntity>;
  updateBrandSocials: (brandSocials: BrandSocialsDBInterface, repository?: EntityManager) => Promise<void>;
}

export interface BrandSocialsDBInterface {
  brand_socials_id?: number;
  brand_id?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  snapchat?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BrandSocialsInterface {
  brandSocialsID?: number;
  brandID?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  snapchat?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandSocialsRequestInterface {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  snapchat?: string;
}
