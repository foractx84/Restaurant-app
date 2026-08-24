import { RestaurantImageTypeEntity } from '@/entities/restaurantImageType.entity';
import { RestaurantImageType } from '@/enums/restaurantImageType';

export interface RestaurantImageTypesServiceInterface {
  getAllRestaurantImageTypes: () => Promise<RestaurantImageTypeEntity[]>;
}

export interface RestaurantImageTypesModelInterface {
  getAllRestaurantImageTypes: () => Promise<RestaurantImageTypeEntity[]>;
}

export interface RestaurantImageTypesDBInterface {
  restaurant_image_type_id: number;
  type: RestaurantImageType;
  description: string;
}
