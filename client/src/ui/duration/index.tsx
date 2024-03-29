import { useState } from 'react';
import { TagInput } from '../input';
import { DoubleDatePicker } from '../doubleDatePicker';
import 'react-day-picker/dist/style.css';
import './style.css';
import { useRef } from 'react';
import { getCompliantDateOutput } from '../../util';
import { useModalContext } from '../ModalProvider';
import { useEffect } from 'react';
import { useMemo } from 'react';
import { useId } from 'react';

interface LogDurationPickerProps {
  checkinDate: Date | string;
  checkoutDate: Date | string;
  checkPlacement: Array<{ from: Date; to: Date }>;
}

export function LogDurationPicker({ checkPlacement }: LogDurationPickerProps) {
  const [{ from: checkinDate }] = checkPlacement ?? [];
  const [userPickedCheckin, setUserPickedCheckin] = useState<Date | null>(
    new Date(checkinDate)
  );
  const [userPickedCheckout, setUserPickedCheckout] = useState<Date | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const { register } = useModalContext();
  const id = useId();

  const { openModal, closeModal, unsubscribe } = useMemo(
    () =>
      register({
        id,
        observer: (open) => setOpen(open),
        boundaryClass: '.log-duration',
      }),
    []
  );

  useEffect(() => {
    return unsubscribe;
  }, []);

  const [active, setActive] = useState<1 | 2>(1);

  const durationRef = useRef<HTMLDivElement | null>(null);

  return (
    <div id="duration" className="log-duration">
      <div className="date-duration-picker" ref={durationRef}>
        <div
          className="date-duration-picker-active"
          onClickCapture={(event) => {
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
            placeholder={getCompliantDateOutput(null).toUpperCase()}
            value={
              (userPickedCheckin &&
                getCompliantDateOutput(userPickedCheckin)) ??
              ''
            }
            forceLabelShow
          />
          <TagInput
            label="checkout"
            type="lock"
            placeholder={getCompliantDateOutput(null).toUpperCase()}
            value={
              (userPickedCheckout &&
                getCompliantDateOutput(userPickedCheckout)) ??
              ''
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
