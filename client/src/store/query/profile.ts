import { useQuery } from 'react-query';
import { fetchFn } from '../api/baseUrl';
import { UserDoc } from '../../../../server/src/model';

const useProfile = () =>
  useQuery({
    queryKey: ['profile'],
    queryFn: async (context) => {
      const response = await fetchFn((baseUrl) =>
        fetch(`${baseUrl}/auth/profile`, {
          credentials: 'include',
          method: 'get',
        })
      )(context);

      if (response.ok) {
        return (await response.json()) as UserDoc;
      } else {
        throw await response.json();
      }
    },
    retry: false,
    staleTime: Infinity,
  });

export { useProfile };
