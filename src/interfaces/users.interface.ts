export interface UserInterface {
  email: string;
  password: string;
}

export interface UserDBInterface {
  id: number;
  pwd: string;
  approved: boolean;
  verified_at?: string;
}
export interface ManagerRestaurantsDBInterface {
  id: number;
  external_user_id: number;
  restaurant_id: number;
}

export interface SpecialUserDBInterface {
  id: number;
  account_type: string;
  meta_user_type: string;
  date_created: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  pwd: string;
  approved: boolean;
}
