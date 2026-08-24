import { MenuDisclaimerDBInterface } from '@/interfaces/disclaimers.interface';
import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm';

import { MenuDisclaimerTypeEntity } from './disclaimerType.entity';
import { MenuEntity } from './menus.entity';

@Entity({ name: 'menu_messages' })
export class MenuDisclaimerEntity implements MenuDisclaimerDBInterface {
  @PrimaryGeneratedColumn()
  message_id: number;

  @Column('int4', {
    nullable: false,
  })
  @ManyToOne(() => MenuEntity, menus => menus.menu_id)
  @JoinColumn({ name: 'menu_id', referencedColumnName: 'menu_id' })
  menu_id: number;

  @Column('text', {
    nullable: false,
    select: true,
  })
  message: string;

  @Column('int4', {
    select: true,
    nullable: false,
  })
  @ManyToOne(() => MenuDisclaimerTypeEntity, menuDisclaimerType => menuDisclaimerType.message_type_id, {
    cascade: ['insert'],
    nullable: false,
  })
  @JoinColumn({ name: 'message_type_id', referencedColumnName: 'message_type_id' })
  message_type_id: number;
}
