import express from 'express';
import { createUser, signIn, verifyUser } from '../controller/user';

const userRouter = express.Router();

userRouter.post('/login', signIn);
userRouter.post('/verify', verifyUser);
userRouter.post('/create', createUser);

export { userRouter };
