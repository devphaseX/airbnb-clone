import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

function mountConfig(app: Express) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(morgan('common'));
  app.use(helmet());
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors());
}

export { mountConfig };
