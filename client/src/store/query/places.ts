import { useQuery } from 'react-query';
import { fetchFn } from '../api/baseUrl';
import { ServerAccomodationData } from '../../component/place/form';

const usePlacesQuery = () =>
  useQuery({
    queryFn: (context) =>
      fetchFn((baseUrl) =>
        fetch(`${baseUrl}/place/user/`, { credentials: 'include' })
      )(context).then<Array<ServerAccomodationData>>((response) => {
        if (response.ok) {
          return response.json();
        }
        throw response.json();
      }),
    queryKey: ['places'],
    staleTime: Infinity,
  });

export { usePlacesQuery };
