import { Mutex } from 'async-mutex';
import type { QueryFunctionContext } from 'react-query';

const EXPIRED_TOKEN_STATUS = 401;

const mutex = new Mutex();
const createQueryFn = (
  baseUrl: string,
  refreshToken: (baseUrl: string) => Promise<Response>
) => {
  return (
      fetchFn: (
        baseUrl: string,
        context?: QueryFunctionContext
      ) => Promise<Response>
    ) =>
    async (context?: QueryFunctionContext) => {
      if (mutex.isLocked()) await mutex.waitForUnlock();
      let startFetch = false;
      let allowTokenRefresh = false;
      let otherTryToRefreshToken: boolean = false;
      let response: Response;
      while (!startFetch || allowTokenRefresh || otherTryToRefreshToken) {
        startFetch = true;
        response = await fetchFn(baseUrl, context);
        if ((allowTokenRefresh && !response.ok) || otherTryToRefreshToken)
          break;

        if (
          !response.ok &&
          response.status === EXPIRED_TOKEN_STATUS &&
          !allowTokenRefresh
        ) {
          otherTryToRefreshToken = await mutex.isLocked();
          if (otherTryToRefreshToken) continue;
          const releaseLock = await mutex.acquire();
          try {
            const refreshTokenResponse = await refreshToken(baseUrl);
            allowTokenRefresh = refreshTokenResponse.ok;
          } finally {
            releaseLock();
          }
        } else {
          break;
        }
      }
      return response!;
    };
};

export { createQueryFn };

const BASE_URL = 'http://127.0.0.1:5001';

const fetchFn = createQueryFn(BASE_URL, async (baseUrl) => {
  return await fetch(`${baseUrl}/auth/refresh`, { credentials: 'include' });
});

type ExtraOption = { signal?: AbortSignal };

type LoginFormData = { email: string; password: string };
type RegisterFormData = LoginFormData & {
  firstName: string;
  lastName: string;
  birthday: string;
};

type AuthFormData = LoginFormData | RegisterFormData;

export { fetchFn, BASE_URL };
export type { ExtraOption, LoginFormData, RegisterFormData, AuthFormData };
