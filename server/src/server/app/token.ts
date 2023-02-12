import jsonwebToken from 'jsonwebtoken';
import { Response } from 'express';
import { UserDoc } from '../../model';

const secret = '__hack__this';
function createToken(payload: UserDoc) {
  const authExpireTime = Date.now() + 1000 * 60 * 15;
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

function setAuthToken(res: Response<any, any>, payload: UserDoc) {
  const { auth, refresh } = createToken(payload);
  res.cookie('jwt', auth.authToken, {
    httpOnly: true,
    expires: new Date(auth.authExpireTime),
  });
  res.cookie('jwt', refresh.refreshToken, {
    httpOnly: true,
    expires: new Date(refresh.refreshExpireTime),
  });
}

export { setAuthToken };
