import type { Mongoose } from 'mongoose';
import { startDb } from './database';
import type { ApplicationEnv } from './env';

type Config = {
  db: Mongoose;
};

type ConfigOption = { env: ApplicationEnv };

const createConfig = async ({ env }: ConfigOption): Promise<Config> => {
  const db = await startDb({ DB_URL: env.DATABASE_URL });
  return { db };
};

export { createConfig };
