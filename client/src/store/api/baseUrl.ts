import { Mutex } from 'async-mutex';
import type { QueryFunctionContext } from 'react-query';

const EXPIRED_TOKEN_STATUS = 303;

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
      let response: Response;
      while (!startFetch || allowTokenRefresh) {
        startFetch = true;
        response = await fetchFn(baseUrl, context);
        if (!response.ok) {
          if (response.status === EXPIRED_TOKEN_STATUS) {
            allowTokenRefresh = mutex.isLocked();
            if (!mutex.isLocked) {
              let release = await mutex.acquire();
              try {
                const refreshTokenResponse = await refreshToken(baseUrl);
                allowTokenRefresh = refreshTokenResponse.ok;
              } finally {
                release();
              }
            }
          }
        }
      }
      return response!;
    };
};
export { createQueryFn };

const fetchFn = createQueryFn('http://127.0.0.1:5001', async (baseUrl) => {
  return await fetch(`${baseUrl}/auth/refresh`);
});

type ExtraOption = { signal?: AbortSignal };

type LoginFormData = { email: string; password: string };
type RegisterFormData = LoginFormData & {
  firstName: string;
  lastName: string;
  birthday: string;
};

type AuthFormData = LoginFormData | RegisterFormData;

export { fetchFn };
export type { ExtraOption, LoginFormData, RegisterFormData, AuthFormData };
