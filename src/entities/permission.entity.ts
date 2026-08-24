import { PermissionDBInterface } from '@/interfaces/permission.interface';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PermissionTypeEntity } from './permissionType.entity';

@Entity({ name: 'feature_permissions' })
export class PermissionEntity implements PermissionDBInterface {
  @PrimaryGeneratedColumn()
  permission_id: number;

  @Column('text', {
    nullable: false,
  })
  name: string;

  @Column('text', {
    nullable: false,
  })
  description: string;

  @Column('text', {
    nullable: false,
  })
  code: string;

  @Column('int4', {
    nullable: false,
  })
  @ManyToOne(() => PermissionTypeEntity, permission_type => permission_type.permission_type_id, {
    nullable: false,
  })
  @JoinColumn({ name: 'permission_type_id', referencedColumnName: 'permission_type_id' })
  permission_type_id?: number;

  @Column('boolean', {
    nullable: true,
  })
  is_super: boolean;

  @Column('timestamp', {
    nullable: true,
  })
  created_at: string;

  @Column('timestamp', {
    nullable: true,
  })
  updated_at: string;

  @Column('timestamp', {
    nullable: true,
  })
  deleted_at: string;
}
