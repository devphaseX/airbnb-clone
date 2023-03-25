import { FC } from 'react';
import './style.css';
import { DayPicker } from 'react-day-picker';
import { CustomInput } from '../input';
import { useState } from 'react';
import { useLayoutEffect } from 'react';
import { useRef } from 'react';

type DatePickerFn = (date: Date) => void;

interface DoubleDatePickerProps {
  startDate: Date | string;
  endDate: Date | string;
  setStartDate: DatePickerFn;
  setEndDate: DatePickerFn;
  closePicker: () => void;
}

const DoubleDatePicker: FC<DoubleDatePickerProps> = ({
  startDate,
  endDate,
}) => {
  const [active, setActive] = useState<1 | 2>(1);
  const checkinRef = useRef<HTMLButtonElement | null>(null);
  const checkoutRef = useRef<HTMLButtonElement | null>(null);

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
            <CustomInput
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
            <CustomInput
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
      <DayPicker numberOfMonths={2} selected={new Date()} onSelect={() => {}} />
      <div>
        <button type="button">Clear date</button>
        <button type="button">Close</button>
      </div>
    </div>
  );
};

export { DoubleDatePicker };
