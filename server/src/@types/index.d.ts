import { ZodTypeAny } from 'zod';

declare global {
  type TypedZodRawShape<T> = {
    [K in keyof T]: K[T] extends object ? TypedZodRawShape<T> : ZodTypeAny;
  };
}
