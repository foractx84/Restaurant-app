import { Router } from 'express';
import Route from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import {
  CreateProfileSectionCardsDto,
  DeleteProfileSectionCardDto,
  DeleteProfileSectionDto,
  EditProfileSectionCardsDto,
  LinkRestaurantProfileSectionMediaDto,
} from '@/dtos/profileSections.dto';
import { ProfileSectionsControllerInterface } from '@interfaces/profileSections.interface';
import { CreateSingleProfileSectionDto, EditProfileSectionDto } from '@dtos/profileSections.dto';
import { checkPageIDAndRestaurantIDMiddleware } from '@middlewares/checkPageIDAndRestaurantID.middleware';
import { validatePageSectionMiddleware } from '@middlewares/validatePageSection.middleware';
import { checkPageSectionTemplateTypeAndMedia } from '@/middlewares/checkPageSectionTemplateTypeAndMedia.middleware';
import { checkPageSectionTemplateTypeAndCards } from '@/middlewares/checkPageSectionTemplateTypeAndCards.middleware';
import { checkCardTemplate } from '@/middlewares/checkCardTemplate.middleware';
import checkPageSectionIDAndRestaurantIDMiddleware from '@/middlewares/checkPageSectionIDAndRestaurantID.middleware';
import checkPageSectionCardIDAndRestaurantID from '@/middlewares/checkPageSectionCardIDAndRestaurantID.middleware';
import checkPageSectionCardIDAndRestaurantIDMiddleware from '@/middlewares/checkPageSectionCardIDAndRestaurantID.middleware';
import { LinkMediaToProfileCardDto } from '@/dtos/profileCardMedia.dto';
import checkOptionalMediaIDAndRestaurantIDMiddleware from '@/middlewares/checkOptionalMediaIDAndRestaurantID.middleware';

class ProfileSectionsRoute implements Route {
  public path = '/profileSections';
  public router = Router();
  private profileSectionsController: ProfileSectionsControllerInterface;

  constructor(profileSectionsController: ProfileSectionsControllerInterface) {
    this.profileSectionsController = profileSectionsController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      '/',
      validationMiddleware(CreateSingleProfileSectionDto, 'body', ...Array(3), true),
      checkPageIDAndRestaurantIDMiddleware,
      validatePageSectionMiddleware,
      this.profileSectionsController.createProfileSection,
    );
    this.router.post(
      '/cards',
      validationMiddleware(CreateProfileSectionCardsDto, 'body'),
      checkPageSectionIDAndRestaurantIDMiddleware,
      checkPageSectionTemplateTypeAndCards,
      this.profileSectionsController.createCard,
    );
    this.router.put(
      '/cards',
      validationMiddleware(EditProfileSectionCardsDto, 'body'),
      checkPageSectionCardIDAndRestaurantID,
      checkCardTemplate,
      this.profileSectionsController.editCard,
    );
    this.router.put(
      '/cards/media',
      validationMiddleware(LinkMediaToProfileCardDto, 'body'),
      checkPageSectionCardIDAndRestaurantID,
      checkOptionalMediaIDAndRestaurantIDMiddleware,
      this.profileSectionsController.linkMediaToProfileCard,
    );
    this.router.put(
      '/',
      validationMiddleware(EditProfileSectionDto, 'body', ...Array(3), true),
      checkPageSectionIDAndRestaurantIDMiddleware,
      validatePageSectionMiddleware,
      this.profileSectionsController.editProfileSection,
    );
    this.router.put(
      '/media',
      validationMiddleware(LinkRestaurantProfileSectionMediaDto, 'body'),
      checkPageSectionIDAndRestaurantIDMiddleware,
      checkPageSectionTemplateTypeAndMedia,
      this.profileSectionsController.linkMedia,
    );
    this.router.delete(
      '/cards/:cardID',
      validationMiddleware(DeleteProfileSectionCardDto, 'params'),
      checkPageSectionCardIDAndRestaurantIDMiddleware,
      this.profileSectionsController.deleteCard,
    );
    this.router.delete(
      '/:sectionID',
      validationMiddleware(DeleteProfileSectionDto, 'params'),
      checkPageSectionIDAndRestaurantIDMiddleware,
      this.profileSectionsController.deleteProfileSection,
    );
  }
}

export default ProfileSectionsRoute;
