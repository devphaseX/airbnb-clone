import bcrypt from 'bcrypt';
import { RequestHandler } from 'express';
import {
  User,
  UserCreateFormData,
  userAuthDocSchema,
  userCreateDocSchema,
} from '../model';
import { UserLoginFormData } from '../model';
import { setAuthToken } from '../server/app/token';
import { z } from 'zod';
import { comparePassword } from './auth/encrypt';

type SignInHandler = RequestHandler<any, any, UserLoginFormData>;

const signIn: SignInHandler = async (req, res) => {
  try {
    const authData = userAuthDocSchema.parse(req.body);
    const user = await User.findOne({ email: authData.email });
    if (!user) {
      return res.status(404).send();
    }

    if (!(await comparePassword(user, authData.password))) {
      return res.status(404).json({});
    }

    user.password = undefined;
    setAuthToken(res, user);
    return res.status(200).json({ data: user });
  } catch (e) {
    console.log(e);
  }
};
export { signIn };

type CreateUserHandler = RequestHandler<any, any, UserCreateFormData>;

const createUser: CreateUserHandler = async (req, res) => {
  try {
    const data = await userCreateDocSchema.parseAsync(req.body);
    if (await User.findOne({ email: data.email })) {
      return res.status(305).json({});
    }

    const user = await User.create(data);
    user.password = undefined;
    setAuthToken(res, user);
    return res.status(200).json(user);
  } catch (e) {
    console.log(e);
  }
};

const parseEmailSchema = (email: string | { email: string }) =>
  z
    .string()
    .email()
    .parse(typeof email === 'object' ? email.email : email);

type VerifyUserHandler = RequestHandler<any, any, string | { email: string }>;

const verifyUser: VerifyUserHandler = async (req, res) => {
  try {
    const email = parseEmailSchema(req.body);
    const user = await User.findOne({ email });
    return res.status(200).json({ exist: !!user });
  } catch (e) {}
};

export { verifyUser, createUser };
