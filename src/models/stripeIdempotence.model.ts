import { EntityManager } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { StripeIdempotenceModelInterface } from '@interfaces/stripeIdempotence.interface';
import { StripeIdempotenceEventEntity } from '@entities/stripeIdempotenceEvent.entity';

class StripeIdempotenceModel implements StripeIdempotenceModelInterface {
  getStripeEventByEventID = async (eventID: string, repository?: EntityManager): Promise<StripeIdempotenceEventEntity> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.findOne(StripeIdempotenceEventEntity, {
        where: { event_id: eventID },
      });
    } catch (err) {
      logger.error(`Error with selecting stripe event with id: '${eventID}' - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error with selecting stripe event with id: ${eventID}. Refer to logs for more detail.`),
      );
    }
  };

  insertStripeEvent = async (eventID: string, repository?: EntityManager) => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.insert(StripeIdempotenceEventEntity, { event_id: eventID });
    } catch (err) {
      logger.error(`Error occurred while inserting stripe event with id: ${eventID}. - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while inserting stripe event with id: ${eventID}. Refer to logs for more detail.`,
        ),
      );
    }
  };
}

export default StripeIdempotenceModel;
