import { ormConnection } from '@/utils/dbUtils';
import { HttpException, TapManagerError } from '@exceptions/HttpException';
import ProfileSectionsModel from '@/models/profileSections.model';
import { ProfileSectionEntity } from '@/entities/profileSection.entity';
import { SectionTemplates } from '@/enums/sectionTemplates';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { EntityManager } from 'typeorm';

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

const profileSectionsModel = new ProfileSectionsModel();

describe('profileSectionsModel', () => {
  const SECTION_ID = 1;
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  const PROFILE_PAGE_ID = 123;
  const PROFILE_SECTION_ENTITIES: ProfileSectionEntity[] = [
    new ProfileSectionEntity(
      {
        content: 'Test content',
        isHidden: false,
        name: 'Test Name 1',
        sectionID: 1,
        subNav: 'Copy Link',
        urlPath: 'copy-path',
        title: 'Test Title 1',
        template: SectionTemplates.COPY,
      },
      PROFILE_PAGE_ID,
      {
        sectionTemplateID: 1,
        template: SectionTemplates.COPY,
      },
    ),
    new ProfileSectionEntity(
      {
        content: null,
        isHidden: false,
        name: 'Test Name 2',
        sectionID: 1,
        subNav: null,
        urlPath: null,
        title: 'Test Title 2',
        template: SectionTemplates.MEDIA_GALLERY,
      },
      PROFILE_PAGE_ID,
      {
        sectionTemplateID: 2,
        template: SectionTemplates.MEDIA_GALLERY,
      },
    ),
  ];
  describe('fetchProfilePageSectionByID', () => {
    it('should successfully fetch profile pages sections by section id and restaurant id', async () => {
      const findOne = jest.fn().mockImplementation(({}, { where }: FindManyOptions) => {
        return [{ ...PROFILE_SECTION_ENTITIES[0], restaurantProfileSectionID: where.restaurantProfileSectionID }];
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });

      const result = await profileSectionsModel.fetchProfilePageSectionByID(2);

      expect(findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ ...PROFILE_SECTION_ENTITIES[0], restaurantProfileSectionID: 2 }]);
    });
    it('should throw 500 HttpException if any error occurs when fetching restaurant profile page section by section id', async () => {
      const find = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      try {
        await profileSectionsModel.fetchProfilePageSectionByID(2);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('upsertProfileSections', () => {
    it('should successfully upsert profile section', async () => {
      const mockSave = jest
        .fn()
        .mockImplementation(({}, entities: ProfileSectionEntity[]) =>
          Promise.resolve(entities.map(entity => ({ ...entity, restaurant_profile_section_id: SECTION_ID, buildProfileSectionResponse: undefined }))),
        );
      (ormConnection as jest.Mock).mockResolvedValue({
        save: mockSave,
      });

      const result = await profileSectionsModel.upsertProfileSections(PROFILE_SECTION_ENTITIES);

      expect(ormConnection).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(PROFILE_SECTION_ENTITIES.length);
      expect(result[0].name).toEqual(PROFILE_SECTION_ENTITIES[0].name);
      expect(result[1].name).toEqual(PROFILE_SECTION_ENTITIES[1].name);
      expect(result).toEqual(
        PROFILE_SECTION_ENTITIES.map(entity => ({ ...entity, restaurant_profile_section_id: SECTION_ID, buildProfileSectionResponse: undefined })),
      );
    });
    it('should throw 500 HttpException if any error occurs when upserting restaurant profile sections', async () => {
      const REPOSITORY: any = {
        save: () => {
          throw Error;
        },
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        createQueryBuilder: () => REPOSITORY,
      });

      try {
        await profileSectionsModel.upsertProfileSections([] as ProfileSectionEntity[]);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('fetchPageSectionByID', () => {
    const SECTION_ID = 1;
    it('should successfully fetch page section by sectionID', async () => {
      const findOne = jest.fn();
      (ormConnection as jest.Mock).mockResolvedValue({
        findOne,
      });
      (findOne as jest.MockedFunction<any>).mockResolvedValueOnce(PROFILE_SECTION_ENTITIES[0]);

      const result = await profileSectionsModel.fetchPageSectionByID(SECTION_ID);

      expect(ormConnection).toHaveBeenCalledTimes(1);
      expect(findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(PROFILE_SECTION_ENTITIES[0]);
    });
    it('should throw 500 HttpException if any error occurs when fetching page section by sectionID', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await profileSectionsModel.fetchPageSectionByID(SECTION_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(ormConnection).toHaveBeenCalledTimes(1);
    });
  });
  describe('softDeleteProfileSection', () => {
    const SECTION_ID = 1;
    it('should successfully delete profile section', async () => {
      const updateSpy = jest.fn();
      const REPOSITORY: any = {
        update: updateSpy,
      };
      await profileSectionsModel.softDeleteProfileSection(SECTION_ID, REPOSITORY as EntityManager);

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
    it('should throw 500 HttpException if any error occurs when deleting profile section', async () => {
      (ormConnection as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });
      try {
        await profileSectionsModel.softDeleteProfileSection(SECTION_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }
    });
  });
});
