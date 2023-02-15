import { RequestHandler } from 'express';
import { User } from '../../model';
type ProfileHandler = RequestHandler;

const getProfile: ProfileHandler = async (req, res) => {
  try {
    const userCookieToken = (req.session as Partial<Record<string, any>>)
      ?.user as null | {
      _id: string;
      email: string;
    };
    if (userCookieToken) {
      const user = await User.findOne({ _id: userCookieToken._id }).select(
        '-password'
      );
      if (user) {
        return res.status(201).json(user);
      }
      return res.status(404).send('not found');
    } else {
      res.status(404).send('not found');
    }
  } catch (e) {
    console.log(e);
    return res.status(404).send('something went wrong');
  }
};

export { getProfile };
