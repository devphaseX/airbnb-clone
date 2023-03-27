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
  checkPlacement: Array<{ from: Date; to: Date }>;
}

export function LogDurationPicker({ checkPlacement }: LogDurationPickerProps) {
  const [{ from: checkinDate, to: checkoutDate }] = checkPlacement ?? [];
  const [userPickedCheckin, setUserPickedCheckin] = useState<Date | null>(
    new Date(checkinDate)
  );
  const [userPickedCheckout, setUserPickedCheckout] = useState<Date | null>(
    null
  );

  const [active, setActive] = useState<1 | 2>(1);

  const durationRef = useRef<HTMLDivElement | null>(null);

  const [open, { openModal, closeModal }] = useModal(durationRef, {
    boundaryClass: 'log-duration',
  });

  return (
    <div id="duration" className="log-duration">
      <div className="date-duration-picker" ref={durationRef}>
        <div
          className="date-duration-picker-active"
          onClickCapture={(event) => {
            if (open) return event.stopPropagation();

            const button = (event.target as HTMLElement).closest('.tag-input');
            const wrapperDiv = event.currentTarget as HTMLElement;
            if (button && wrapperDiv.contains(button)) {
              let _active = active;
              switch (button) {
                case wrapperDiv.children[0]: {
                  _active = 1;
                  break;
                }

                case wrapperDiv.children[1]: {
                  _active = 2;
                  break;
                }
              }

              setActive(_active);

              setTimeout(openModal, 30);
              event.stopPropagation();
            }
          }}
        >
          <TagInput
            label="checkin"
            type="lock"
            value={
              (userPickedCheckin && getLocaleDate(userPickedCheckin)) ??
              getPlaceholderDate()
            }
            forceLabelShow
          />
          <TagInput
            label="checkout"
            type="lock"
            value={
              (userPickedCheckout && getLocaleDate(userPickedCheckout)) ??
              getPlaceholderDate()
            }
            forceLabelShow
          />
        </div>
      </div>
      {open ? (
        <div className="double-date-picker-ctn">
          <DoubleDatePicker
            active={active}
            setActive={setActive}
            checkin={{
              ...(userPickedCheckin && { currentPicked: userPickedCheckin }),
              pickDate: (date) => setUserPickedCheckin(date),
            }}
            checkout={{
              ...(userPickedCheckout && { currentPicked: userPickedCheckout }),
              pickDate: (date) => setUserPickedCheckout(date),
            }}
            closePicker={closeModal}
            checkPlacement={checkPlacement}
          />
        </div>
      ) : null}
    </div>
  );
}
