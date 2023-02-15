import { RequestHandler } from 'express';
import { User, UserLoginFormData, userAuthDocSchema } from '../../model';
import { comparePassword } from './encrypt';

type SignInHandler = RequestHandler<any, any, UserLoginFormData>;

const signIn: SignInHandler = async (req, res) => {
  try {
    const authData = userAuthDocSchema.parse(req.body);
    console.log(authData);
    const user = await User.findOne({ email: authData.email });
    if (!user) {
      return res.status(404).send();
    }

    if (!(await comparePassword(user, authData.password))) {
      return res.status(404).json({});
    }

    user.password = undefined;
    (req.session as any).user = { _id: user.id, email: user.email };

    return res.status(200).json({ data: user });
  } catch (e) {
    console.log(e);
  }
};
export { signIn };
