import { RestaurantTypographyEntity } from '@/entities/restaurantTypography.entity';
import { ormConnection } from '@/utils/dbUtils';
import { EntityManager } from 'typeorm';

class RestaurantTypographyModel {
  findByRestaurantId = async (restaurantID: number, repository?: EntityManager): Promise<RestaurantTypographyEntity | undefined> => {
    const em = repository ?? (await ormConnection());
    const rows = await em.find(RestaurantTypographyEntity, { where: { restaurant_id: restaurantID } });
    return rows[0];
  };

  save = async (entity: RestaurantTypographyEntity, repository?: EntityManager): Promise<RestaurantTypographyEntity> => {
    const em = repository ?? (await ormConnection());
    return em.save(RestaurantTypographyEntity, entity);
  };
}

export default RestaurantTypographyModel;
