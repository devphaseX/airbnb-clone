import jsonwebToken from 'jsonwebtoken';
import { Response } from 'express';
import { UserDoc } from '../../model';
import { getEnv } from '../config/env';
import { CookieOptions } from 'express';

const secret = '__hack__this';
function createToken(payload: UserDoc) {
  const authExpireTime = Date.now() + 1000 * 60 * 60 * 15;
  const authToken = jsonwebToken.sign({ email: payload.email }, secret, {
    expiresIn: authExpireTime,
  });

  const refreshExpireTime = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const refreshToken = jsonwebToken.sign({ email: payload.email }, secret, {
    expiresIn: refreshExpireTime,
  });

  return {
    auth: { authToken, authExpireTime },
    refresh: { refreshToken, refreshExpireTime },
  };
}

const createCookieConfig = (option: CookieOptions): CookieOptions => ({
  httpOnly: false,
  secure: getEnv().NODE_ENV === 'production',
  ...option,
});

function setAuthToken(res: Response<any, any>, payload: UserDoc) {
  const { auth, refresh } = createToken(payload);
  res.cookie(
    'access-token',
    auth.authToken,
    createCookieConfig({ maxAge: 5700000 })
  );
  res.cookie(
    'refresh-token',
    refresh.refreshToken,
    createCookieConfig({ maxAge: 5700000 })
  );
}

type AuthCookie = { accessToken?: string; refreshToken?: string };

export { setAuthToken };
export type { AuthCookie };
