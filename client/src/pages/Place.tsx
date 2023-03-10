import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { fetchFn } from '../store/api/baseUrl';
import type { ServerAccomodationData } from '../component/userPlace/form';

const Place = () => {
  const placeData = useLoaderData() as ServerAccomodationData;
  return <div>{JSON.stringify(placeData)}</div>;
};

export { Place };

const placeLoader: LoaderFunction = async ({ params, request }) => {
  const placeId = params.placeId;
  const response = await fetchFn((baseUrl) =>
    fetch(`${baseUrl}/place/item/${placeId}`, { credentials: 'include' })
  )({ signal: request.signal });

  if (response.ok) return response.json();
  throw new Error(await response.json());
};
export { placeLoader };
