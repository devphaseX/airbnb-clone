import { RequestHandler } from 'express';
import { User, UserLoginFormData, userAuthDocSchema } from '../../model';
import { comparePassword } from './encrypt';
import { setAuthToken } from '../../server/app/token';

type SignInHandler = RequestHandler<any, any, UserLoginFormData>;

const signIn: SignInHandler = async (req, res, next) => {
  try {
    const authData = userAuthDocSchema.parse(req.body);
    const user = await User.findOne({ email: authData.email });
    if (!user) {
      return res.status(404).send();
    }

    if (!(await comparePassword(user, authData.password))) {
      return res.status(404).json({});
    }

    setAuthToken(res, user);

    return res.status(200).json({
      data: await User.findOne({ email: authData.email }).select('-password'),
    });
  } catch (e) {
    next(e);
  }
};
export { signIn };
