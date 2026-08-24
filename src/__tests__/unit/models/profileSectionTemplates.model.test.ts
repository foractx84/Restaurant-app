import { ormConnection } from '@/utils/dbUtils';
import { HttpException } from '@exceptions/HttpException';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import ProfileSectionTemplatesModel from '@/models/profileSectionTemplates.model';
import { ProfileSectionTemplateEntity } from '@/entities/profileSectionTemplate.entity';
import { SectionTemplates } from '@/enums/sectionTemplates';

jest.mock('typeorm', () => {
  const originalModule = jest.requireActual('typeorm');
  return {
    ...originalModule,
    In: jest.fn(input => input),
  };
});
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

const profileSectionTemplatesModel = new ProfileSectionTemplatesModel();

describe('profileSectionTemplatesModel', () => {
  afterEach(() => {
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });
  describe('fetchProfileSectionTemplatesByNames', () => {
    it('should successfully fetch profile section templates by template names', async () => {
      const find = jest.fn().mockImplementation(({}, { where }: FindManyOptions) => {
        return where.template.map((name: string, index) => ({ sectionTemplateID: index + 1, template: name }));
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      const result = await profileSectionTemplatesModel.fetchProfileSectionTemplatesByNames([SectionTemplates.COPY, SectionTemplates.MEDIA_GALLERY]);

      expect(find).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          sectionTemplateID: 1,
          template: SectionTemplates.COPY,
        },
        {
          sectionTemplateID: 2,
          template: SectionTemplates.MEDIA_GALLERY,
        },
      ] as ProfileSectionTemplateEntity[]);
    });
    it('should throw 500 HttpException if any error occurs when fetching profile section templates by template names', async () => {
      const find = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        find,
      });

      try {
        await profileSectionTemplatesModel.fetchProfileSectionTemplatesByNames([SectionTemplates.COPY, SectionTemplates.MEDIA_GALLERY]);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
