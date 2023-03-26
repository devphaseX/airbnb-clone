import { useLayoutEffect, useState, useRef, useEffect, type FC } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { TagInput } from '../input';
import { useUnmountStatus } from '../../hooks/useUnmount';
import './style.css';

type DatePickerFn = (date: Date) => void;

interface TimeCheck {
  currentPicked?: Date;
  pickDate: DatePickerFn;
}

interface CheckinTime extends TimeCheck {
  fromDate: Date | string;
}

interface CheckoutTime extends TimeCheck {
  toDate: Date | string;
}
interface DoubleDatePickerProps {
  closePicker: () => void;
  checkin: CheckinTime;
  checkout: CheckoutTime;
}

const DoubleDatePicker: FC<DoubleDatePickerProps> = ({
  checkin,
  checkout,
  closePicker,
}) => {
  const [active, setActive] = useState<1 | 2>(1);
  const checkinRef = useRef<HTMLButtonElement | null>(null);
  const checkoutRef = useRef<HTMLButtonElement | null>(null);
  const [userPickedCheckin, setUserPickedCheckin] = useState(
    new Date(checkin.currentPicked ?? checkin.fromDate)
  );
  const [userPickedCheckout, setUserPickedCheckout] = useState(
    new Date(checkout.currentPicked ?? checkout.toDate)
  );

  const getUnmountStatus = useUnmountStatus();

  let { fromDate, pickDate: pickCheckinDate } = checkin;
  let { toDate, pickDate: pickCheckoutDate } = checkout;

  const [userDatePickerFn, currentMarkedDate] =
    active === 1
      ? [setUserPickedCheckin, userPickedCheckin]
      : [setUserPickedCheckout, userPickedCheckout];

  useEffect(() => {
    return () => {
      if (getUnmountStatus()) {
        pickCheckinDate(userPickedCheckin);
        pickCheckoutDate(userPickedCheckout);
      }
    };
  });

  useLayoutEffect(() => {
    const checkinButton = checkinRef.current;
    const checkoutButton = checkoutRef.current;
    if (!(checkinButton && checkoutButton)) return;
    checkinButton.toggleAttribute('active', active === 1);
    checkoutButton.toggleAttribute('active', active === 2);
  }, [active]);

  return (
    <div className="double-date-picker">
      <header className="date-picker__header">
        <div>
          <h3>Select Dates</h3>
          <p>Add your traveling date for exact pricing</p>
        </div>
        <div className="date-picker__action">
          <button type="button" onClick={() => setActive(1)} ref={checkinRef}>
            <TagInput
              label="checkin"
              type="lock"
              value={userPickedCheckin.toLocaleDateString()}
              forceLabelShow
              Icon={() => (
                <span
                  className="cancel-icon"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setUserPickedCheckin(new Date(checkin.fromDate));
                  }}
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </span>
              )}
            />
          </button>
          <button type="button" onClick={() => setActive(2)} ref={checkoutRef}>
            <TagInput
              label="checkout"
              type="lock"
              value={userPickedCheckout.toLocaleDateString()}
              forceLabelShow
              Icon={() => (
                <span
                  className="cancel-icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    setUserPickedCheckout(new Date(checkout.toDate));
                  }}
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </span>
              )}
            />
          </button>
        </div>
      </header>

      <DayPicker
        mode="single"
        numberOfMonths={2}
        selected={currentMarkedDate}
        fromDate={new Date(fromDate)}
        toDate={new Date(toDate)}
        onSelect={(date) => date && userDatePickerFn(date)}
      />
      <div className="date-picker-btn">
        <button
          type="button"
          className="clear-button"
          onClick={() => {
            setUserPickedCheckin(new Date(checkin.fromDate));
            setUserPickedCheckout(new Date(checkout.toDate));
          }}
        >
          Clear dates
        </button>
        <button type="button" className="close-button" onClick={closePicker}>
          Close
        </button>
      </div>
    </div>
  );
};

export { DoubleDatePicker };
