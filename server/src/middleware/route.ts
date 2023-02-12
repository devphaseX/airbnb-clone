import { Express } from 'express';
import { userRouter } from '../router/user';

const mountRoute = (app: Express) => {
  app.use('/auth', userRouter);
};

export { mountRoute };
