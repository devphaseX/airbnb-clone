import { RequestHandler } from 'express';
import { AuthCookie } from '../../server/app/token';

type LogoutUser = RequestHandler;
const logout: LogoutUser = async (req, res) => {
  try {
    console.log(req.cookies, req.session);
    // const { accessToken, refreshToken } = req.cookies as AuthCookie;
    // if (accessToken) {
    // }

    res.clearCookie('userId');
    res.status(204).send('ok');
  } catch (e) {}
};

export { logout };
