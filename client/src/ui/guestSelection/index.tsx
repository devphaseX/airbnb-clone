import { useState, useRef, useMemo, type FC } from 'react';
import { CustomInput } from '../input';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { genNaiveRandomId } from '../../component/userPlace/preview';
import { useModal } from '../../hooks/useModal';
import './style.css';

interface GuestSelectionProps {
  dropDownItems: Array<Omit<CategoryPick, 'id' | 'picked'>>;
}

const GuestSelection: FC<GuestSelectionProps> = ({ dropDownItems }) => {
  const guestRef = useRef<HTMLDivElement | null>(null);
  const [totalGuest, setTotalGuest] = useState(1);
  const [open, { closeModal, openModal }] = useModal(guestRef);

  return (
    <div ref={guestRef} className="quest-select">
      <CustomInput
        type="lock"
        label="guests"
        onContainerClick={openModal}
        value={`${totalGuest} guest${totalGuest > 1 ? 's' : ''}`}
        forceLabelShow
      />
      {open && <GuestDropDown items={dropDownItems} />}
    </div>
  );
};

interface CategoryPick {
  id: string;
  category: string;
  extraInfo: string;
  max: number;
  picked: number;
}

interface GuestDropDownProps {
  items: Array<Omit<CategoryPick, 'id' | 'picked'>>;
}

const GuestDropDown: FC<GuestDropDownProps> = ({ items }) => {
  const forceUpdate = useForceUpdate();
  const categoryMetric = useMemo(
    () =>
      new Map<string, CategoryPick>(
        items.map((item) => {
          const id = genNaiveRandomId();
          return [id, { id: genNaiveRandomId(), ...item, picked: 0 }];
        })
      ),
    [items]
  );

  return (
    <div>
      <ul>
        {Array.from(
          categoryMetric.values(),
          ({ id, category, extraInfo, max, picked }) => {
            const disableDecrement = picked <= 0;
            const disableIncrement = picked >= max;

            return (
              <li>
                <div>
                  <h3>{category}</h3>
                  <p>{extraInfo}</p>
                </div>
                <div>
                  <button
                    onClick={() => {
                      const item = categoryMetric.get(id);
                      if (!item || disableDecrement) return;
                      item.picked--;
                      forceUpdate();
                    }}
                  >
                    <span className="select-icon">
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
                          d="M19.5 12h-15"
                        />
                      </svg>
                    </span>
                  </button>
                  <span>{picked}</span>
                  <button
                    onClick={() => {
                      const item = categoryMetric.get(id);
                      if (!item || disableIncrement) return;
                      item.picked++;
                      forceUpdate();
                    }}
                  >
                    <span className="select-icon">
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
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                    </span>
                  </button>
                </div>
              </li>
            );
          }
        )}
      </ul>
    </div>
  );
};

export { GuestSelection };
