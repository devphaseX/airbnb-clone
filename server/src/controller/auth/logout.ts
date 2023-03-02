import { RequestHandler } from 'express';
import {
  ACCESS_TOKEN_NAME,
  REFRESH_TOKEN_NAME,
  createCookieConfig,
} from '../../server/app/token';

type LogoutUser = RequestHandler;
const logout: LogoutUser = async (_, res, next) => {
  try {
    res.clearCookie(ACCESS_TOKEN_NAME, createCookieConfig());
    res.clearCookie(REFRESH_TOKEN_NAME, createCookieConfig());
    return res.status(200).send('Done');
  } catch (e) {
    next(e);
  }
};

export { logout };
