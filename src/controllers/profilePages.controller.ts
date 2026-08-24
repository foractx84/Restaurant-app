import {
  CreateProfilePageRequestInterface,
  EditProfilePageRequestInterface,
  ProfilePagesControllerInterface,
  ProfilePagesServiceInterface,
} from '@interfaces/profilePages.interface';
import { NextFunction, Request, Response } from 'express-serve-static-core';
import { CustomRequest } from '@interfaces/CustomRequest.interface';
import { ProfilePageEntity } from '@/entities/profilePage.entity';

class ProfilePagesController implements ProfilePagesControllerInterface {
  private profilePagesService: ProfilePagesServiceInterface;

  constructor(profilePagesService: ProfilePagesServiceInterface) {
    this.profilePagesService = profilePagesService;
  }

  createProfilePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID: number = res.locals.restaurantID;
      const request = req.body as CreateProfilePageRequestInterface;
      res.json(await this.profilePagesService.createProfilePage(request, restaurantID));
    } catch (err) {
      next(err);
    }
  };

  editProfilePage = async (req: CustomRequest<ProfilePageEntity>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID: number = res.locals.restaurantID;
      const request = req.body as EditProfilePageRequestInterface;
      res.json(await this.profilePagesService.editProfilePage(request, restaurantID));
    } catch (err) {
      next(err);
    }
  };

  getProfilePageDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pageID: number = parseInt(req.params.pageID);
      res.json(await this.profilePagesService.getProfilePageDetails(pageID));
    } catch (err) {
      next(err);
    }
  };
}

export default ProfilePagesController;
