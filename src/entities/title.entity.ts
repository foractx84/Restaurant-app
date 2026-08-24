import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TitleDBInterface } from '@interfaces/titles.interface';
import { ManagerEntity } from './manager.entity';

@Entity({ name: 'position_title_types' })
export class TitleEntity implements TitleDBInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', {
    nullable: false,
    select: true,
  })
  name: string;

  @OneToMany(() => ManagerEntity, manager => manager.id)
  managers?: Array<ManagerEntity>;
}
