import { useEffect, useState } from 'react';
import { CustomInput } from '../input';
import { DoubleDatePicker } from '../doubleDatePicker';
import 'react-day-picker/dist/style.css';
import './style.css';
import { useModal } from '../../hooks/useModal';
import { useRef } from 'react';
import { useLayoutEffect } from 'react';

const getPlaceholderDate = () => `dd/mm/yyyy`;
const getLocaleDate = (date: Date) => date.toLocaleDateString();

export function LogDurationPicker() {
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
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
          <CustomInput
            label="checkin"
            type="lock"
            value={(checkin && getLocaleDate(checkin)) ?? getPlaceholderDate()}
            forceLabelShow
            onClick={openModal}
          />
          <CustomInput
            label="checkout"
            type="lock"
            value={
              (checkout && getLocaleDate(checkout)) ?? getPlaceholderDate()
            }
            forceLabelShow
            onClick={openModal}
          />
        </div>
      </div>
      {open ? (
        <div className="double-date-picker-ctn">
          <DoubleDatePicker
            startDate={
              (checkin && getLocaleDate(checkin)) ?? getPlaceholderDate()
            }
            endDate={
              (checkout && getLocaleDate(checkout)) ?? getPlaceholderDate()
            }
            setStartDate={setCheckin}
            setEndDate={setCheckout}
            closePicker={closeModal}
          />
        </div>
      ) : null}
    </div>
  );
}
