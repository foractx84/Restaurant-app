import { EntityManager, FindOneOptions } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { RestaurantMenuSnapshotModelInterface } from '@interfaces/restaurantMenuSnapshot.interface';
import { RestaurantMenuSnapshotEntity } from '@entities/restaurantMenuSnapshot.entity';
import { EXTERNAL_PARTY, ExternalParty } from '@constants/externalParty.constants';

class RestaurantMenuSnapshotModel implements RestaurantMenuSnapshotModelInterface {
  createMenuSnapshot = async (snapshot: RestaurantMenuSnapshotEntity, repository?: EntityManager): Promise<RestaurantMenuSnapshotEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.save(RestaurantMenuSnapshotEntity, snapshot);
    } catch (err) {
      logger.error(`Error while creating menu snapshot. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error while creating menu snapshot. Refer to logs for more info.`),
      );
    }
  };

  getLatestMenuSnapshotByRestaurantID = async (
    restaurantID: number,
    externalParty: ExternalParty = EXTERNAL_PARTY.CHECKMATE,
    repository?: EntityManager,
  ): Promise<RestaurantMenuSnapshotEntity | null> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }

      const options: FindOneOptions<RestaurantMenuSnapshotEntity> = {
        where: { restaurantID, externalParty },
        order: { createdAt: 'DESC' },
      };
      return await repository.findOne(RestaurantMenuSnapshotEntity, options);
    } catch (err) {
      logger.error(`Error while getting latest menu snapshot for restaurant ${restaurantID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error while getting latest menu snapshot for restaurant ${restaurantID}. Refer to logs for more info.`,
        ),
      );
    }
  };
}

export default RestaurantMenuSnapshotModel;
