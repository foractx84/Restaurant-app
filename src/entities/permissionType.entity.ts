import { PermissionType } from '@/enums/permissionType';
import { PermissionTypeDBInterface } from '@/interfaces/permissionType.interface';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PermissionEntity } from './permission.entity';

@Entity({ name: 'permission_types' })
export class PermissionTypeEntity implements PermissionTypeDBInterface {
  @PrimaryGeneratedColumn()
  permission_type_id: number;

  @Column({
    type: 'enum',
    enum: PermissionType,
    nullable: false,
  })
  type: string;

  @Column('timestamp', {
    nullable: true,
  })
  created_at: string;

  @OneToMany(() => PermissionEntity, permission => permission.permission_type_id)
  permissions?: Array<PermissionEntity>;
}
