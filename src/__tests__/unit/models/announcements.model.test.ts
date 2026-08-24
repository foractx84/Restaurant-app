import { ormConnection } from '@utils/dbUtils';
import { HttpException, TapManagerError } from '@exceptions/HttpException';
import AnnouncementsModel from '@/models/announcements.model';
import { AnnouncementEntity } from '@/entities/announcement.entity';

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

const announcementsModel = new AnnouncementsModel();
describe('announcementsModel', () => {
  const ANNOUNCEMENT_ID = 123;
  const ANNOUNCEMENT_ENTITY: AnnouncementEntity = {
    name: 'Test Announcement',
    description: 'Test Description',
    end_date: new Date('2021-11-04 18:41:40.283605'),
    start_date: new Date('2021-11-04 18:41:40.283605'),
    title: 'Test title',
    submit_email: false,
  };
  describe('fetchAnnouncementsByRestaurantIDOrNameOrID', () => {
    const RESTAURANT_ID = 1;
    it('should fetch announcement by id, name and restaurant id successfully', async () => {
      const getRepository = jest.fn();
      const getMany = jest.fn();
      const leftJoinAndSelect3 = jest.fn(() => ({ orWhere: jest.fn(), andWhere: jest.fn(), getMany }));
      const leftJoinAndSelect2 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect3 }));
      const leftJoinAndSelect1 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect: leftJoinAndSelect1,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);
      (getMany as jest.MockedFunction<any>).mockResolvedValue([{ ...ANNOUNCEMENT_ENTITY, announcement_id: ANNOUNCEMENT_ID }] as AnnouncementEntity[]);

      const result = await announcementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID(
        RESTAURANT_ID,
        false,
        ANNOUNCEMENT_ENTITY.name,
        ANNOUNCEMENT_ID,
      );
      expect(result).toEqual([{ ...ANNOUNCEMENT_ENTITY, announcement_id: ANNOUNCEMENT_ID }]);
    });
    it('should fetch announcement and announcement images by id, name and restaurant id successfully', async () => {
      const getRepository = jest.fn();
      const getMany = jest.fn();
      const leftJoinAndSelect3 = jest.fn(() => ({
        orWhere: jest.fn(),
        leftJoinAndSelect: jest.fn(() => ({ leftJoinAndSelect: jest.fn(() => ({ andWhere: jest.fn() })) })),
        getMany,
      }));
      const leftJoinAndSelect2 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect3 }));
      const leftJoinAndSelect1 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect: leftJoinAndSelect1,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);
      (getMany as jest.MockedFunction<any>).mockResolvedValue([{ ...ANNOUNCEMENT_ENTITY, announcement_id: ANNOUNCEMENT_ID }] as AnnouncementEntity[]);

      const result = await announcementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID(
        RESTAURANT_ID,
        true,
        ANNOUNCEMENT_ENTITY.name,
        ANNOUNCEMENT_ID,
      );
      expect(result).toEqual([{ ...ANNOUNCEMENT_ENTITY, announcement_id: ANNOUNCEMENT_ID }]);
    });
    it('should fetch announcement by name and restaurant id successfully', async () => {
      const getRepository = jest.fn();
      const getMany = jest.fn();
      const leftJoinAndSelect3 = jest.fn(() => ({ orWhere: jest.fn(), andWhere: jest.fn(), getMany }));
      const leftJoinAndSelect2 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect3 }));
      const leftJoinAndSelect1 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect: leftJoinAndSelect1,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);
      (getMany as jest.MockedFunction<any>).mockResolvedValue([{ ...ANNOUNCEMENT_ENTITY, announcement_id: ANNOUNCEMENT_ID }] as AnnouncementEntity[]);

      const result = await announcementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID(RESTAURANT_ID, false, ANNOUNCEMENT_ENTITY.name, null);
      expect(result).toEqual([{ ...ANNOUNCEMENT_ENTITY, announcement_id: ANNOUNCEMENT_ID }]);
    });
    it('should fetch announcement by id and restaurant id successfully', async () => {
      const getRepository = jest.fn();
      const getMany = jest.fn();
      const leftJoinAndSelect3 = jest.fn(() => ({ orWhere: jest.fn(), andWhere: jest.fn(), getMany }));
      const leftJoinAndSelect2 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect3 }));
      const leftJoinAndSelect1 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect: leftJoinAndSelect1,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);
      (getMany as jest.MockedFunction<any>).mockResolvedValue([{ ...ANNOUNCEMENT_ENTITY, announcement_id: ANNOUNCEMENT_ID }] as AnnouncementEntity[]);

      const result = await announcementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID(RESTAURANT_ID, false, null, ANNOUNCEMENT_ID);
      expect(result).toEqual([{ ...ANNOUNCEMENT_ENTITY, announcement_id: ANNOUNCEMENT_ID }]);
    });
    it('should fetch announcement by restaurant id successfully', async () => {
      const getRepository = jest.fn();
      const getMany = jest.fn();
      const leftJoinAndSelect3 = jest.fn(() => ({ orWhere: jest.fn(), andWhere: jest.fn(), getMany }));
      const leftJoinAndSelect2 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect3 }));
      const leftJoinAndSelect1 = jest.fn(() => ({ leftJoinAndSelect: leftJoinAndSelect2 }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect: leftJoinAndSelect1,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);
      (getMany as jest.MockedFunction<any>).mockResolvedValue([{ ...ANNOUNCEMENT_ENTITY, announcement_id: ANNOUNCEMENT_ID }] as AnnouncementEntity[]);

      const result = await announcementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID(RESTAURANT_ID, null, null);
      expect(result).toEqual([{ ...ANNOUNCEMENT_ENTITY, announcement_id: ANNOUNCEMENT_ID }]);
    });
    it('should throw HttpException 500 if an error occurs while fetching announcement by name and restaurant id', async () => {
      const getRepository = jest.fn();
      const createQueryBuilder = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        createQueryBuilder,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);

      try {
        await announcementsModel.fetchAnnouncementsByRestaurantIDOrNameOrID(RESTAURANT_ID, false, ANNOUNCEMENT_ENTITY.name, ANNOUNCEMENT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('insertAnnouncement', () => {
    it('should insert announcement successfully', async () => {
      const mockedInsert = jest.fn().mockImplementation((type: string, announcements: AnnouncementEntity[]) => {
        return { raw: [{ ...announcements[0], announcement_id: ANNOUNCEMENT_ID }] };
      });
      const REPOSITORY: any = {
        insert: mockedInsert,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });
      const result = await announcementsModel.insertAnnouncement(ANNOUNCEMENT_ENTITY);
      expect(mockedInsert).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ...ANNOUNCEMENT_ENTITY, announcement_id: ANNOUNCEMENT_ID });
    });
    it('should throw HttpException 500 if an error occurs while inserting announcement', async () => {
      const mockedInsert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert: mockedInsert,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });
      try {
        await announcementsModel.insertAnnouncement(ANNOUNCEMENT_ENTITY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('softDeleteAnnouncement', () => {
    const ANNOUNCEMENT_ID = 123;
    const RESTAURANT_ID = 1;
    it('should soft delete announcement successfully', async () => {
      const updateSpy = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update: updateSpy,
      });

      await announcementsModel.softDeleteAnnouncement(ANNOUNCEMENT_ID, RESTAURANT_ID);

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while soft deleting announcement', async () => {
      const updateSpy = jest.fn().mockResolvedValue(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update: updateSpy,
      });

      try {
        await announcementsModel.softDeleteAnnouncement(ANNOUNCEMENT_ID, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('hideAnnouncement', () => {
    it('should hide announcement successfully', async () => {
      const mockedUpdate = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update: mockedUpdate,
      });
      await announcementsModel.hideAnnouncement(ANNOUNCEMENT_ID, true);
      expect(mockedUpdate).toHaveBeenCalledTimes(1);
    });
    it('should show announcement successfully', async () => {
      const mockedUpdate = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update: mockedUpdate,
      });
      await announcementsModel.hideAnnouncement(ANNOUNCEMENT_ID, false);
      expect(mockedUpdate).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while hiding/showing announcement', async () => {
      const mockedUpdate = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update: mockedUpdate,
      });
      try {
        await announcementsModel.hideAnnouncement(ANNOUNCEMENT_ID, true);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
  describe('updateAnnouncement', () => {
    it.each([
      { entity: { announcement_id: ANNOUNCEMENT_ID, ...ANNOUNCEMENT_ENTITY }, name: 'announcement with all values' },
      {
        entity: { announcement_id: ANNOUNCEMENT_ID, ...ANNOUNCEMENT_ENTITY, submit_email: true },
        name: 'announcement with all values and submit email true',
      },
      {
        entity: { announcement_id: ANNOUNCEMENT_ID, start_date: ANNOUNCEMENT_ENTITY.start_date, end_date: ANNOUNCEMENT_ENTITY.end_date },
        name: 'announcement with only required values',
      },
    ])('should update announcement successfully with $name', async ({ entity }) => {
      const mockedUpdate = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update: mockedUpdate,
      });
      await announcementsModel.updateAnnouncement(entity);
      expect(mockedUpdate).toHaveBeenCalledWith(AnnouncementEntity, ANNOUNCEMENT_ID, { ...entity, announcement_id: undefined });
      expect(mockedUpdate).toHaveBeenCalledTimes(1);
    });
    it('should throw HttpException 500 if an error occurs while updating announcement', async () => {
      const mockedUpdate = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update: mockedUpdate,
      });
      try {
        await announcementsModel.updateAnnouncement(ANNOUNCEMENT_ENTITY);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
