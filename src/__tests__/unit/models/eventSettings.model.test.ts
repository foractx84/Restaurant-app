import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import EventSettingsModel from '@/models/eventSettings.model';
import { EventSettingsEntity } from '@/entities/eventSettings.entity';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = { error: jest.fn(), warn: jest.fn() };
  return { __esModule: true, logger };
});
jest.mock('@/utils/dbUtils', () => ({ __esModule: true, ormConnection: jest.fn() }));

const eventSettingsModel = new EventSettingsModel();

const RESTAURANT_ID = 20;
const SAMPLE: EventSettingsEntity = {
  event_setting_id: 1,
  restaurant_id: RESTAURANT_ID,
  section_title: "Bob's Crab Shack",
  events_text: 'Host your event here.',
  deck_url: 'https://example.com/deck.pdf',
  is_inquiry_form_enabled: true,
  notification_email: 'events@example.com',
};

describe('eventSettingsModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('fetchByRestaurantID', () => {
    it('should fetch the row when present', async () => {
      const getOne = jest.fn().mockResolvedValueOnce(SAMPLE);
      const builder = {
        where: jest.fn().mockReturnThis(),
        getOne,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue(builder),
      });

      const result = await eventSettingsModel.fetchByRestaurantID(RESTAURANT_ID);

      expect(result).toEqual(SAMPLE);
      expect(builder.where).toHaveBeenCalledWith('event_settings.restaurant_id = :restaurantID', { restaurantID: RESTAURANT_ID });
    });

    it('should throw HttpException(500) on db error', async () => {
      const getOne = jest.fn().mockRejectedValueOnce(new Error('boom'));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue({ where: jest.fn().mockReturnThis(), getOne }),
      });

      try {
        await eventSettingsModel.fetchByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.status).toEqual(500);
      }
    });
  });

  describe('upsertByRestaurantID', () => {
    it('should merge into the existing row when one exists', async () => {
      // First call: fetchByRestaurantID returns existing row
      const fetchBuilder = { where: jest.fn().mockReturnThis(), getOne: jest.fn().mockResolvedValueOnce(SAMPLE) };
      const create = jest.fn().mockImplementation((_, props) => props);
      const save = jest.fn().mockImplementation((_, entity) => entity);
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue(fetchBuilder),
        create,
        save,
      });

      const result = await eventSettingsModel.upsertByRestaurantID(RESTAURANT_ID, { section_title: 'Updated' });

      expect(create).toHaveBeenCalledWith(EventSettingsEntity, expect.objectContaining({ section_title: 'Updated', restaurant_id: RESTAURANT_ID }));
      expect(save).toHaveBeenCalled();
      expect(result.section_title).toEqual('Updated');
    });

    it('should insert a new row with defaults when none exists', async () => {
      const fetchBuilder = { where: jest.fn().mockReturnThis(), getOne: jest.fn().mockResolvedValueOnce(undefined) };
      const create = jest.fn().mockImplementation((_, props) => props);
      const save = jest.fn().mockImplementation((_, entity) => ({ ...entity, event_setting_id: 99 }));
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue(fetchBuilder),
        create,
        save,
      });

      const result = await eventSettingsModel.upsertByRestaurantID(RESTAURANT_ID, { events_text: 'hello' });

      expect(create).toHaveBeenCalledWith(
        EventSettingsEntity,
        expect.objectContaining({
          restaurant_id: RESTAURANT_ID,
          section_title: '',
          events_text: 'hello',
          is_inquiry_form_enabled: false,
        }),
      );
      expect(result.event_setting_id).toEqual(99);
    });

    it('should throw HttpException(500) on db error', async () => {
      const fetchBuilder = { where: jest.fn().mockReturnThis(), getOne: jest.fn().mockRejectedValueOnce(new Error('boom')) };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: jest.fn().mockReturnValue(fetchBuilder),
        create: jest.fn(),
        save: jest.fn(),
      });

      try {
        await eventSettingsModel.upsertByRestaurantID(RESTAURANT_ID, {});
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.status).toEqual(500);
      }
    });
  });
});
