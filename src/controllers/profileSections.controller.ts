import { NextFunction, Request, Response } from 'express-serve-static-core';
import { CreateProfileSectionCardsDto, EditProfileSectionCardsDto, LinkRestaurantProfileSectionMediaDto } from '@/dtos/profileSections.dto';
import {
  CreateProfileSectionRequest,
  ProfileSectionInterface,
  ProfileSectionsControllerInterface,
  ProfileSectionsServiceInterface,
} from '@interfaces/profileSections.interface';
import { LinkMediaToProfileCardDto } from '@/dtos/profileCardMedia.dto';

class ProfileSectionsController implements ProfileSectionsControllerInterface {
  private profileSectionsService: ProfileSectionsServiceInterface;

  constructor(profileSectionsService: ProfileSectionsServiceInterface) {
    this.profileSectionsService = profileSectionsService;
  }

  createCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request = req.body as CreateProfileSectionCardsDto;
      res.json(await this.profileSectionsService.createCard(request));
    } catch (err) {
      next(err);
    }
  };

  createProfileSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID: number = res.locals.restaurantID;
      const request = req.body as CreateProfileSectionRequest;
      res.json(await this.profileSectionsService.createProfileSection(request, restaurantID));
    } catch (err) {
      next(err);
    }
  };

  deleteCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cardID: number = parseInt(req.params.cardID);
      await this.profileSectionsService.deleteCard(cardID);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  editCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request = req.body as EditProfileSectionCardsDto;
      await this.profileSectionsService.editCard(request);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  editProfileSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request = req.body as ProfileSectionInterface;
      await this.profileSectionsService.editProfileSection(request);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  deleteProfileSection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sectionID: number = parseInt(req.params.sectionID);
      await this.profileSectionsService.deleteProfileSection(sectionID);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  linkMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const restaurantID: number = res.locals.restaurantID;
      const request = req.body as LinkRestaurantProfileSectionMediaDto;
      await this.profileSectionsService.linkMedia(request?.mediaIDs, restaurantID, request?.sectionID);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };

  linkMediaToProfileCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestBody = req.body as LinkMediaToProfileCardDto;
      await this.profileSectionsService.linkMediaToProfileCard(requestBody.mediaID, requestBody.cardID);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  };
}

export default ProfileSectionsController;
