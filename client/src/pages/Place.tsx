import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { fetchFn } from '../store/api/baseUrl';
import type { ServerAccomodationData } from '../component/userPlace/form';
import '../style/place.css';
import { BookingForm } from '../component/BookingForm';
import { getItemId } from '../util';
import { useState } from 'react';

const Place = () => {
  const placeData = useLoaderData() as ServerAccomodationData;
  console.log(placeData.checkin, placeData.checkout);
  const [displayOrderImages, setDisplayOrderImages] = useState(
    placeData.photos.slice(0, 3)
  );
  return (
    <div>
      <div className="section-wrapper place-heroes-section">
        <div className="place-heroes">
          <div className="place-content-meta">
            <div>
              <h2>{placeData.title}</h2>
            </div>
            <div className="place-content-action">
              <div className="place-content__address">
                <p>{placeData.address}</p>
              </div>
              <div className="place-content__op">
                <div className="place-op__item">
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                  </span>
                  <span>Share</span>
                </div>
                <div className="place-op__item">
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                      />
                    </svg>
                  </span>
                  <span>Save</span>
                </div>
              </div>
            </div>
          </div>
          {/* Background */}
          <div
            className={`place-images ${
              displayOrderImages.length > 1
                ? `place-images-${displayOrderImages.length}`
                : ''
            }`}
          >
            {displayOrderImages.map((photo) => (
              <img
                src={photo.imgUrlPath}
                key={getItemId(photo)}
                loading="lazy"
                onClick={() => {
                  let [currentMainPhotoId, currentClickedPhotoId] = [
                    getItemId(displayOrderImages[0]),
                    getItemId(photo),
                  ];

                  if (currentClickedPhotoId === currentMainPhotoId) return;

                  setDisplayOrderImages((currentDisplayOrder) =>
                    currentDisplayOrder
                      .slice(0)
                      .sort((a) =>
                        getItemId(a) === currentClickedPhotoId ? -1 : 0
                      )
                  );
                }}
              />
            ))}
            {placeData.photos.length > 3 ? (
              <div className="show-more-tag place-op__item">
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                </span>
                <span>Show more photos</span>
              </div>
            ) : null}
          </div>
        </div>
        <div className="place-info">
          <div className="place-info__content">
            <h3>Luxury stay in {placeData.address}</h3>
            <div className="place-info__access">
              <span>${placeData.maxGuests} guests</span>
            </div>
            <div className="place-info__desc">{placeData.description}</div>
          </div>
          <div className="place-booking">
            <BookingForm
              placeId={getItemId(placeData)}
              pricePerNight={placeData.price}
              checkinDate={new Date(2023, 3, 17)}
              checkoutDate={new Date(2023, 3, 23)}
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
