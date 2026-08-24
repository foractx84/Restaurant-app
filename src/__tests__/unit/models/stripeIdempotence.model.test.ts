import { HttpException, TapManagerError } from '@exceptions/HttpException';
import { ormConnection } from '@utils/dbUtils';
import StripeIdempotenceModel from '@/models/stripeIdempotence.model';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});

const stripeIdempotenceModel = new StripeIdempotenceModel();
describe('stripeIdempotenceModel', () => {
  const EVENT_ID = 'stripe event id';
  describe('getStripeEventByEventID', () => {
    it('should successfully get stripe idempotence event by event id', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      await stripeIdempotenceModel.getStripeEventByEventID(EVENT_ID);

      expect(findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 status code Database error if any error occurs while getting stripe idempotence event by event id', async () => {
      const findOne = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      try {
        await stripeIdempotenceModel.getStripeEventByEventID(EVENT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('insertStripeEvent', () => {
    it('should insert stripe idempotence event successfully', async () => {
      const insert = jest.fn();
      const REPOSITORY: any = {
        insert,
      };

      await stripeIdempotenceModel.insertStripeEvent(EVENT_ID, REPOSITORY);
      expect(insert).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while inserting stripe idempotence event', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert,
      };

      try {
        await stripeIdempotenceModel.insertStripeEvent(EVENT_ID, REPOSITORY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
