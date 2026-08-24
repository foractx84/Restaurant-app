import { NextFunction, Request, Response } from 'express';
import { EntityManager } from 'typeorm';
import { EventRequestEntity } from '@/entities/eventRequest.entity';

export type EventRequestStatus = 'new' | 'viewed' | 'responded' | 'archived';

export const EVENT_REQUEST_STATUSES: EventRequestStatus[] = ['new', 'viewed', 'responded', 'archived'];

export interface EventRequestDBInterface {
  event_request_id?: number;
  restaurant_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  company?: string;
  type_of_event: string;
  style_of_event: string;
  event_at: string;
  number_of_people: number;
  additional_information?: string;
  how_did_you_hear?: string;
  status: EventRequestStatus;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface EventRequestResponseInterface {
  eventRequestID: number;
  restaurantID: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  company: string | null;
  typeOfEvent: string;
  styleOfEvent: string;
  eventAt: string;
  numberOfPeople: number;
  additionalInformation: string | null;
  howDidYouHear: string | null;
  status: EventRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListEventRequestsQueryInterface {
  status?: EventRequestStatus;
}

export interface EventRequestIdParamInterface {
  eventRequestID: number;
}

export interface UpdateEventRequestStatusBodyInterface {
  status: EventRequestStatus;
}

export interface EventRequestsControllerInterface {
  listEventRequests: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getEventRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateEventRequestStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteEventRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export interface EventRequestsServiceInterface {
  listEventRequests: (restaurantID: number, filter: ListEventRequestsQueryInterface) => Promise<EventRequestResponseInterface[]>;
  getEventRequest: (eventRequestID: number, restaurantID: number) => Promise<EventRequestResponseInterface>;
  updateEventRequestStatus: (eventRequestID: number, restaurantID: number, status: EventRequestStatus) => Promise<EventRequestResponseInterface>;
  deleteEventRequest: (eventRequestID: number, restaurantID: number) => Promise<void>;
}

export interface EventRequestsModelInterface {
  fetchEventRequestsByRestaurantID: (
    restaurantID: number,
    filter: ListEventRequestsQueryInterface,
    repository?: EntityManager,
  ) => Promise<EventRequestEntity[]>;
  fetchEventRequestByID: (eventRequestID: number, restaurantID: number, repository?: EntityManager) => Promise<EventRequestEntity | undefined>;
  updateEventRequestStatus: (
    eventRequestID: number,
    restaurantID: number,
    status: EventRequestStatus,
    repository?: EntityManager,
  ) => Promise<EventRequestEntity | undefined>;
  softDeleteEventRequest: (eventRequestID: number, restaurantID: number, repository?: EntityManager) => Promise<void>;
}
