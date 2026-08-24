export interface PermissionDBInterface {
  permission_id: number;
  name: string;
  description: string;
  code: string;
  permission_type_id?: number;
  is_super: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}
