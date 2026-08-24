import { CountryEntity } from '@/entities/country.entity';
import { EntityManager } from 'typeorm';

export interface CountryServiceInterface {
  checkCountryExistsByName: (name: string) => Promise<CountryEntity>;
}

export interface CountryModelInterface {
  getCountryByCountryName: (name: string, repository?: EntityManager) => Promise<CountryEntity>;
}
