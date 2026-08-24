import { HttpException } from '@exceptions/HttpException';
import EventMediaService from '@services/eventMedia.service';
import EventMediaModel from '@/models/eventMedia.model';
import { EventMediaEntity } from '@/entities/eventMedia.entity';

const deleteMediaIfExistsMock = jest.fn();
const obtainMediaMock = jest.fn();
const ormConnectionMock = jest.fn();

jest.mock('@/utils/imageUtils', () => ({
  __esModule: true,
  ...require('../../../../__mocks__/imageUtils'),
  deleteMediaIfExists: (images: string[], video: string) => deleteMediaIfExistsMock(images, video),
  obtainMedia: (url: string, type?: string) => obtainMediaMock(url, type),
}));
jest.mock('@/utils/logger', () => {
  const logger = { error: jest.fn(), warn: jest.fn() };
  return { __esModule: true, logger };
});
jest.mock('@/utils/dbUtils', () => ({
  __esModule: true,
  ormConnection: (...args: any[]) => ormConnectionMock(...args),
}));
jest.mock('@/configs/config', () => ({
  __esModule: true,
  EVENT_MEDIA: { MAX_EVENT_IMAGES: 10, MAX_EVENT_VIDEOS: 1 },
  APP_CONFIG: {},
  MENU_ITEM_MEDIA: {},
}));
jest.mock('@/models/eventMedia.model', () => {
  const mock = {
    fetchByRestaurantID: jest.fn(),
    fetchByID: jest.fn(),
    fetchMaxListOrder: jest.fn(),
    insertMany: jest.fn(),
    setListOrder: jest.fn(),
    softDelete: jest.fn(),
    countByRestaurantAndType: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mock) };
});

const mockModel = new EventMediaModel();
const service = new EventMediaService(mockModel);

const RESTAURANT_ID = 20;

const buildEntity = (overrides: Partial<EventMediaEntity> = {}): EventMediaEntity => ({
  event_media_id: 1,
  restaurant_id: RESTAURANT_ID,
  media_url: 'abc.jpg',
  media_type: 'image',
  list_order: 0,
  ...overrides,
});

describe('eventMediaService', () => {
  beforeEach(() => {
    obtainMediaMock.mockImplementation((url: string) => `https://cdn.example.com/${url}`);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('listEventMedia', () => {
    it('should wrap mediaUrl with the host prefix via obtainMedia', async () => {
      (mockModel.fetchByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        buildEntity({ event_media_id: 1, media_url: 'a.jpg', list_order: 0 }),
      ]);

      const result = await service.listEventMedia(RESTAURANT_ID);

      expect(result).toHaveLength(1);
      expect(obtainMediaMock).toHaveBeenCalledWith('a.jpg', 'image');
      expect(result[0]).toEqual({
        eventMediaID: 1,
        mediaUrl: 'https://cdn.example.com/a.jpg',
        mediaType: 'image',
        listOrder: 0,
        altText: null,
      });
    });
  });

  describe('insertEventMedia', () => {
    it('should reject when image upload would exceed the per-restaurant cap', async () => {
      (mockModel.countByRestaurantAndType as jest.MockedFunction<any>).mockResolvedValueOnce(9); // 9 existing images

      try {
        await service.insertEventMedia(RESTAURANT_ID, [
          { mediaUrl: 'a.jpg', mediaType: 'image' },
          { mediaUrl: 'b.jpg', mediaType: 'image' },
        ]);
        fail('expected HttpException');
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.status).toEqual(400);
      }
      expect(mockModel.insertMany).not.toHaveBeenCalled();
    });

    it('should reject when video upload would exceed the per-restaurant cap', async () => {
      (mockModel.countByRestaurantAndType as jest.MockedFunction<any>).mockResolvedValueOnce(1); // 1 existing video

      try {
        await service.insertEventMedia(RESTAURANT_ID, [{ mediaUrl: 'v.mp4', mediaType: 'video' }]);
        fail('expected HttpException');
      } catch (err) {
        expect(err.status).toEqual(400);
      }
    });

    it('should insert at startingOrder = maxOrder + 1 and return mapped responses', async () => {
      (mockModel.countByRestaurantAndType as jest.MockedFunction<any>).mockResolvedValueOnce(0);
      (mockModel.fetchMaxListOrder as jest.MockedFunction<any>).mockResolvedValueOnce(4);
      (mockModel.insertMany as jest.MockedFunction<any>).mockResolvedValueOnce([
        buildEntity({ event_media_id: 10, media_url: 'x.jpg', list_order: 5 }),
      ]);

      const result = await service.insertEventMedia(RESTAURANT_ID, [{ mediaUrl: 'x.jpg', mediaType: 'image' }]);

      expect(mockModel.insertMany).toHaveBeenCalledWith(RESTAURANT_ID, [{ mediaUrl: 'x.jpg', mediaType: 'image' }], 5);
      expect(result[0]).toMatchObject({ eventMediaID: 10, listOrder: 5 });
    });

    it('should return empty when called with no items', async () => {
      const result = await service.insertEventMedia(RESTAURANT_ID, []);
      expect(result).toEqual([]);
      expect(mockModel.insertMany).not.toHaveBeenCalled();
    });
  });

  describe('reorderEventMedia', () => {
    const setupTransaction = () => {
      const transactionFn = jest.fn().mockImplementation(async (fn: any) => {
        await fn({});
      });
      ormConnectionMock.mockResolvedValueOnce({ transaction: transactionFn });
      return transactionFn;
    };

    it('should reject a partial reorder (items.length < existing.length)', async () => {
      (mockModel.fetchByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        buildEntity({ event_media_id: 1, list_order: 0 }),
        buildEntity({ event_media_id: 2, list_order: 1 }),
      ]);

      try {
        await service.reorderEventMedia(RESTAURANT_ID, [{ eventMediaID: 1, listOrder: 0 }]);
        fail('expected HttpException');
      } catch (err) {
        expect(err.status).toEqual(400);
      }
      expect(mockModel.setListOrder).not.toHaveBeenCalled();
    });

    it('should reject duplicate eventMediaID in the request', async () => {
      (mockModel.fetchByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        buildEntity({ event_media_id: 1, list_order: 0 }),
        buildEntity({ event_media_id: 2, list_order: 1 }),
      ]);

      try {
        await service.reorderEventMedia(RESTAURANT_ID, [
          { eventMediaID: 1, listOrder: 0 },
          { eventMediaID: 1, listOrder: 1 },
        ]);
        fail('expected HttpException');
      } catch (err) {
        expect(err.status).toEqual(400);
      }
    });

    it('should reject duplicate listOrder in the request', async () => {
      (mockModel.fetchByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        buildEntity({ event_media_id: 1, list_order: 0 }),
        buildEntity({ event_media_id: 2, list_order: 1 }),
      ]);

      try {
        await service.reorderEventMedia(RESTAURANT_ID, [
          { eventMediaID: 1, listOrder: 0 },
          { eventMediaID: 2, listOrder: 0 },
        ]);
        fail('expected HttpException');
      } catch (err) {
        expect(err.status).toEqual(400);
      }
    });

    it('should 404 when a requested id is not owned by the restaurant', async () => {
      (mockModel.fetchByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        buildEntity({ event_media_id: 1, list_order: 0 }),
        buildEntity({ event_media_id: 2, list_order: 1 }),
      ]);

      try {
        await service.reorderEventMedia(RESTAURANT_ID, [
          { eventMediaID: 1, listOrder: 0 },
          { eventMediaID: 99, listOrder: 1 },
        ]);
        fail('expected HttpException');
      } catch (err) {
        expect(err.status).toEqual(404);
      }
    });

    it('should park every existing item and assign the requested positions in a transaction', async () => {
      (mockModel.fetchByRestaurantID as jest.MockedFunction<any>).mockResolvedValueOnce([
        buildEntity({ event_media_id: 1, list_order: 0 }),
        buildEntity({ event_media_id: 2, list_order: 1 }),
      ]);
      const tx = setupTransaction();

      await service.reorderEventMedia(RESTAURANT_ID, [
        { eventMediaID: 1, listOrder: 1 },
        { eventMediaID: 2, listOrder: 0 },
      ]);

      expect(tx).toHaveBeenCalledTimes(1);
      // 2 park calls + 2 final assign calls = 4 setListOrder invocations.
      expect(mockModel.setListOrder as jest.MockedFunction<any>).toHaveBeenCalledTimes(4);
      // Final assigns: id 1 -> 1, id 2 -> 0
      expect(mockModel.setListOrder).toHaveBeenCalledWith(1, RESTAURANT_ID, 1, {});
      expect(mockModel.setListOrder).toHaveBeenCalledWith(2, RESTAURANT_ID, 0, {});
    });
  });

  describe('deleteEventMedia', () => {
    it('should soft-delete and best-effort clean up an image asset', async () => {
      (mockModel.softDelete as jest.MockedFunction<any>).mockResolvedValueOnce(buildEntity({ media_url: 'x.jpg', media_type: 'image' }));

      await service.deleteEventMedia(1, RESTAURANT_ID);

      expect(mockModel.softDelete).toHaveBeenCalledWith(1, RESTAURANT_ID);
      expect(deleteMediaIfExistsMock).toHaveBeenCalledWith(['x.jpg'], '');
    });

    it('should soft-delete and best-effort clean up a video asset', async () => {
      (mockModel.softDelete as jest.MockedFunction<any>).mockResolvedValueOnce(buildEntity({ media_url: 'v.mp4', media_type: 'video' }));

      await service.deleteEventMedia(1, RESTAURANT_ID);

      expect(deleteMediaIfExistsMock).toHaveBeenCalledWith([], 'v.mp4');
    });

    it('should 404 when the row is missing', async () => {
      (mockModel.softDelete as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      try {
        await service.deleteEventMedia(1, RESTAURANT_ID);
        fail('expected HttpException(404)');
      } catch (err) {
        expect(err.status).toEqual(404);
      }
      expect(deleteMediaIfExistsMock).not.toHaveBeenCalled();
    });

    it('should swallow cloud-cleanup errors and not surface them to the caller', async () => {
      (mockModel.softDelete as jest.MockedFunction<any>).mockResolvedValueOnce(buildEntity({ media_url: 'x.jpg', media_type: 'image' }));
      deleteMediaIfExistsMock.mockRejectedValueOnce(new Error('GCS down'));

      // Should resolve, not reject — the row is already soft-deleted and the
      // file is best-effort.
      await expect(service.deleteEventMedia(1, RESTAURANT_ID)).resolves.toBeUndefined();
    });
  });
});
