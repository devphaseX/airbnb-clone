import { fetchFn } from './baseUrl';

const logoutUserApi = fetchFn((baseUrl) =>
  fetch(`${baseUrl}/auth/logout`, { method: 'DELETE', credentials: 'include' })
);

export { logoutUserApi };
