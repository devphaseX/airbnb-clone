import { Express } from 'express';
import { userRouter } from '../router/user';
import { imageRouter } from '../router/image';

const mountRoute = (app: Express) => {
  app.use(imageRouter);
  app.use('/auth', userRouter);
};

export { mountRoute };
