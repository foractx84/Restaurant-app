import { SpecialUserEntity } from '@entities/special_user.entity';
import { AuthModelsInterface } from '@interfaces/auth.interface';
import { UserDBInterface, ManagerRestaurantsDBInterface } from '@interfaces/users.interface';
import { ormConnection, rawQuery } from '@utils/dbUtils';
import { EntityManager, ILike } from 'typeorm';

class UsersModel implements AuthModelsInterface {
  getManager = async (email: string): Promise<UserDBInterface> => {
    const managerQuery = `SELECT * FROM manager_external_users WHERE email ILIKE :email`;
    const results = await rawQuery<UserDBInterface[]>(managerQuery, { email });
    return results[0];
  };

  getSuperUser = async (email: string, repository?: EntityManager): Promise<SpecialUserEntity> => {
    if (!repository) {
      repository = await ormConnection();
    }
    return repository.findOne(SpecialUserEntity, { email: ILike(`${email}`) });
  };

  validateManagerAuthorized = async (managerID: number, restaurantID: number): Promise<boolean> => {
    const validateManagerQuery = `SELECT * FROM manager_restaurants WHERE external_user_id = :managerID AND restaurant_id = :restaurantID`;
    const results = await rawQuery<ManagerRestaurantsDBInterface[]>(validateManagerQuery, { managerID, restaurantID });
    return results.length > 0;
  };

  findSuperUserByID = async (id: number, repository?: EntityManager) => {
    if (!repository) {
      repository = await ormConnection();
    }
    return repository.findOne(SpecialUserEntity, { id: id });
  };
}

export default UsersModel;
