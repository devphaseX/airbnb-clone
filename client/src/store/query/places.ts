import { useQuery } from 'react-query';
import { fetchFn } from '../api/baseUrl';
import { ServerAccomodationData } from '../../component/userPlace/form';

type UserPlacesQueryProps = {
  withCredentials?: boolean;
};

const getDefaultOptions = (
  userPreference?: UserPlacesQueryProps
): UserPlacesQueryProps => ({
  withCredentials: false,
  ...userPreference,
});

const usePlacesQuery = (option = getDefaultOptions()) => {
  option = getDefaultOptions(option);
  return useQuery({
    queryFn: (context) =>
      fetchFn((baseUrl) =>
        fetch(
          option.withCredentials
            ? `${baseUrl}/place/user/`
            : `${baseUrl}/place`,
          { ...(option.withCredentials && { credentials: 'include' }) }
        )
      )(context).then<Array<ServerAccomodationData>>((response) => {
        if (response.ok) {
          return response.json();
        }
        throw response.json();
      }),
    queryKey: ['places'],
    staleTime: Infinity,
  });
};

export { usePlacesQuery };
