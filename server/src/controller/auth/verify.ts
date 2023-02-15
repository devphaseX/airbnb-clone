import { RequestHandler } from 'express';
import { User } from '../../model';
import { z } from 'zod';

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

export { verifyUser };
