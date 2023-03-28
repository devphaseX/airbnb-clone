import { useLayoutEffect, useState, useRef, useEffect, type FC } from 'react';
import { differenceInCalendarDays, addDays, endOfMonth } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { TagInput } from '../input';
import './style.css';
import { useMemo } from 'react';

type DatePickerFn = (date: Date | null) => void;

interface TimeCheck {
  currentPicked?: Date;
  pickDate: DatePickerFn;
}

type PlacementTime = { from: Date; to: Date };
interface DoubleDatePickerProps {
  closePicker: () => void;
  checkin: TimeCheck;
  checkout: TimeCheck;
  checkPlacement: Array<PlacementTime>;
  active: 1 | 2;
  setActive: (state: DoubleDatePickerProps['active']) => void;
}

const pickedAvailablePlacement = (
  duration: Array<PlacementTime>,
  choosenTime: Date
) =>
  duration.find(
    (placement) => choosenTime >= placement.from && choosenTime <= placement.to
  );

const resetSymbol = Symbol();

const datePattern = /(?<month>\d{1,2})\/(?<day>\d{1,2})\/(?<year>\d{4})/;

const DoubleDatePicker: FC<DoubleDatePickerProps> = ({
  active,
  setActive,
  checkin,
  checkout,
  closePicker,
  checkPlacement: unsortedCheckPlacement,
}) => {
  const checkinRef = useRef<HTMLButtonElement | null>(null);
  const checkoutRef = useRef<HTMLButtonElement | null>(null);

  const [userPickedCheckin, setUserPickedCheckin] = useState<Date | null>(
    checkin.currentPicked ?? null
  );

  const [userPickedCheckout, setUserPickedCheckout] = useState<Date | null>(
    checkout.currentPicked ?? null
  );

  const checkPlacement = useMemo(() => {
    if (active === 1) {
      return unsortedCheckPlacement.sort((a, b) =>
        new Date(a.from).getTime() <= new Date(b.from).getTime() &&
        new Date(a.to) <= new Date(b.to)
          ? -1
          : 0
      );
    } else {
      if (userPickedCheckin) {
        const checkout = pickedAvailablePlacement(
          unsortedCheckPlacement,
          userPickedCheckin
        );

        if (checkout) return [checkout];
      }
      return [];
    }
  }, [unsortedCheckPlacement, active, userPickedCheckin]);

  const [currentNavigateYear, setCurrentNavigateYear] = useState(
    checkPlacement.at(-1)!.to.getFullYear()
  );

  const defaultPlacement = useMemo<PlacementTime>(
    () => checkPlacement[0]!,
    [checkPlacement]
  );

  const offPlacements = useMemo(() => {
    if (checkPlacement.length) {
      const startOffDate = { from: new Date(0), to: checkPlacement[0].from };

      const offDates = checkPlacement.map((first, i, list) =>
        i === 0 ? first : { from: addDays(list[i - 1].to, 1), to: first.from }
      );

      if (startOffDate) offDates[0] = startOffDate;

      offDates.push({
        from: addDays(checkPlacement.at(-1)!.to, 1),
        to: endOfMonth(new Date(currentNavigateYear, 11)),
      });

      return offDates;
    }
    return [{ from: new Date(0), to: endOfMonth(new Date()) }];
  }, [checkPlacement, currentNavigateYear, active]);

  const { startDate, endDate } = useMemo(() => {
    const [start, end] =
      checkPlacement.length === 1
        ? [checkPlacement[0], checkPlacement[0]]
        : checkPlacement.slice(0, 2);

    return { startDate: start.from, endDate: end.to };
  }, [checkPlacement]);

  const [userEnteredCheckin, setUserEnteredCheckin] = useState<null | string>(
    null //result to default checkout mode by setting to null
  );
  const [userEnteredCheckout, setUserEnteredCheckout] = useState<string | null>(
    null //due to multiple checkin duration cannot infer the checkout so we result to input mode empty string
  );

  const { pickDate: pickCheckinDate, currentPicked: pickedFrom } = checkin;
  const { pickDate: pickCheckoutDate, currentPicked: pickedTo } = checkout;

  const [userDatePickerFn, currentMarkedDate] =
    active === 1
      ? [setUserPickedCheckin, pickedFrom]
      : [setUserPickedCheckout, pickedTo];

  const logDuration =
    (userPickedCheckout &&
      userPickedCheckin &&
      differenceInCalendarDays(userPickedCheckout, userPickedCheckin)) ??
    null;

  useEffect(() => {
    pickCheckinDate(userPickedCheckin ?? new Date(defaultPlacement.from));
    pickCheckoutDate(userPickedCheckout);
  }, [userPickedCheckin, userPickedCheckout]);

  useEffect(() => {
    if (
      userDatePickerFn === null ||
      !userPickedCheckin ||
      (userPickedCheckout &&
        (pickedAvailablePlacement(checkPlacement, userPickedCheckin) !==
          pickedAvailablePlacement(checkPlacement, userPickedCheckout) ||
          userPickedCheckout < userPickedCheckin))
    ) {
      setUserEnteredCheckout('');
      setUserPickedCheckout(null);
    }
  }, [userPickedCheckin]);

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
          event.nativeEvent.stopImmediatePropagation();
        }}
      >
        <div>
          <h3>
            {logDuration !== null && userPickedCheckin && userPickedCheckout
              ? `${logDuration} day${logDuration > 1 ? 's' : ''}`
              : 'Select date'}
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
                setUserEnteredCheckin(
                  userPickedCheckin?.toLocaleDateString() ??
                    checkin.currentPicked?.toLocaleDateString() ??
                    ''
                );
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
                defaultPlacement.from.toLocaleString()
              }
              onChange={(event) => {
                setUserEnteredCheckin((event.target as HTMLInputElement).value);
                event.stopPropagation();
              }}
              onBlur={() => {
                if (userEnteredCheckin) setUserEnteredCheckin(null);
              }}
              forceLabelShow
              Icon={() => (
                <span
                  className="cancel-icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    setUserPickedCheckin(defaultPlacement.from);
                    setUserEnteredCheckin(null);
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
            onClickCapture={(event) => {
              if (
                (event.target as HTMLElement).tagName.toLowerCase() === 'input'
              ) {
                if (userEnteredCheckout === null) setUserEnteredCheckout('');
              }

              setActive(2);
            }}
            ref={checkoutRef}
          >
            <TagInput
              label="checkout"
              type="text"
              value={
                userEnteredCheckout ??
                userPickedCheckout?.toLocaleDateString() ??
                ''
              }
              onBlur={() => {
                if (userEnteredCheckout === '') setUserEnteredCheckout(null);
              }}
              onChange={(event) => {
                setUserEnteredCheckout(
                  (event.target as HTMLInputElement).value
                );
                event.stopPropagation();
              }}
              placeholder="MM/DD/YYYY"
              forceLabelShow
              Icon={() => (
                <span
                  className="cancel-icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    setUserPickedCheckout(null);
                    setUserEnteredCheckout('');
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
        pagedNavigation
        selected={currentMarkedDate}
        month={currentMarkedDate}
        fromDate={startDate}
        toDate={endDate}
        disabled={offPlacements}
        onSelect={(date) => {
          if (date) {
            userDatePickerFn(date);

            if (
              userDatePickerFn === setUserPickedCheckout &&
              userEnteredCheckin !== null
            ) {
              setUserEnteredCheckout(null);
            }

            if (
              userDatePickerFn === setUserPickedCheckin &&
              userEnteredCheckout !== null
            ) {
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
          onClick={(event) => {
            if (
              (event.currentTarget as HTMLElement).contains(
                event.target as HTMLElement
              )
            ) {
              setUserPickedCheckin(defaultPlacement.from);
              setUserPickedCheckout(null);
            }
          }}
        >
          Clear dates
        </button>
        <button
          type="button"
          className="close-button"
          onClick={(event) => {
            if (
              (event.currentTarget as HTMLElement).contains(
                event.target as HTMLElement
              )
            ) {
              closePicker();
              event.stopPropagation();
            }
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export { DoubleDatePicker };
