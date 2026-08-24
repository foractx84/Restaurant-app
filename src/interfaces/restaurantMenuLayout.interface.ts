export interface RestaurantMenuLayoutDBInterface {
  id?: number;
  created_at?: string;
  updated_at?: string;
  menu_layout_id: number;
  restaurant_id: number;
}

export interface RestaurantMenuLayoutInterface {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  menuLayoutID: number;
  restaurantID: number;
}

export interface GetRestaurantMenuLayoutInterface {
  layoutID: number;
  name: string;
}
