import { Express } from 'express';
import { userRouter } from '../router/user';
import { imageRouter } from '../router/image';
import { placeRouter } from '../router/place';
import { protectedAuthRoute } from '../controller/auth';

const mountRoute = (app: Express) => {
  app.use(imageRouter);
  app.use('/auth', userRouter);
  app.use('/place', protectedAuthRoute(), placeRouter);
};

export { mountRoute };
