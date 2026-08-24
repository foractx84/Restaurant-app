import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn } from 'typeorm';
import { RestaurantAddressEntity } from './restaurantAddress.entity';

@Entity({ name: 'countries' })
export class CountryEntity {
  @PrimaryGeneratedColumn()
  country_id: number;

  @OneToMany(() => RestaurantAddressEntity, address => address.country_id)
  @JoinColumn({ name: 'country_id', referencedColumnName: 'country_id' })
  addresses?: Array<RestaurantAddressEntity>;

  @Column('text', {
    nullable: false,
    unique: true,
  })
  name: string;

  @Column('text', {
    nullable: false,
    default: 'US',
  })
  abbreviation: string;

  @Column('text', {
    nullable: false,
    default: 'USD',
  })
  currency_code: string;
}
