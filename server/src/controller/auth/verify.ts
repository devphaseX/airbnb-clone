import { RequestHandler, Response } from 'express';
import { User, UserDoc } from '../../model';
import { z } from 'zod';
import { ACCESS_TOKEN_NAME, decodeToken } from '../../server/app/token';

const parseEmailSchema = (email: string | { email: string }) =>
  z
    .string()
    .email()
    .parse(typeof email === 'object' ? email.email : email);

type VerifyUserHandler = RequestHandler<any, any, string | { email: string }>;

const verifyUser: VerifyUserHandler = async (req, res) => {
  try {
    const email = parseEmailSchema(req.body);
    const user = await User.findOne({ email });
    return res.status(200).json({ exist: !!user });
  } catch (e) {}
};

type AuthProgessType = 'found' | 'invalid' | 'deleted' | 'expired';
type AuthStatusBase = { type: AuthProgessType };

interface AuthStatusSuccess extends AuthStatusBase {
  type: 'found';
  user: UserDoc;
}

interface AuthStatusInvalidToken extends AuthStatusBase {
  type: 'invalid';
  message: 'The provided token is invalid or has expired. Kindly login to be authenicated';
}

interface AuthStatusTokenExpired extends AuthStatusBase {
  type: 'expired';
  message: 'Expired token. kindly refresh your token login or attached your refresh token to /auth/refresh';
}

interface AuthStatusDeletedUser extends AuthStatusBase {
  type: 'deleted';
  message: 'The token belong to an unknown user';
}

type AuthStatus =
  | AuthStatusSuccess
  | AuthStatusDeletedUser
  | AuthStatusInvalidToken
  | AuthStatusTokenExpired;

async function getUserAuthStatus(authToken?: string): Promise<AuthStatus> {
  if (authToken) {
    const decoded = decodeToken(authToken)!;
    if (decoded && decoded.exp! - decoded.iat! > Date.now()) {
      const user = await User.findOne({ email: decoded.email });
      if (user) {
        return { type: 'found', user };
      } else {
        return {
          type: 'deleted',
          message: 'The token belong to an unknown user',
        };
      }
    }
  }
  return {
    type: 'invalid',
    message:
      'The provided token is invalid or has expired. Kindly login to be authenicated',
  };
}

const protectedAuthRoute =
  (option?: { skipResponse?: boolean }): RequestHandler =>
  async (req, res, next) => {
    const { skipResponse } = option ?? {};
    const accessToken = req.cookies[ACCESS_TOKEN_NAME];

    if (accessToken) {
      const authStatus = await getUserAuthStatus(accessToken);
      switch (authStatus.type) {
        case 'found': {
          req.user = authStatus.user;
          return next();
        }

        case 'deleted': {
          if (skipResponse) return next();
          return res.status(404).json({ message: authStatus.message });
        }
        case 'invalid': {
          return res.status(403).json({ message: authStatus.message });
        }

        case 'expired': {
          return res.status(401).json({ message: authStatus.message });
        }

        default: {
          return res.status(500).json({ message: 'Internal server error' });
        }
      }
    }

    res.status(401).json({ message: 'Kindly login to be authenicated' });
  };
export { verifyUser, getUserAuthStatus, protectedAuthRoute };
