import { Express } from 'express';
import mongoose from 'mongoose';
import { ZodRawShape, ZodType } from 'zod';
import { AuthCookie } from '../server/app/token';

declare global {
  type Cookie = AuthCookie;
  namespace Express {
    export interface Request {
      user?: any;
    }
  }

  type ObjectId = mongoose.Schema.Types.ObjectId | mongoose.Types.ObjectId;

  type MapObjectIdString<T> = {
    [K in keyof T]: T[K] extends infer V
      ? V extends Array<infer I>
        ? I extends ObjectId
          ? Array<string>
          : Array<I>
        : V extends ObjectId
        ? string
        : V
      : never;
  };

  type U = MapObjectIdString<{ a: [mongoose.Types.ObjectId] }>;

  type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
  type WithId<T extends object> = T & { id: string; _id?: string };
}
