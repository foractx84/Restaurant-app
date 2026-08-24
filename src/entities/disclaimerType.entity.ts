import { MenuDisclaimer } from '@/enums/menuDisclaimer';
import { MenuMessageTypeDBInterface } from '@interfaces/disclaimerTypes.interface';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn } from 'typeorm';

import { MenuDisclaimerEntity } from './disclaimer.entity';

@Entity({ name: 'menu_messages_types' })
export class MenuDisclaimerTypeEntity implements MenuMessageTypeDBInterface {
  @PrimaryGeneratedColumn()
  @OneToMany(() => MenuDisclaimerEntity, menuDisclaimer => menuDisclaimer.message_type_id)
  @JoinColumn({ name: 'message_type_id', referencedColumnName: 'message_type_id' })
  message_type_id: number;

  @Column({
    type: 'enum',
    enum: MenuDisclaimer,
    nullable: false,
    select: true,
  })
  name: MenuDisclaimer;
}
