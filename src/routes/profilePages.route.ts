import { Router } from 'express';
import Route from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import { ProfilePagesControllerInterface } from '@interfaces/profilePages.interface';
import { CreateProfilePageRequestBodyDto, EditProfilePageRequestBodyDto, GetProfilePageRequestBodyDto } from '@dtos/profilePages.dto';
import { checkPageIDAndRestaurantIDMiddleware } from '@middlewares/checkPageIDAndRestaurantID.middleware';
import { validatePageMiddleware } from '@middlewares/validatePage.middleware';

class ProfilePagesRoute implements Route {
  public path = '/profilePages';
  public router = Router();
  private profilePagesController: ProfilePagesControllerInterface;

  constructor(profilePagesController: ProfilePagesControllerInterface) {
    this.profilePagesController = profilePagesController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      '/',
      validationMiddleware(CreateProfilePageRequestBodyDto, 'body', ...Array(3), true),
      this.profilePagesController.createProfilePage,
    );
    this.router.put(
      '/',
      validationMiddleware(EditProfilePageRequestBodyDto, `body`, ...Array(3), true),
      checkPageIDAndRestaurantIDMiddleware,
      validatePageMiddleware,
      this.profilePagesController.editProfilePage,
    );
    this.router.get(
      '/:pageID',
      validationMiddleware(GetProfilePageRequestBodyDto, 'params'),
      checkPageIDAndRestaurantIDMiddleware,
      this.profilePagesController.getProfilePageDetails,
    );
  }
}

export default ProfilePagesRoute;
