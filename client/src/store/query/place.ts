import { useQuery } from 'react-query';
import { fetchFn } from '../api/baseUrl';
import { ServerAccomodationData } from '../../component/place/form';

const usePlaceQuery = () =>
  useQuery({
    queryFn: (context) =>
      fetchFn((baseUrl) =>
        fetch(`${baseUrl}/place/${context.queryKey}`, {
          credentials: 'include',
        })
      )(context).then<ServerAccomodationData>((response) => {
        if (response.ok) {
          return response.json();
        }
        throw response.json();
      }),
    queryKey: ['places'],
  });

export { usePlaceQuery };
