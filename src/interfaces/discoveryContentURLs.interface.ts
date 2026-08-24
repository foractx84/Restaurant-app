import { CreateDiscoveryContentUrlsDto } from '@/dtos/discoveryContentUrls.dto';
import { DiscoveryContentURLsEntity } from '@/entities/discoveryContentURLs.entity';
import { PlatformENUMS, PlatformUrlTypeENUMS } from '@/enums/discoveryURLPlatforms';
import { EntityManager } from 'typeorm';

export interface DiscoveryContentURLsServiceInterface {
  linkDiscoveryContentURLs: (
    discoveryContentID: number,
    discoveryContenURLs: CreateDiscoveryContentUrlsDto[] | DiscoveryContentURLsEntity[],
    entityManager?: EntityManager,
    deleteExisting?: boolean,
  ) => Promise<DiscoveryContentURLsEntity[]>;
}

export interface DiscoveryContentURLsModelInterface {
  deleteDiscoveryContentURLs: (discoveryContentID: number, conn: EntityManager) => Promise<void>;
  linkDiscoveryContentURLs: (
    discoveryContenURLs: DiscoveryContentURLsEntity[],
    entityManager?: EntityManager,
  ) => Promise<DiscoveryContentURLsEntity[]>;
}

export interface GetContentReservationURLSInterface {
  reservations: GetContentReservationOrderingInterface[];
  ordering: GetContentReservationOrderingInterface[];
}

export interface GetContentReservationOrderingInterface {
  urlID: number;
  url: string;
  platform: PlatformENUMS;
  type: PlatformUrlTypeENUMS;
}
