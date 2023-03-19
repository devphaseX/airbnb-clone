import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { BookingDoc } from '../../../../server/src/model';
import { useStore } from 'zustand';
import { clientInfoStore } from '../../store/slice/user';
import { useLayoutEffect } from 'react';
import { fetchFn } from '../../store/api/baseUrl';

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
    <div style={{ fontSize: '1.8rem' }}>
      <div>
        <h4>${pricePerNight} night</h4>
        <p>reviews</p>
      </div>
      <div>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            console.log(getValues());
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
          <div>
            <input type="date" {...register('checkIn')} />
            <input type="date" {...register('checkOut')} />
          </div>
          <div>
            <div></div>
            <div>
              <p>
                {guests} guest${guests > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div></div>
          <div>
            <button type="submit">Reserve</button>
            <p>You won't be charged yet.</p>
          </div>
        </form>
      </div>
      <div>
        <div>
          <p>
            <span>
              ${pricePerNight}x${durationPeriod}nights
            </span>
          </p>
          <span>${totalBookingCost}</span>
        </div>
        <div>
          <p>Total before taxes</p>
          <p>${totalBookingCost}</p>
        </div>
      </div>
    </div>
  );
};

export { BookingForm };
