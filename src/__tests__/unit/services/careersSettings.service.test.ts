import { TapManagerError } from '@exceptions/HttpException';
import CareersSettingsService from '@services/careersSettings.service';
import { CareersSettingsModelInterface } from '@interfaces/careersSettings.interface';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { CareersSettingsEntity } from '@/entities/careersSettings.entity';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});

const mockModel = {
  fetchByRestaurantID: jest.fn(),
  upsertByRestaurantID: jest.fn(),
} as unknown as jest.Mocked<CareersSettingsModelInterface>;

const mockRestaurantsService = {
  findRestaurantEntityByID: jest.fn(),
  updateRestaurantEntity: jest.fn(),
} as unknown as jest.Mocked<RestaurantsServiceInterface>;

const service = new CareersSettingsService(mockModel, mockRestaurantsService);

const RESTAURANT_ID = 20;

const settingsEntity = (overrides: Partial<CareersSettingsEntity> = {}): CareersSettingsEntity =>
  ({
    careers_setting_id: 1,
    restaurant_id: RESTAURANT_ID,
    section_title: 'Join us',
    careers_text: 'We are hiring.',
    is_inquiry_form_enabled: true,
    notification_email: 'careers@example.com',
    ...overrides,
  } as CareersSettingsEntity);

describe('careersSettingsService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getCareersSettings', () => {
    it('should merge the restaurant flag with the settings row', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        is_careers_enabled: true,
      } as RestaurantEntity);
      (mockModel.fetchByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(settingsEntity());

      const result = await service.getCareersSettings(RESTAURANT_ID);

      expect(result).toEqual({
        isCareersEnabled: true,
        sectionTitle: 'Join us',
        careersText: 'We are hiring.',
        isInquiryFormEnabled: true,
        notificationEmail: 'careers@example.com',
      });
    });

    it('should fall back to defaults when no settings row exists yet', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        is_careers_enabled: false,
      } as RestaurantEntity);
      (mockModel.fetchByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      const result = await service.getCareersSettings(RESTAURANT_ID);

      expect(result).toEqual({
        isCareersEnabled: false,
        sectionTitle: '',
        careersText: '',
        isInquiryFormEnabled: false,
        notificationEmail: null,
      });
    });

    it('should throw 404 if the restaurant does not exist', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.getCareersSettings(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });

  describe('updateCareersSettings', () => {
    it('should write the flag, upsert only the provided fields, and return the saved row', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        is_careers_enabled: false,
      } as RestaurantEntity);
      (mockModel.upsertByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(settingsEntity({ section_title: 'We are hiring!' }));

      const result = await service.updateCareersSettings(RESTAURANT_ID, {
        isCareersEnabled: true,
        sectionTitle: 'We are hiring!',
      });

      expect(mockRestaurantsService.updateRestaurantEntity).toHaveBeenCalledWith({ is_careers_enabled: true }, RESTAURANT_ID);
      expect(mockModel.upsertByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, { section_title: 'We are hiring!' });
      expect(result.isCareersEnabled).toBe(true);
      expect(result.sectionTitle).toEqual('We are hiring!');
    });

    it('should clear the notification email when null is explicitly provided', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        is_careers_enabled: true,
      } as RestaurantEntity);
      (mockModel.upsertByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(settingsEntity({ notification_email: undefined }));

      const result = await service.updateCareersSettings(RESTAURANT_ID, {
        isCareersEnabled: true,
        notificationEmail: null,
      });

      expect(mockModel.upsertByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, { notification_email: null });
      expect(result.notificationEmail).toBeNull();
    });

    it('should not include untouched fields in the upsert patch', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
        is_careers_enabled: false,
      } as RestaurantEntity);
      (mockModel.upsertByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(settingsEntity());

      await service.updateCareersSettings(RESTAURANT_ID, { isCareersEnabled: true });

      expect(mockModel.upsertByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID, {});
    });

    it('should throw 404 and skip writes if the restaurant does not exist', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.updateCareersSettings(RESTAURANT_ID, { isCareersEnabled: true });
      } catch (err) {
        expect(err.status).toEqual(404);
      }
      expect(mockRestaurantsService.updateRestaurantEntity).not.toHaveBeenCalled();
      expect(mockModel.upsertByRestaurantID).not.toHaveBeenCalled();
    });
  });
});
