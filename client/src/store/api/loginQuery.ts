import { fetchFn, ExtraOption } from './baseUrl';
import { UserLoginFormData } from '../../../../server/src/model/user';

type LoginCred = Required<UserLoginFormData>;
const logUserApi = (cred: LoginCred, option?: ExtraOption) =>
  fetchFn((baseUrl) =>
    fetch(`${baseUrl}/auth/login`, {
      body: JSON.stringify(cred),
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      ...option,
    })
  )();

const verifyUserApi = (cred: Pick<LoginCred, 'email'>, option?: ExtraOption) =>
  fetchFn((baseUrl) =>
    fetch(`${baseUrl}/auth/verify`, {
      body: JSON.stringify(cred),
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      ...option,
    })
  )();

export { logUserApi, verifyUserApi };
export type {};
