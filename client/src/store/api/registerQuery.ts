import { fetchFn, ExtraOption, RegisterFormData } from './baseUrl';

const registerUserApi = (cred: RegisterFormData, option?: ExtraOption) =>
  fetchFn((baseUrl) =>
    fetch(`${baseUrl}/auth/register`, {
      body: JSON.stringify(cred),
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      ...option,
    })
  )();

export { registerUserApi };
