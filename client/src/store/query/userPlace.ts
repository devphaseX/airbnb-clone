import { useQuery } from 'react-query';
import { fetchFn } from '../api/baseUrl';
import { ServerAccomodationData } from '../../component/userPlace/form';

const useUserPlaceQuery = () =>
  useQuery({
    queryFn: (context) =>
      fetchFn((baseUrl) =>
        fetch(`${baseUrl}/place/user/${context.queryKey}`, {
          credentials: 'include',
        })
      )(context).then<ServerAccomodationData>((response) => {
        if (response.ok) {
          return response.json();
        }
        throw response.json();
      }),
    queryKey: ['user-places'],
  });

export { useUserPlaceQuery };
