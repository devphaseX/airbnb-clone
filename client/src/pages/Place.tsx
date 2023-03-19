import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { fetchFn } from '../store/api/baseUrl';
import type { ServerAccomodationData } from '../component/userPlace/form';
import '../style/place.css';
import { BookingForm } from '../component/BookingForm';
import { getItemId } from '../util';

const Place = () => {
  const placeData = useLoaderData() as ServerAccomodationData;
  return (
    <div>
      <div className="section-wrapper">
        <div className="place-heroes">
          <div>
            <div>
              <h2>{placeData.title}</h2>
            </div>
            <div>
              <div>
                <p>{placeData.address}</p>
              </div>
              <div>
                <span>Share</span>
                <span>Save</span>
              </div>
            </div>
          </div>
          {/* Background */}
          <div>
            <img
              src={placeData.photoTag.imgUrlPath}
              alt={placeData.photoTag.id}
            />
          </div>
        </div>
        <div>
          <div>
            <h3>Luxury stay in ${placeData.address}</h3>
            <div>
              <span>${placeData.maxGuests} guests</span>
            </div>
          </div>
          <div>
            <BookingForm
              placeId={getItemId(placeData)}
              pricePerNight={placeData.price}
            />
          </div>
        </div>
      </div>
    </div>
  );
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
