import { Express } from 'express';
import { ZodType } from 'zod';
import { AuthCookie } from '../server/app/token';

declare global {
  type TypedZodType<T> = {
    [K in keyof T]: T[K] extends object
      ? TypedZodType<T[K]> | ZodType<T[K]>
      : ZodType<T[K]>;
  };

  type Cookie = AuthCookie;
  namespace Express {
    export interface Request {
      user?: any;
    }
  }
}
