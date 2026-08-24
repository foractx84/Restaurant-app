import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import {
  RestaurantMenuSnapshotInterface,
  RestaurantMenuSnapshotModelInterface,
  RestaurantMenuSnapshotServiceInterface,
} from '@interfaces/restaurantMenuSnapshot.interface';
import { RestaurantMenuSnapshotEntity } from '@entities/restaurantMenuSnapshot.entity';
import { NormalizedMenu } from '@interfaces/platformIntegration.interface';
import { EntityManager } from 'typeorm';
import { EXTERNAL_PARTY, ExternalParty } from '@constants/externalParty.constants';

class RestaurantMenuSnapshotService implements RestaurantMenuSnapshotServiceInterface {
  private restaurantMenuSnapshotModel: RestaurantMenuSnapshotModelInterface;

  constructor(restaurantMenuSnapshotModel: RestaurantMenuSnapshotModelInterface) {
    this.restaurantMenuSnapshotModel = restaurantMenuSnapshotModel;
  }

  createMenuSnapshot = async (
    restaurantID: number,
    menuJson: NormalizedMenu[],
    menuHash: string,
    externalParty: ExternalParty = EXTERNAL_PARTY.CHECKMATE,
    manager?: EntityManager,
  ): Promise<RestaurantMenuSnapshotInterface> => {
    try {
      const snapshot = new RestaurantMenuSnapshotEntity(restaurantID, menuJson, menuHash, externalParty);

      return await this.restaurantMenuSnapshotModel.createMenuSnapshot(snapshot, manager);
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while creating menu snapshot for restaurant ${restaurantID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating menu snapshot for restaurant ${restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };

  getLatestMenuSnapshot = async (
    restaurantID: number,
    externalParty: ExternalParty = EXTERNAL_PARTY.CHECKMATE,
  ): Promise<RestaurantMenuSnapshotInterface | null> => {
    try {
      const snapshot = await this.restaurantMenuSnapshotModel.getLatestMenuSnapshotByRestaurantID(restaurantID, externalParty);

      if (!snapshot) {
        return null;
      }

      return snapshot;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        logger.error(`Error occurred while getting latest menu snapshot for restaurant ${restaurantID}. - ${err}`);
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while getting latest menu snapshot for restaurant ${restaurantID}. Refer to logs for more info.`,
          ),
        );
      }
    }
  };
}

export default RestaurantMenuSnapshotService;
