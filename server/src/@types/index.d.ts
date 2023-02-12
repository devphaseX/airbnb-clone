import { ZodType } from 'zod';

declare global {
  type TypedZodType<T> = {
    [K in keyof T]: T[K] extends object
      ? TypedZodType<T[K]> | ZodType<T[K]>
      : ZodType<T[K]>;
  };
}
