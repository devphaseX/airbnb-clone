import { useLayoutEffect, useState, useRef, useEffect, type FC } from 'react';
import {
  differenceInCalendarDays,
  addDays,
  endOfMonth,
  subDays,
  startOfMonth,
} from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { TagInput } from '../input';
import { useUnmountStatus } from '../../hooks/useUnmount';
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
}

const pickedAvailablePlacement = (
  duration: Array<PlacementTime>,
  choosenTime: Date
) =>
  duration.find(
    (placement) => placement.from >= choosenTime && choosenTime <= placement.to
  );

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
  const defaultPlacement = useMemo<PlacementTime>(
    () => checkPlacement[0]!,
    [checkPlacement]
  );
  const [userPickedCheckin, setUserPickedCheckin] = useState<Date | null>(
    new Date(checkin.currentPicked ?? defaultPlacement.from)
  );
  const [userPickedCheckout, setUserPickedCheckout] = useState<Date | null>(
    checkout.currentPicked ?? null
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
              from: startOfMonth(first.from),
              to: subDays(first.from, 1),
            }
          : { from: addDays(list[i - 1].to, 1), to: first.from }
      );

    offDates.unshift({
      from: new Date(0),
      to: new Date(checkPlacement.at(0)!.from),
    });
    return offDates;
  }, [checkPlacement]);

  const [userEnteredCheckin, setUserEnteredCheckin] = useState<null | string>(
    null //result to default checkout mode by setting to null
  );
  const [userEnteredCheckout, setUserEnteredCheckout] = useState<
    string | typeof resetSymbol | null
  >(
    '' //due to multiple checkin duration cannot infer the checkout so we result to input mode empty string
  );

  const getUnmountStatus = useUnmountStatus();
  const { pickDate: pickCheckinDate, currentPicked: pickedFrom } = checkin;
  const { pickDate: pickCheckoutDate, currentPicked: pickedTo } = checkout;

  const [userDatePickerFn, currentMarkedDate] =
    active === 1
      ? [setUserPickedCheckin, userPickedCheckin]
      : [setUserPickedCheckout, userPickedCheckout];

  const logDuration = differenceInCalendarDays(new Date(), new Date());

  useEffect(() => {
    return () => {
      if (getUnmountStatus()) {
        pickCheckinDate(userPickedCheckin ?? new Date(defaultPlacement.from));
        pickCheckoutDate(userPickedCheckout);
      }
    };
  });

  useEffect(() => {
    if (userPickedCheckin && userPickedCheckout) {
      console.log(
        pickedAvailablePlacement(checkPlacement, userPickedCheckin),
        pickedAvailablePlacement(checkPlacement, userPickedCheckout)
      );
    }
    if (
      userDatePickerFn === null ||
      !userPickedCheckin ||
      (userPickedCheckout &&
        pickedAvailablePlacement(checkPlacement, userPickedCheckin) !==
          pickedAvailablePlacement(checkPlacement, userPickedCheckout))
    ) {
      setUserEnteredCheckout('');
    }
  }, [userPickedCheckin]);
  console.log(offPlacements);
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
          //prevent click from escaping this component to other observing component
          event.stopPropagation();
        }}
      >
        <div>
          <h3>
            {logDuration} day{logDuration > 1 ? 's' : ''}
          </h3>
          <p>Add your traveling date for exact pricing</p>
        </div>
        <div
          className="date-picker__action"
          onKeyDown={(event) => {
            if (event.code.toLowerCase() === 'enter') {
              if (
                userDatePickerFn === setUserEnteredCheckin &&
                typeof userEnteredCheckin === 'string' &&
                userEnteredCheckin
              ) {
                const userChoosenCheckin = new Date(userEnteredCheckin);

                const availableForBooking = pickedAvailablePlacement(
                  checkPlacement,
                  userChoosenCheckin
                );

                if (availableForBooking) {
                  setUserPickedCheckin(userChoosenCheckin);
                  setUserEnteredCheckin(null);
                } else {
                  //warned
                }
              } else if (
                userDatePickerFn === setUserEnteredCheckout &&
                typeof userEnteredCheckout === 'string' &&
                userEnteredCheckout
              ) {
                const userChoosenCheckout = new Date(userEnteredCheckout);

                const availableForBooking = pickedAvailablePlacement(
                  checkPlacement,
                  userChoosenCheckout
                );
                if (availableForBooking) {
                  setUserPickedCheckout(userChoosenCheckout);
                  setUserEnteredCheckout('');
                } else {
                  //warned
                }
              }

              event.stopPropagation();
            }
          }}
        >
          <button
            type="button"
            onClickCapture={(event) => {
              if (
                (event.target as HTMLElement).tagName.toLowerCase() === 'input'
              ) {
                setUserEnteredCheckout('');
              } else {
                event.stopPropagation();
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
              forceLabelShow
              Icon={() => (
                <span
                  className="cancel-icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    setUserPickedCheckin(defaultPlacement.from);
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
                if (
                  userEnteredCheckout !== resetSymbol &&
                  userEnteredCheckout === ''
                )
                  setUserEnteredCheckout(resetSymbol);
              } else {
                event.stopPropagation();
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
                  : (userEnteredCheckout ||
                      userPickedCheckout?.toLocaleDateString()) ??
                    ''
              }
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
            setUserPickedCheckin(defaultPlacement.from);
            setUserPickedCheckout(defaultPlacement.to);
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
