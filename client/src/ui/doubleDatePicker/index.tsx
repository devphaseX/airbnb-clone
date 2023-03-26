import { useLayoutEffect, useState, useRef, useEffect, type FC } from 'react';
import {
  differenceInCalendarDays,
  addDays,
  endOfMonth,
  addYears,
  subDays,
} from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { TagInput } from '../input';
import { useUnmountStatus } from '../../hooks/useUnmount';
import './style.css';
import { useMemo } from 'react';

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

type PlacementTime = { from: Date; to: Date };
interface DoubleDatePickerProps {
  closePicker: () => void;
  checkin: CheckinTime;
  checkout: CheckoutTime;
  checkPlacement: Array<PlacementTime>;
}

const resetSymbol = Symbol();

const DoubleDatePicker: FC<DoubleDatePickerProps> = ({
  checkin,
  checkout,
  closePicker,
  checkPlacement,
}) => {
  const [active, setActive] = useState<1 | 2>(1);
  const checkinRef = useRef<HTMLButtonElement | null>(null);
  const checkoutRef = useRef<HTMLButtonElement | null>(null);
  const [userPickedCheckin, setUserPickedCheckin] = useState<Date | null>(
    new Date(checkin.currentPicked ?? checkin.fromDate)
  );
  const [userPickedCheckout, setUserPickedCheckout] = useState<Date | null>(
    new Date(checkout.currentPicked ?? checkout.toDate)
  );

  const [currentNavigateYear, setCurrentNavigateYear] = useState(
    checkPlacement.at(-1)!.to.getFullYear()
  );

  const logBoundary = useMemo(
    () => ({
      from: addDays(checkPlacement.at(-1)!.to, 1),
      to: endOfMonth(new Date(currentNavigateYear, 11)),
    }),
    [checkPlacement, currentNavigateYear]
  );

  const offPlacements = useMemo(() => {
    const offDates = checkPlacement
      .slice(0)
      .sort((a, b) =>
        new Date(a.from).getTime() <= new Date(b.from).getTime() &&
        new Date(a.to) <= new Date(b.to)
          ? -1
          : 0
      )
      .map((first, i, list) =>
        i === 0
          ? {
              from: new Date(
                first.from.getFullYear(),
                first.from.getMonth(),
                1
              ),
              to: subDays(first.from, 1),
            }
          : { from: subDays(list[i].from, 1), to: first.to }
      );

    offDates.unshift({
      from: new Date(0),
      to: new Date(checkPlacement.at(0)!.from),
    });
    return offDates;
  }, [checkPlacement]);

  const [userEnteredCheckin, setUserEnteredCheckin] = useState<null | string>(
    ''
  );
  const [userEnteredCheckout, setUserEnteredCheckout] = useState<
    string | typeof resetSymbol | null
  >('');

  const getUnmountStatus = useUnmountStatus();
  let { fromDate, pickDate: pickCheckinDate } = checkin;
  let { toDate, pickDate: pickCheckoutDate } = checkout;

  const [userDatePickerFn, currentMarkedDate] =
    active === 1
      ? [setUserPickedCheckin, userPickedCheckin]
      : [setUserPickedCheckout, userPickedCheckout];

  const logDuration = differenceInCalendarDays(new Date(), new Date());

  useEffect(() => {
    return () => {
      if (getUnmountStatus()) {
        // pickCheckinDate(userPickedCheckin);
        // pickCheckoutDate(userPickedCheckout);
      }
    };
  });

  console.log({
    userEnteredCheckout,
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
      <header
        className="date-picker__header"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div>
          <h3>
            {logDuration} day{logDuration > 1 ? 's' : ''}
          </h3>
          <p>Add your traveling date for exact pricing</p>
        </div>
        <div className="date-picker__action">
          <button
            type="button"
            onClickCapture={(event) => {
              if (
                (event.target as HTMLElement).tagName.toLowerCase() === 'input'
              ) {
                setUserEnteredCheckout('');
              } else {
                event.preventDefault();
              }
              setActive(1);
            }}
            ref={checkinRef}
          >
            <TagInput
              label="checkin"
              type="text"
              value={
                userEnteredCheckin ??
                userPickedCheckin?.toLocaleDateString() ??
                checkin.fromDate.toLocaleString()
              }
              onChange={(event) => {
                setUserEnteredCheckin((event.target as HTMLInputElement).value);
              }}
              forceLabelShow
              Icon={() => (
                <span
                  className="cancel-icon"
                  onClick={(event) => {
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
          <button
            type="button"
            onClick={(event) => {
              if (
                (event.target as HTMLElement).tagName.toLowerCase() === 'input'
              ) {
                if (userEnteredCheckout !== resetSymbol)
                  setUserEnteredCheckout(resetSymbol);
              } else {
                event.preventDefault();
              }
              setActive(2);
            }}
            ref={checkoutRef}
          >
            <TagInput
              label="checkout"
              type="text"
              value={
                userEnteredCheckout === resetSymbol
                  ? ''
                  : userEnteredCheckout ??
                    (userPickedCheckout?.toLocaleDateString() || '')
              }
              onChange={(event) => {
                setUserEnteredCheckout(
                  (event.target as HTMLInputElement).value
                );
              }}
              placeholder="MM/DD/YYYY"
              forceLabelShow
              Icon={() => (
                <span
                  className="cancel-icon"
                  onClick={(event) => {
                    event.stopPropagation();
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
        // selected={currentMarkedDate}
        disabled={[...offPlacements, logBoundary]}
        onSelect={(date) => {
          if (date) {
            userDatePickerFn(date);

            if (userDatePickerFn === setUserPickedCheckout) {
              setUserEnteredCheckout(null);
            }

            if (userDatePickerFn === setUserPickedCheckin) {
              setUserEnteredCheckin(null);
            }
          }
        }}
        onMonthChange={(date) =>
          date.getMonth() === 10 &&
          setCurrentNavigateYear(currentNavigateYear + 1)
        }
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
