import { ManagerPackageDBInterface } from '@/interfaces/managerPackage.interface';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ManagerEntity } from './manager.entity';
import { PackageEntity } from './packageEntity.entity';

@Entity({ name: 'manager_packages' })
export class ManagerPackageEntity implements ManagerPackageDBInterface {
  @PrimaryGeneratedColumn()
  manager_package_id?: number;

  @Column('int4', {
    nullable: false,
  })
  @ManyToOne(() => ManagerEntity, manager => manager.id, {
    nullable: false,
  })
  @JoinColumn({ name: 'external_user_id', referencedColumnName: 'id' })
  external_user_id?: number;

  @Column('int4', {
    nullable: false,
  })
  @ManyToOne(() => PackageEntity, packages => packages.package_id, {
    nullable: false,
  })
  @JoinColumn({ name: 'package_id', referencedColumnName: 'package_id' })
  package_id: number;

  @Column('timestamp without time zone', {
    nullable: true,
  })
  created_at?: string;

  @Column('timestamp without time zone', {
    nullable: true,
  })
  updated_at?: string;

  @Column('timestamp without time zone', {
    nullable: true,
  })
  deleted_at?: string;

  @Column('timestamp without time zone', {
    nullable: true,
  })
  assigned_at?: string;
}
