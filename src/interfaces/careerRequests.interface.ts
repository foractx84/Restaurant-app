import { NextFunction, Request, Response } from 'express';
import { EntityManager } from 'typeorm';
import { CareerRequestEntity } from '@/entities/careerRequest.entity';

export type CareerRequestStatus = 'new' | 'viewed' | 'responded' | 'archived';

export const CAREER_REQUEST_STATUSES: CareerRequestStatus[] = ['new', 'viewed', 'responded', 'archived'];

export interface CareerRequestDBInterface {
  career_request_id?: number;
  restaurant_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  position_applied_for: string;
  additional_information?: string;
  how_did_you_hear?: string;
  status: CareerRequestStatus;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface CareerRequestResponseInterface {
  careerRequestID: number;
  restaurantID: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  positionAppliedFor: string;
  additionalInformation: string | null;
  howDidYouHear: string | null;
  status: CareerRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListCareerRequestsQueryInterface {
  status?: CareerRequestStatus;
}

export interface CareerRequestIdParamInterface {
  careerRequestID: number;
}

export interface UpdateCareerRequestStatusBodyInterface {
  status: CareerRequestStatus;
}

export interface CareerRequestsControllerInterface {
  listCareerRequests: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getCareerRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateCareerRequestStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteCareerRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface CareerRequestsServiceInterface {
  listCareerRequests: (restaurantID: number, filter: ListCareerRequestsQueryInterface) => Promise<CareerRequestResponseInterface[]>;
  getCareerRequest: (careerRequestID: number, restaurantID: number) => Promise<CareerRequestResponseInterface>;
  updateCareerRequestStatus: (careerRequestID: number, restaurantID: number, status: CareerRequestStatus) => Promise<CareerRequestResponseInterface>;
  deleteCareerRequest: (careerRequestID: number, restaurantID: number) => Promise<void>;
}

export interface CareerRequestsModelInterface {
  fetchCareerRequestsByRestaurantID: (
    restaurantID: number,
    filter: ListCareerRequestsQueryInterface,
    repository?: EntityManager,
  ) => Promise<CareerRequestEntity[]>;
  fetchCareerRequestByID: (careerRequestID: number, restaurantID: number, repository?: EntityManager) => Promise<CareerRequestEntity | undefined>;
  updateCareerRequestStatus: (
    careerRequestID: number,
    restaurantID: number,
    status: CareerRequestStatus,
    repository?: EntityManager,
  ) => Promise<CareerRequestEntity | undefined>;
  softDeleteCareerRequest: (careerRequestID: number, restaurantID: number, repository?: EntityManager) => Promise<void>;
}
