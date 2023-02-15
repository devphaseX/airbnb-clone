import { RequestHandler } from 'express';

type LogoutUser = RequestHandler;
const logout: LogoutUser = async (req, res) => {
  try {
    console.log(req.session, req.cookies);

    req.session.destroy((err) => {
      console.log('destroy session');
      if (!err) {
        res.clearCookie('userId');
        res.status(204).send('ok');
      }
    });
  } catch (e) {}
};

export { logout };
