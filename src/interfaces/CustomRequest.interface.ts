import { Request } from 'express-serve-static-core';

export interface CustomRequest<T extends object> extends Request {
  metadata: T;
}
