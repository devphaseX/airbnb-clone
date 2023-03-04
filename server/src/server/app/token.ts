import jsonwebToken, { JwtPayload } from 'jsonwebtoken';
import { Response } from 'express';
import { UserDoc } from '../../model';
import { CookieOptions } from 'express';
import { Request } from 'express';

const ACCESS_TOKEN_NAME = 'access';
const REFRESH_TOKEN_NAME = 'refresh';

type AuthTokenPayload = { email: string } & JwtPayload;
type GetAuthTokenPayloadFn<T> = (value: T) => AuthTokenPayload;

const getAuthTokenPayload: GetAuthTokenPayloadFn<UserDoc> = (user) => ({
  email: user.email!,
});

const secret = '__hack__this';
const getAccessTokenExpireTime = () => Date.now() + 1000 * 60 * 60 * 15;
const getRefreshTokenExpireTime = () => Date.now() + 1000 * 60 * 60 * 24 * 30;
function createToken(
  user: UserDoc,
  getPayload: GetAuthTokenPayloadFn<UserDoc>
) {
  const authExpireTime = getAccessTokenExpireTime();

  const payload = getPayload(user);
  const authToken = jsonwebToken.sign(payload, secret, {
    expiresIn: authExpireTime,
  });

  const refreshExpireTime = getRefreshTokenExpireTime();

  const refreshToken = jsonwebToken.sign(payload, secret, {
    expiresIn: refreshExpireTime,
  });

  return {
    auth: { authToken, authExpireTime },
    refresh: { refreshToken, refreshExpireTime },
  };
}

const createCookieConfig = (option?: CookieOptions): CookieOptions => ({
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  ...option,
});

function setAuthToken(res: Response<any, any>, payload: UserDoc) {
  const { auth, refresh } = createToken(payload, getAuthTokenPayload);
  res.cookie(
    ACCESS_TOKEN_NAME,
    auth.authToken,
    createCookieConfig({ maxAge: auth.authExpireTime - Date.now() + 1000 })
  );
  res.cookie(
    REFRESH_TOKEN_NAME,
    refresh.refreshToken,
    createCookieConfig({
      maxAge: refresh.refreshExpireTime - Date.now() + 1000,
    })
  );
}

function getAuthToken(req: Request<any, any>) {
  return {
    [REFRESH_TOKEN_NAME]: req.cookies[REFRESH_TOKEN_NAME],
    [ACCESS_TOKEN_NAME]: req.cookies[ACCESS_TOKEN_NAME],
  };
}

function decodeToken(token: string) {
  return jsonwebToken.decode(token) as AuthTokenPayload | null;
}

type AuthCookie = { accessToken?: string; refreshToken?: string };

export {
  setAuthToken,
  ACCESS_TOKEN_NAME,
  REFRESH_TOKEN_NAME,
  getAuthToken,
  decodeToken,
  createCookieConfig,
};
export type { AuthCookie };
