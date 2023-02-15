import { useQuery } from 'react-query';
import { fetchFn } from '../api/baseUrl';
import { UserDoc } from '../../../../server/src/model';

const useProfile = () =>
  useQuery(['profile'], async (context) => {
    const response = await fetchFn((baseUrl) =>
      fetch(`${baseUrl}/auth/profile`, { credentials: 'include' })
    )(context);

    if (response.ok) {
      return (await response.json()) as UserDoc;
    } else {
      throw await response.json();
    }
  });

export { useProfile };
