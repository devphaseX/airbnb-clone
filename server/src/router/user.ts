import express from 'express';
import {
  createUser,
  signIn,
  verifyUser,
  logout,
  getProfile,
  protectedAuthRoute,
  refreshToken,
} from '../controller/auth';

const userRouter = express.Router();

userRouter.get('/auth/refresh', refreshToken);
userRouter.get(
  '/profile',
  protectedAuthRoute({ skipResponse: true }),
  getProfile
);
userRouter.post('/login', signIn);
userRouter.post('/verify', verifyUser);
userRouter.post('/create', createUser);
userRouter.delete(
  '/logout',
  protectedAuthRoute({ skipResponse: true }),
  logout
);

export { userRouter };
