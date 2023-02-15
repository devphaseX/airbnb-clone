import { ExtraOption, fetchFn } from './baseUrl';
import type { LoginCred } from './loginApi';

const verifyUserApi = (cred: Pick<LoginCred, 'email'>, option?: ExtraOption) =>
  fetchFn((baseUrl) =>
    fetch(`${baseUrl}/auth/verify`, {
      body: JSON.stringify(cred),
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      ...option,
      credentials: 'include',
    })
  )();

export { verifyUserApi };
