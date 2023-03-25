import { useState } from 'react';
import { TagInput } from '../input';
import { DoubleDatePicker } from '../doubleDatePicker';
import 'react-day-picker/dist/style.css';
import './style.css';
import { useModal } from '../../hooks/useModal';
import { useRef } from 'react';

const getPlaceholderDate = () => `dd/mm/yyyy`;
const getLocaleDate = (date: Date) => date.toLocaleDateString();

interface LogDurationPickerProps {
  checkinDate: Date | string;
  checkoutDate: Date | string;
}

export function LogDurationPicker({
  checkinDate,
  checkoutDate,
}: LogDurationPickerProps) {
  const [userPickedCheckin, setUserPickedCheckin] = useState<Date | null>(null);
  const [userPickedCheckout, setUserPickedCheckout] = useState<Date | null>(
    null
  );
  const durationRef = useRef<HTMLDivElement | null>(null);

  const [open, { openModal, closeModal }] = useModal(durationRef, {
    boundaryClass: 'log-duration',
  });

  return (
    <div id="duration" className="log-duration">
      <div
        className="date-duration-picker"
        onClickCapture={closeModal}
        ref={durationRef}
      >
        <div className="date-duration-picker-active">
          <TagInput
            label="checkin"
            type="lock"
            value={
              (userPickedCheckin && getLocaleDate(userPickedCheckin)) ??
              getPlaceholderDate()
            }
            forceLabelShow
            onClick={openModal}
          />
          <TagInput
            label="checkout"
            type="lock"
            value={
              (userPickedCheckout && getLocaleDate(userPickedCheckout)) ??
              getPlaceholderDate()
            }
            forceLabelShow
            onClick={openModal}
          />
        </div>
      </div>
      {open ? (
        <div className="double-date-picker-ctn">
          <DoubleDatePicker
            checkin={{
              date: checkinDate,
              pickDate: (date) => setUserPickedCheckin(date),
              reset: () => setUserPickedCheckin(null),
            }}
            checkout={{
              date: checkoutDate,
              pickDate: (date) => setUserPickedCheckout(date),
              reset: () => setUserPickedCheckout(null),
            }}
            closePicker={closeModal}
          />
        </div>
      ) : null}
    </div>
  );
}
