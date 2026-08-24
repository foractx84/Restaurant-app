import { PackagePermissionDBInterface } from '@/interfaces/packagePermission.interface';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PackageEntity } from './packageEntity.entity';
import { PermissionEntity } from './permission.entity';

@Entity({ name: 'package_permissions' })
export class PackagePermissionEntity implements PackagePermissionDBInterface {
  @PrimaryGeneratedColumn()
  package_permission_id: number;

  @Column('int4', {
    nullable: false,
  })
  @ManyToOne(() => PackageEntity, single_package => single_package.package_id, {
    nullable: false,
  })
  @JoinColumn({ name: 'package_id', referencedColumnName: 'package_id' })
  package_id?: number;

  @Column('int4', {
    nullable: false,
  })
  @ManyToOne(() => PermissionEntity, permission => permission.permission_id, {
    nullable: false,
  })
  @JoinColumn({ name: 'permission_id', referencedColumnName: 'permission_id' })
  permission_id: number;

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
