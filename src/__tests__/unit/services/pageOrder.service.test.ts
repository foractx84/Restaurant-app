import PageOrderService from '@services/pageOrder.service';
import { PageOrderModelInterface } from '@interfaces/pageOrder.interface';
import { RestaurantsServiceInterface } from '@interfaces/restaurants.interface';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { RestaurantPageOrderEntity } from '@/entities/restaurantPageOrder.entity';

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
  replaceForRestaurant: jest.fn(),
} as unknown as jest.Mocked<PageOrderModelInterface>;

const mockRestaurantsService = {
  findRestaurantEntityByID: jest.fn(),
  updateRestaurantEntity: jest.fn(),
} as unknown as jest.Mocked<RestaurantsServiceInterface>;

const service = new PageOrderService(mockModel, mockRestaurantsService);

const RESTAURANT_ID = 20;

const rowsFor = (keys: string[]): RestaurantPageOrderEntity[] =>
  keys.map((page_key, index) => ({ restaurant_id: RESTAURANT_ID, page_key, list_order: index } as RestaurantPageOrderEntity));

describe('pageOrderService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getPageOrder', () => {
    it('should return the saved page keys in order', async () => {
      (mockModel.fetchByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce(rowsFor(['menu', 'events', 'contact']));

      const result = await service.getPageOrder(RESTAURANT_ID);

      expect(mockModel.fetchByRestaurantID).toHaveBeenCalledWith(RESTAURANT_ID);
      expect(result).toEqual({ order: ['menu', 'events', 'contact'] });
    });

    it('should return an empty order when nothing is saved yet', async () => {
      (mockModel.fetchByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([]);

      const result = await service.getPageOrder(RESTAURANT_ID);

      expect(result).toEqual({ order: [] });
    });
  });

  describe('updatePageOrder', () => {
    it('should replace the order and return the saved keys', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
      } as RestaurantEntity);
      (mockModel.replaceForRestaurant as jest.MockedFunction<any>).mockResolvedValueOnce(rowsFor(['contact', 'menu']));

      const result = await service.updatePageOrder(RESTAURANT_ID, { order: ['contact', 'menu'] });

      expect(mockModel.replaceForRestaurant).toHaveBeenCalledWith(RESTAURANT_ID, ['contact', 'menu']);
      expect(result).toEqual({ order: ['contact', 'menu'] });
    });

    it('should throw 404 and skip the write if the restaurant does not exist', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      await expect(service.updatePageOrder(RESTAURANT_ID, { order: ['menu'] })).rejects.toMatchObject({ status: 404 });
      expect(mockModel.replaceForRestaurant).not.toHaveBeenCalled();
    });

    it('should reject duplicate page keys with a 400 and skip the write', async () => {
      (mockRestaurantsService.findRestaurantEntityByID as jest.MockedFunction<any>).mockResolvedValueOnce({
        restaurant_id: RESTAURANT_ID,
      } as RestaurantEntity);

      await expect(service.updatePageOrder(RESTAURANT_ID, { order: ['menu', 'menu'] })).rejects.toMatchObject({ status: 400 });
      expect(mockModel.replaceForRestaurant).not.toHaveBeenCalled();
    });
  });
});
