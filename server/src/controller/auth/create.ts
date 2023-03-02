import { RequestHandler } from 'express';
import { User, UserCreateFormData, userCreateDocSchema } from '../../model';

type CreateUserHandler = RequestHandler<any, any, Required<UserCreateFormData>>;

const createUser: CreateUserHandler = async (req, res, next) => {
  try {
    const data = await userCreateDocSchema.parseAsync(req.body);
    if (await User.findOne({ email: data.email })) {
      return res.status(305).json({});
    }

    const user = await User.create(data);
    user.password = undefined;
    return res.status(200).send();
  } catch (e) {
    next(e);
  }
};

export { createUser };
