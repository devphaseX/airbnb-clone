import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { BookingDoc } from '../../../../server/src/model';
import { useStore } from 'zustand';
import { clientInfoStore } from '../../store/slice/user';
import { useLayoutEffect } from 'react';
import { fetchFn } from '../../store/api/baseUrl';
import { LogDurationPicker } from '../../ui/duration';
import { GuestSelection } from '../../ui/guestSelection';
import './style.css';

type BookingInfo = BookingDoc;

interface BookingProps {
  placeId: string;
  pricePerNight: number;
}

const BOOKING_LOCAL_KEY = 'BOOKING_LOCAL_KEY';

const BookingForm: FC<BookingProps> = ({ placeId, pricePerNight }) => {
  const { register, getValues, setValue } = useForm<BookingInfo>({
    defaultValues: { guests: 1, placeId, price: pricePerNight },
  });

  const user = useStore(clientInfoStore, ({ user }) => user!);
  const totalBookingCost = pricePerNight * getValues().guests!;
  const durationPeriod = 2;

  const guests = getValues().guests;

  useLayoutEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.localStorage.getItem(BOOKING_LOCAL_KEY)
    ) {
      try {
        let bookingSavedData: BookingInfo = JSON.parse(
          window.localStorage.getItem(BOOKING_LOCAL_KEY) ?? ''
        );

        if (typeof bookingSavedData !== 'undefined') {
          (Object.keys(bookingSavedData) as Array<keyof BookingInfo>).forEach(
            (key) => {
              if (typeof bookingSavedData[key] === 'undefined') {
                throw 0;
              }

              setValue(key, bookingSavedData[key]);
            }
          );
        }
      } catch {}
    }
  }, []);

  return (
    <div className="booking-form">
      <div className="booking-meta">
        <h4>
          <span>${pricePerNight}</span>&nbsp;
          <span>night</span>
        </h4>
        <p>reviews</p>
      </div>
      <div>
        <form
          onSubmit={async (event) => {
            event.preventDefault();

            if (!user) {
              localStorage.setItem(
                BOOKING_LOCAL_KEY,
                JSON.stringify(getValues())
              );
            }

            const response = await fetchFn(async (baseUrl) =>
              fetch(`${baseUrl}/booking`, {
                method: 'post',
                body: JSON.stringify(getValues()),
                credentials: 'include',
                headers: { 'content-type': 'application/json' },
              })
            )();

            if (response.ok) {
            }
          }}
        >
          <div className="guest-group">
            <LogDurationPicker />
            <GuestSelection dropDownItems={[]} />
          </div>

          <div className="booking-action">
            <button>Check availability</button>
            <p>You won't be charged yet.</p>
          </div>
        </form>
      </div>
      <div className="booking-pricing">
        <div className="pricing-per-night">
          <p>
            <span>
              ${pricePerNight} x {durationPeriod}nights
            </span>
          </p>
          <span>${totalBookingCost}</span>
        </div>
        <div className="pricing-actual">
          <p>Total before taxes</p>
          <p>${totalBookingCost}</p>
        </div>
      </div>
    </div>
  );
};

export { BookingForm };
/* 
CALENDAR
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
</svg>
*/
