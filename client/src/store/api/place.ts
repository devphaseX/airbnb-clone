import { useMutation } from 'react-query';
import { fetchFn } from './baseUrl';
import { PlaceSchemaShapeMapStringId } from '../../../../server/src/model';

const useNewPlaceMutation = () =>
  useMutation({
    mutationFn: (data: PlaceSchemaShapeMapStringId) =>
      fetchFn((baseUrl) =>
        fetch(`${baseUrl}/place`, {
          method: 'POST',
          body: JSON.stringify(data),
          credentials: 'include',
        })
      )(),
  });

export { useNewPlaceMutation };
