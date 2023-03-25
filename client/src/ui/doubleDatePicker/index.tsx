import { FC } from 'react';
import './style.css';
import { DayPicker } from 'react-day-picker';
import { TagInput } from '../input';
import { useState } from 'react';
import { useLayoutEffect } from 'react';
import { useRef } from 'react';

type DatePickerFn = (date: Date) => void;

interface TimeCheck {
  date: Date | string;
  pickDate: DatePickerFn;
  reset: () => void;
}

interface DoubleDatePickerProps {
  closePicker: () => void;
  checkin: TimeCheck;
  checkout: TimeCheck;
}

const DoubleDatePicker: FC<DoubleDatePickerProps> = ({
  checkin,
  checkout,
  closePicker,
}) => {
  const [active, setActive] = useState<1 | 2>(1);
  const checkinRef = useRef<HTMLButtonElement | null>(null);
  const checkoutRef = useRef<HTMLButtonElement | null>(null);

  let { date: startDate, reset: resetCheckin } = checkin;
  let { date: endDate, reset: resetCheckout } = checkout;

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
              value={
                typeof startDate !== 'string'
                  ? startDate.toLocaleDateString()
                  : startDate
              }
              forceLabelShow
            />
          </button>
          <button type="button" onClick={() => setActive(2)} ref={checkoutRef}>
            <TagInput
              label="checkout"
              type="lock"
              value={
                typeof endDate !== 'string'
                  ? endDate.toLocaleDateString()
                  : endDate
              }
              forceLabelShow
            />
          </button>
        </div>
      </header>
      <DayPicker
        numberOfMonths={2}
        selected={new Date()}
        onSelect={() => {
          resetCheckin();
          resetCheckout();
        }}
      />
      <div className="date-picker-btn">
        <button type="button" className="clear-button">
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
