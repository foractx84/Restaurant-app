import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantEntity } from './restaurant.entity';
import { RestaurantUserEmailsDBInterface, RestaurantUserEmailsResponseInterface } from '@interfaces/restaurantUserEmails.interface';

@Entity({ name: 'restaurant_user_emails' })
export class RestaurantUserEmailEntity implements RestaurantUserEmailsDBInterface {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', {
    nullable: false,
  })
  email: string;

  @Column('text', {
    nullable: false,
  })
  restaurant_url_id: string;

  /**
   * ID of user tied to email, not building relation since user info not needed
   */
  @Column('int4', {
    nullable: true,
  })
  user_id?: number;

  @Column('timestamp', {
    select: true,
    nullable: false,
  })
  created_at?: string;

  @ManyToOne(() => RestaurantEntity, restaurant => restaurant.restaurant_user_emails, {
    nullable: false,
  })
  @JoinColumn({
    name: 'restaurant_url_id',
    referencedColumnName: 'restaurant_url_id',
  })
  restaurant?: RestaurantEntity;

  constructor(email: string, restaurantUrlID: string, id?: number, createdAt?: string, userID?: number) {
    this.email = email;
    this.restaurant_url_id = restaurantUrlID;
    this.created_at = createdAt || null;
    this.user_id = userID || null;

    if (id) {
      this.id = id;
    }
  }

  public toResponse? = (): RestaurantUserEmailsResponseInterface => ({
    id: this.id,
    email: this.email,
    createdAt: this.created_at,
    userID: this.user_id ?? null,
  });
}
