import { EntityManager } from 'typeorm';
import { RestaurantMenuSnapshotEntity } from '@entities/restaurantMenuSnapshot.entity';
import { NormalizedMenu } from '@interfaces/platformIntegration.interface';
import { ExternalParty } from '@constants/externalParty.constants';

export interface RestaurantMenuSnapshotDBInterface {
  id?: number;
  restaurant_id: number;
  menu_json: string | object;
  menu_hash: string;
  created_at?: string;
  updated_at?: string;
  external_party: ExternalParty;
}

export interface RestaurantMenuSnapshotInterface {
  id?: number;
  restaurantID: number;
  menuJson: NormalizedMenu[];
  menuHash: string;
  createdAt?: string;
  updatedAt?: string;
  externalParty: ExternalParty;
}

export interface RestaurantMenuSnapshotModelInterface {
  createMenuSnapshot: (snapshot: RestaurantMenuSnapshotEntity, repository?: EntityManager) => Promise<RestaurantMenuSnapshotEntity>;
  getLatestMenuSnapshotByRestaurantID: (
    restaurantID: number,
    externalParty?: ExternalParty,
    repository?: EntityManager,
  ) => Promise<RestaurantMenuSnapshotEntity | null>;
}

export interface RestaurantMenuSnapshotServiceInterface {
  createMenuSnapshot: (
    restaurantID: number,
    menuJson: object,
    menuHash: string,
    externalParty?: ExternalParty,
    manager?: EntityManager,
  ) => Promise<RestaurantMenuSnapshotInterface>;
  getLatestMenuSnapshot: (restaurantID: number, externalParty?: ExternalParty) => Promise<RestaurantMenuSnapshotInterface | null>;
}
