import { SpecialUserDBInterface } from '@/interfaces/users.interface';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'special_users' })
export class SpecialUserEntity implements SpecialUserDBInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  account_type: string;

  @Column('text')
  meta_user_type: string;

  @Column('timestamp', {
    nullable: false,
  })
  date_created: string;

  @Column('text', {
    nullable: false,
  })
  first_name: string;

  @Column('text', {
    nullable: false,
  })
  last_name: string;

  @Column('text', {
    nullable: false,
  })
  email: string;

  @Column('text', {
    nullable: false,
  })
  phone: string;

  @Column('text', {
    nullable: false,
  })
  pwd: string;

  @Column('boolean', {
    nullable: false,
  })
  approved: boolean;
}
