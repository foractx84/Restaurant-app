import { NextFunction, Request, Response } from 'express';
import { EntityManager } from 'typeorm';
import { CateringRequestEntity } from '@/entities/cateringRequest.entity';

export type CateringRequestStatus = 'new' | 'viewed' | 'responded' | 'archived';

export const CATERING_REQUEST_STATUSES: CateringRequestStatus[] = ['new', 'viewed', 'responded', 'archived'];

export interface CateringRequestDBInterface {
  catering_request_id?: number;
  restaurant_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  street_address_1: string;
  street_address_2?: string;
  city: string;
  state: string;
  zip_code: string;
  company?: string;
  number_of_people: number;
  type_of_event: string;
  event_start_at: string;
  event_end_at: string;
  style_of_catering?: string;
  special_requests: string;
  additional_information?: string;
  how_did_you_hear?: string;
  status: CateringRequestStatus;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface CateringRequestResponseInterface {
  cateringRequestID: number;
  restaurantID: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  streetAddress1: string;
  streetAddress2: string | null;
  city: string;
  state: string;
  zipCode: string;
  company: string | null;
  numberOfPeople: number;
  typeOfEvent: string;
  eventStartAt: string;
  eventEndAt: string;
  styleOfCatering: string | null;
  specialRequests: string;
  additionalInformation: string | null;
  howDidYouHear: string | null;
  status: CateringRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListCateringRequestsQueryInterface {
  status?: CateringRequestStatus;
}

export interface CateringRequestIdParamInterface {
  cateringRequestID: number;
}

export interface UpdateCateringRequestStatusBodyInterface {
  status: CateringRequestStatus;
}

export interface CateringRequestsControllerInterface {
  listCateringRequests: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getCateringRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateCateringRequestStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteCateringRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface CateringRequestsServiceInterface {
  listCateringRequests: (restaurantID: number, filter: ListCateringRequestsQueryInterface) => Promise<CateringRequestResponseInterface[]>;
  getCateringRequest: (cateringRequestID: number, restaurantID: number) => Promise<CateringRequestResponseInterface>;
  updateCateringRequestStatus: (
    cateringRequestID: number,
    restaurantID: number,
    status: CateringRequestStatus,
  ) => Promise<CateringRequestResponseInterface>;
  deleteCateringRequest: (cateringRequestID: number, restaurantID: number) => Promise<void>;
}

export interface CateringRequestsModelInterface {
  fetchCateringRequestsByRestaurantID: (
    restaurantID: number,
    filter: ListCateringRequestsQueryInterface,
    repository?: EntityManager,
  ) => Promise<CateringRequestEntity[]>;
  fetchCateringRequestByID: (
    cateringRequestID: number,
    restaurantID: number,
    repository?: EntityManager,
  ) => Promise<CateringRequestEntity | undefined>;
  updateCateringRequestStatus: (
    cateringRequestID: number,
    restaurantID: number,
    status: CateringRequestStatus,
    repository?: EntityManager,
  ) => Promise<CateringRequestEntity | undefined>;
  softDeleteCateringRequest: (cateringRequestID: number, restaurantID: number, repository?: EntityManager) => Promise<void>;
}
