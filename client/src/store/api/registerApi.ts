import { fetchFn, ExtraOption, RegisterFormData } from './baseUrl';

const registerUserApi = (cred: RegisterFormData, option?: ExtraOption) => {
  return fetchFn((baseUrl) =>
    fetch(`${baseUrl}/auth/create`, {
      body: JSON.stringify(cred),
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      ...option,
    })
  )();
};

export { registerUserApi };
