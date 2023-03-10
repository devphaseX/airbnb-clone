import { useMutation } from 'react-query';
import { fetchFn } from '../api/baseUrl';

import type { ClientAccomodationFormData } from '../../component/userPlace/form';
import { getItemId } from '../../util';

const useCreatePlace = () =>
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
  });

export { useCreatePlace };
