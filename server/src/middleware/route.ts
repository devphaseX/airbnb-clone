import { Express } from 'express';
import { userRouter } from '../router/user';
import { imageRouter } from '../router/image';
import { placeRouter } from '../router/place';
import { globalErrorHandler } from './handleError';
import { bookingRouter } from '../router/booking';

const mountRoute = (app: Express) => {
  app.use(imageRouter);
  app.use('/auth', userRouter);
  app.use('/place', placeRouter);
  app.use('/booking', bookingRouter);
  app.use(globalErrorHandler);
};

export { mountRoute };
