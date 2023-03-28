import { useLayoutEffect, useState, useRef, useEffect, type FC } from 'react';
import {
  differenceInCalendarDays,
  addDays,
  endOfMonth,
  subDays,
} from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { TagInput } from '../input';
import './style.css';
import { useMemo } from 'react';
import { useCallback } from 'react';
import { getCompliantDateOutput, parseDateInCompliant } from '../../util';

type DatePickerFn = (date: Date | null) => void;

interface ValidationResult {
  kind: string;
  info: string;
}

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

interface DatePatternMatchGroup {
  month: `${number}`;
  day: `${number}`;
  year: `${number}`;
}
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
  const [checkinValidateResult, setCheckinValidateResult] =
    useState<ValidationResult | null>(null);
  const [checkoutValidatResult, setCheckoutValidateResult] =
    useState<ValidationResult | null>(null);

  const { pickDate: pickCheckinDate, currentPicked: pickedFrom } = checkin;
  const { pickDate: pickCheckoutDate, currentPicked: pickedTo } = checkout;

  const [userPickedCheckin, setUserPickedCheckin] = useState<Date | null>(
    checkin.currentPicked ?? null
  );

  const [userPickedCheckout, setUserPickedCheckout] = useState<Date | null>(
    checkout.currentPicked ?? null
  );

  const [userInputCheckin, setUserInputCheckin] = useState<null | string>(null);
  const [userInputCheckout, setUserInputCheckout] = useState<string | null>(
    null
  );
  const [userDatePickerFn, currentMarkedDate] =
    active === 1
      ? [setUserPickedCheckin, pickedFrom]
      : [setUserPickedCheckout, pickedTo];

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
      const startOffDate = {
        from: new Date(0),
        to: subDays(checkPlacement[0].from, 1),
      };

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
      setUserInputCheckout('');
      setUserPickedCheckout(null);
    }
  }, [userPickedCheckin]);

  const validateMessageTimerFn = useCallback(
    (fn: (value: React.SetStateAction<ValidationResult | null>) => void) => {
      let isDone = false;
      const id = setTimeout(() => {
        isDone = true;
        fn(null);
      }, 2000);

      return () => {
        !isDone && clearTimeout(id);
      };
    },

    []
  );
  // separate logic to prevent message show dependency
  useLayoutEffect(() => {
    if (checkinValidateResult) {
      return validateMessageTimerFn(setCheckinValidateResult);
    }
  }, [checkinValidateResult]);
  // separate logic to prevent message show dependency
  useLayoutEffect(() => {
    if (checkoutValidatResult) {
      return validateMessageTimerFn(setCheckoutValidateResult);
    }
  }, [checkoutValidatResult]);

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
        <div
          className="date-picker__action"
          onKeyDown={(event) => {
            if (event.code.toLowerCase() !== 'enter') return;

            const button = (event.target as HTMLElement).closest(
              `.date-picker__action button`
            );

            const datePickerActionEl = event.currentTarget as HTMLElement;
            if (!datePickerActionEl.contains(button)) return;

            const checkButtonType =
              datePickerActionEl.firstElementChild === button
                ? 'checkin'
                : 'checkout';

            let [
              userEnteredCheckValue,
              userPickedCheckFn,
              userSetValidateResultFn,
            ] =
              checkButtonType === 'checkin'
                ? [
                    userInputCheckin,
                    setUserPickedCheckin,
                    setCheckinValidateResult,
                  ]
                : [
                    userInputCheckout,
                    setUserPickedCheckout,
                    setCheckoutValidateResult,
                  ];

            if (userEnteredCheckValue === null) return;

            if (userEnteredCheckValue.trim() === '') {
              return userSetValidateResultFn({
                kind: 'Empty date',
                info: 'input a date in the format of MM/DD/YYYY',
              });
            }

            const matchExpectedDateFormat =
              userEnteredCheckValue.match(datePattern);
            if (!matchExpectedDateFormat) {
              return userSetValidateResultFn({
                kind: 'Invalid date formate',
                info: 'date to be inputted in the format MM/DD/YYYY',
              });
            }

            const { month, day, year } =
              matchExpectedDateFormat.groups as unknown as DatePatternMatchGroup;
            const searchDate = parseDateInCompliant(year, month, day);

            if (Number.isNaN(searchDate.getTime())) {
              return userSetValidateResultFn({
                kind: 'Invalid date provided',
                info: 'Ensure you are providing a valid date.',
              });
            }

            const searchDateGroup = pickedAvailablePlacement(
              checkPlacement,
              searchDate
            );

            const checkWithDateGroup = pickedAvailablePlacement(
              checkPlacement,
              userPickedCheckin!
            );

            if (!searchDateGroup) {
              return userSetValidateResultFn({
                kind: 'Booking within this period not allowed',
                info: 'We are not accepting any bookings within this period',
              });
            }

            if (checkButtonType === 'checkout') {
              if (searchDateGroup !== checkWithDateGroup) {
                return userSetValidateResultFn({
                  kind: 'selecting checkout from a different log period',
                  info: 'You are not allowed to select a different log period i.e not same with checkin',
                });
              }

              if (searchDate < userPickedCheckin!) {
                return userSetValidateResultFn({
                  kind: 'The time of checkout should preceed that of checkin',
                  info: 'You provided a checkout time that is way ahead of the checkin time.',
                });
              }
            }

            userPickedCheckFn(searchDate);

            event.stopPropagation();
          }}
        >
          <button
            type="button"
            onClickCapture={(event) => {
              if (
                (event.target as HTMLElement).tagName.toLowerCase() === 'input'
              ) {
                setUserInputCheckin(
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
                userInputCheckin ??
                (userPickedCheckin &&
                  getCompliantDateOutput(userPickedCheckin)) ??
                defaultPlacement.from.toLocaleString()
              }
              onChange={(event) => {
                setUserInputCheckin((event.target as HTMLInputElement).value);
                event.stopPropagation();
              }}
              onBlur={() => {
                if (userInputCheckin) setUserInputCheckin(null);
              }}
              onKeyDown={(event) => {
                if (
                  userInputCheckout &&
                  event.code.toLowerCase() === 'enter' &&
                  !checkoutValidatResult
                ) {
                }

                event.stopPropagation();
              }}
              forceLabelShow
              Icon={() => (
                <span
                  className="cancel-icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    setUserPickedCheckin(defaultPlacement.from);
                    setUserInputCheckin(null);
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
                if (userInputCheckout === null) setUserInputCheckout('');
              }

              setActive(2);
            }}
            ref={checkoutRef}
          >
            <TagInput
              label="checkout"
              type="text"
              value={
                userInputCheckout ??
                (userPickedCheckout &&
                  getCompliantDateOutput(userPickedCheckout)) ??
                ''
              }
              onBlur={() => {
                if (userInputCheckout !== null) setUserInputCheckout(null);
              }}
              onChange={(event) => {
                setUserInputCheckout((event.target as HTMLInputElement).value);
                event.stopPropagation();
              }}
              placeholder={getCompliantDateOutput(null).toUpperCase()}
              forceLabelShow
              Icon={() => (
                <span
                  className="cancel-icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    setUserPickedCheckout(null);
                    setUserInputCheckout('');
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
              userInputCheckin !== null
            ) {
              setUserInputCheckout(null);
            }

            if (
              userDatePickerFn === setUserPickedCheckin &&
              userInputCheckout !== null
            ) {
              setUserInputCheckin(null);
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
