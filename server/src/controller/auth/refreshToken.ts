import { RequestHandler } from 'express';
import { getUserAuthStatus } from './verify';
import { REFRESH_TOKEN_NAME, setAuthToken } from '../../server/app/token';
type RefreshTokenHandler = RequestHandler;

const refreshToken: RefreshTokenHandler = async (req, res, next) => {
  try {
    const token = req.cookies[REFRESH_TOKEN_NAME];
    const authTokenStatus = await getUserAuthStatus(token);
    if (authTokenStatus.type !== 'found') {
      switch (authTokenStatus.type) {
        case 'deleted': {
          return res.status(404).json({ message: authTokenStatus.message });
        }

        case 'invalid': {
          return res.status(403).json({ message: authTokenStatus.message });
        }

        case 'expired': {
          return res.status(401).json({ message: authTokenStatus.message });
        }

        default: {
          return res.status(500).json({ message: 'Internal server error' });
        }
      }
    } else {
      setAuthToken(res, authTokenStatus.user);
      return res
        .status(200)
        .json({ message: 'Access token refresh successfull' });
    }
  } catch (e) {
    next(e);
  }
};

export { refreshToken };
