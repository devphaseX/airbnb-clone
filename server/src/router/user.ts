import express from 'express';
import {
  createUser,
  signIn,
  verifyUser,
  logout,
  getProfile,
} from '../controller/auth';

const userRouter = express.Router();

userRouter.get('/profile', getProfile);
userRouter.post('/login', signIn);
userRouter.post('/verify', verifyUser);
userRouter.post('/create', createUser);
userRouter.delete('/logout', logout);

export { userRouter };
