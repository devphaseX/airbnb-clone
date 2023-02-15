import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import session from 'express-session';
import createDBStore from 'connect-mongodb-session';
import { getEnv } from '../server/config/env';

const MongoDBStore = createDBStore(session);

const store = new MongoDBStore({
  uri: getEnv().DATABASE_URL,
  databaseName: 'airbnb-clone',
  collection: 'session',
  expiresAfterSeconds: 60 * 60 * 24,
});

function mountConfig(app: Express) {
  app.use(
    session({
      store,
      name: 'userId',
      secret: 'somehyj',
      resave: false,
      saveUninitialized: false,
      cookie: {
        // sameSite: 'strict',
        // secure: true,
        sameSite: 'none',
        httpOnly: true,
      },
    })
  );

  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('common'));
  app.use(helmet());
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      credentials: true,
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    })
  );
}

export { mountConfig };
