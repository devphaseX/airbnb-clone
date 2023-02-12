import mongoose, { Mongoose } from 'mongoose';

const startDb = async ({ DB_URL }: { DB_URL: string }): Promise<Mongoose> => {
  try {
    const db = await mongoose.connect(DB_URL);
    console.log(`database server connected on port ${db.connection.port}`);
    return db;
  } catch (error) {
    console.log(`database failed to connect with error`, error);
    throw error;
  }
};

export { startDb };
