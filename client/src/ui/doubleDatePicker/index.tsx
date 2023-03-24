import { FC } from 'react';
import './style.css';
import { DayPicker } from 'react-day-picker';
import { CustomInput } from '../input';

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
}) => (
  <div className="double-date-picker">
    <header className="date-picker__header">
      <div>
        <h3>Select Dates</h3>
        <p>Add your traveling date for exact pricing</p>
      </div>
      <div className="date-picker__action">
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
        <CustomInput
          label="checkout"
          type="lock"
          value={
            typeof endDate !== 'string' ? endDate.toLocaleDateString() : endDate
          }
          forceLabelShow
        />
      </div>
    </header>
    <DayPicker numberOfMonths={2} selected={new Date()} onSelect={() => {}} />
  </div>
);

export { DoubleDatePicker };
