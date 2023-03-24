import { UseMutationOptions, useMutation } from 'react-query';
import { fetchFn } from '../api/baseUrl';

import type {
  ClientAccomodationFormData,
  ServerAccomodationData,
} from '../../component/userPlace/form';
import { getItemId } from '../../util';

interface CreatePlaceContext {
  previousPlaces?: Array<ServerAccomodationData>;
}

type UseCreatePlaceOption = Omit<
  UseMutationOptions<
    Response,
    unknown,
    ClientAccomodationFormData,
    CreatePlaceContext
  >,
  'mutationFn'
>;

const useCreatePlace = (option?: UseCreatePlaceOption) =>
  useMutation({
    mutationFn: (data: ClientAccomodationFormData) =>
      fetchFn((baseUrl) =>
        fetch(
          getItemId(data as any)
            ? `${baseUrl}/place/user/${getItemId(data as any)}`
            : `${baseUrl}/place/user/create`,
          {
            credentials: 'include',
            body: JSON.stringify(data),
            headers: { 'content-type': 'application/json' },
            method: data.id ? 'PUT' : 'POST',
          }
        )
      )(),

    ...option,
  });

export { useCreatePlace };
