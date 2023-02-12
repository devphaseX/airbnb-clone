import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: path.resolve(__dirname, `${process.env.NODE_ENV.toLowerCase()}.env`),
});

interface ApplicationEnv extends NodeJS.Dict<string | number> {
  NODE_ENV: 'development' | 'production';
  DATABASE_URL: string;
  SERVER_PORT: string | number;
  SALT_ROUND: string | number;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ApplicationEnv {}
  }
}

type EnvSchema = TypedZodType<ApplicationEnv>;

const envSchema = z.object({
  DATABASE_URL: z.string(),
  NODE_ENV: z.enum(['production', 'development'] as [
    'production',
    'development'
  ]),
  SERVER_PORT: z.number({ coerce: true }),
  SALT_ROUND: z.number({ coerce: true }),
} satisfies EnvSchema);

const getEnv = (): ApplicationEnv =>
  envSchema.parse(process.env) as ApplicationEnv;

export { getEnv };
export type { ApplicationEnv };
