import { TapManagerError } from '@exceptions/HttpException';
import StripeIdempotenceModel from '@/models/stripeIdempotence.model';
import StripeIdempotenceService from '@services/stripeIdempotence.service';
import { StripeIdempotenceEventEntity } from '@/entities/stripeIdempotenceEvent.entity';

jest.mock('@/models/stripeIdempotence.model', () => {
  const mockStripeIdempotenceModel = {
    getStripeEventByEventID: jest.fn(),
    insertStripeEvent: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockStripeIdempotenceModel) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});

const mockStripeIdempotenceModel = new StripeIdempotenceModel();
const stripeIdempotenceService = new StripeIdempotenceService(mockStripeIdempotenceModel);

describe('stripeIdempotenceService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  const STRIPE_EVENT_ID = 'stripe event id';
  describe('checkStripeEventExists', () => {
    it('should return true since stripe idempotence event exists', async () => {
      const STRIPE_EVENT: StripeIdempotenceEventEntity = {
        stripe_idempotence_event_id: 1,
        event_id: STRIPE_EVENT_ID,
        created_at: '',
      };
      (mockStripeIdempotenceModel.getStripeEventByEventID as jest.MockedFunction<any>).mockResolvedValueOnce(STRIPE_EVENT);

      const result = await stripeIdempotenceService.checkStripeEventExists(STRIPE_EVENT_ID);

      expect(mockStripeIdempotenceModel.getStripeEventByEventID).toHaveBeenCalledWith(STRIPE_EVENT_ID);
      expect(result).toBeTruthy();
    });
    it('should return false since stripe idempotence event does not exist', async () => {
      const result = await stripeIdempotenceService.checkStripeEventExists(STRIPE_EVENT_ID);

      expect(mockStripeIdempotenceModel.getStripeEventByEventID).toHaveBeenCalledWith(STRIPE_EVENT_ID);
      expect(result).toBeFalsy();
    });
    it('should throw 500 HttpException if error occurs while checking if stripe idempotence event exists', async () => {
      (mockStripeIdempotenceModel.getStripeEventByEventID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await stripeIdempotenceService.checkStripeEventExists(STRIPE_EVENT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockStripeIdempotenceModel.getStripeEventByEventID).toHaveBeenCalled();
    });
  });
  describe('logStripeEvent', () => {
    it('should successfully log stripe idempotence event', async () => {
      await stripeIdempotenceService.logStripeEvent(STRIPE_EVENT_ID);

      expect(mockStripeIdempotenceModel.insertStripeEvent).toHaveBeenCalledWith(STRIPE_EVENT_ID);
    });
    it('should throw 500 HttpException if error occurs while logging stripe idempotence event', async () => {
      (mockStripeIdempotenceModel.insertStripeEvent as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await stripeIdempotenceService.logStripeEvent(STRIPE_EVENT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockStripeIdempotenceModel.insertStripeEvent).toHaveBeenCalled();
    });
  });
});
