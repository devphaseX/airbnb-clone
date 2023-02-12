import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: path.resolve(__dirname, `${process.env.NODE_ENV.toLowerCase()}.env`),
});

interface ApplicationEnv extends NodeJS.Dict<string> {
  NODE_ENV: 'development' | 'production';
  DATABASE_URL: string;
  SERVER_PORT: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ApplicationEnv {}
  }
}

type EnvSchema = TypedZodRawShape<ApplicationEnv>;

const envSchema = z.object<EnvSchema>({
  DATABASE_URL: z.string(),
  NODE_ENV: z.enum(['production', 'development'] as [
    'production',
    'development'
  ]),
  SERVER_PORT: z.number({ coerce: true }),
});

const getEnv = (): ApplicationEnv =>
  envSchema.parse(process.env) as ApplicationEnv;

export { getEnv };
export type { ApplicationEnv };
