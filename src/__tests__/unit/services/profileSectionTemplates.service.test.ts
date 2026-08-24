import ProfileSectionTemplatesService from '@services/profileSectionTemplates.service';
import { ProfileSectionTemplateEntity } from '@/entities/profileSectionTemplate.entity';
import ProfileSectionTemplatesModel from '@/models/profileSectionTemplates.model';
import { TapManagerError } from '@exceptions/HttpException';
import { SectionTemplates } from '@/enums/sectionTemplates';

jest.mock('@/models/profileSectionTemplates.model', () => {
  const mockProfileSectionTemplatesModel = {
    fetchProfileSectionTemplatesByNames: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockProfileSectionTemplatesModel) };
});
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

const mockProfileSectionTemplatesModel = new ProfileSectionTemplatesModel();
const profileSectionTemplatesService = new ProfileSectionTemplatesService(mockProfileSectionTemplatesModel);

describe('profileSectionTemplatesService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('profileSectionTemplatesService', () => {
    it('should successfully get profile section templates by names', async () => {
      (mockProfileSectionTemplatesModel.fetchProfileSectionTemplatesByNames as jest.MockedFunction<any>).mockImplementationOnce(
        (templates: string[]) => {
          return templates.map(
            (template, index) =>
              ({
                sectionTemplateID: index + 1,
                template,
              } as ProfileSectionTemplateEntity),
          );
        },
      );

      const result: ProfileSectionTemplateEntity[] = await profileSectionTemplatesService.getProfileSectionTemplatesByNames([
        SectionTemplates.COPY,
        SectionTemplates.MEDIA_GALLERY,
      ]);

      expect(mockProfileSectionTemplatesModel.fetchProfileSectionTemplatesByNames).toHaveBeenCalledTimes(1);
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
    it('should throw 400 Bad Request when template names are provided and the incorrect number of templates are returned', async () => {
      (mockProfileSectionTemplatesModel.fetchProfileSectionTemplatesByNames as jest.MockedFunction<any>).mockImplementationOnce(
        (templates: string[]) => {
          return [
            {
              sectionTemplateID: 1,
              template: templates[0],
            },
          ];
        },
      );

      try {
        await profileSectionTemplatesService.getProfileSectionTemplatesByNames([SectionTemplates.COPY, SectionTemplates.MEDIA_GALLERY]);
      } catch (err) {
        expect(err.status).toEqual(400);
        expect(err.payload[0] instanceof TapManagerError).toBeTruthy();
      }

      expect(mockProfileSectionTemplatesModel.fetchProfileSectionTemplatesByNames).toHaveBeenCalledTimes(1);
    });
  });
});
