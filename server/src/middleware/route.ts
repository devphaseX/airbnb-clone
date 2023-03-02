import { Express } from 'express';
import { userRouter } from '../router/user';
import { imageRouter } from '../router/image';
import { placeRouter } from '../router/place';
import { globalErrorHandler } from './handleError';

const mountRoute = (app: Express) => {
  app.use(imageRouter);
  app.use('/auth', userRouter);
  app.use('/place', placeRouter);
  app.use(globalErrorHandler);
};

export { mountRoute };
