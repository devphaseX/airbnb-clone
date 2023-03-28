import { useState, useRef, useMemo, type FC } from 'react';
import { TagInput } from '../input';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { genNaiveRandomId } from '../../component/userPlace/preview';
import './style.css';
import { useModalContext } from '../ModalProvider';
import { useEffect } from 'react';
import { useId } from 'react';

interface GuestSelectionProps {
  dropDownItems: Array<Omit<CategoryPick, 'id' | 'picked'>>;
}

const GuestSelection: FC<GuestSelectionProps> = ({ dropDownItems }) => {
  const guestRef = useRef<HTMLDivElement | null>(null);
  const categoryMetric = useMemo(
    () =>
      new Map<string, CategoryPick>(
        dropDownItems.map((item) => {
          const id = genNaiveRandomId();
          return [id, { id, ...item, picked: 0 }];
        })
      ),
    [dropDownItems.length]
  );
  const totalGuest = Array.from(
    categoryMetric.values(),
    ({ picked }) => picked
  ).reduce((acc, cur) => acc + cur, 0);

  const forceUpdate = useForceUpdate();

  const [open, setOpen] = useState(false);
  const { register } = useModalContext();
  const id = useId();

  const { openModal, closeModal, unsubscribe } = useMemo(
    () =>
      register({
        id,
        boundaryClass: '.quest-select',
        observer: (open) => setOpen(open),
      }),
    []
  );
  useEffect(() => {
    return unsubscribe;
  }, []);

  console.log({ open });
  return (
    <div ref={guestRef} className="quest-select">
      <TagInput
        type="lock"
        label="guests"
        onContainerClick={() => (open ? closeModal : openModal)()}
        value={`${totalGuest} guest${totalGuest > 1 ? 's' : ''}`}
        forceLabelShow
      />
      {open && (
        <GuestDropDown
          items={dropDownItems}
          categoryMetric={categoryMetric}
          updateComponent={forceUpdate}
        />
      )}
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
  categoryMetric: Map<string, CategoryPick>;
  updateComponent: () => void;
}

const GuestDropDown: FC<GuestDropDownProps> = ({
  categoryMetric,
  updateComponent,
}) => {
  return (
    <div className="guest-dropdown">
      <ul className="guest-list">
        {Array.from(
          categoryMetric.values(),
          ({ id, category, extraInfo, max, picked }, i) => {
            const disableDecrement = picked <= 0;
            const disableIncrement = picked >= max;

            return (
              <li key={i}>
                <div className="guest-info">
                  <h3>{category}</h3>
                  <p>{extraInfo}</p>
                </div>
                <div className="guest-count">
                  <button
                    type="button"
                    className="select-icon"
                    onClick={() => {
                      const item = categoryMetric.get(id);
                      if (!item || disableDecrement) return;
                      item.picked--;
                      updateComponent();
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
                        d="M19.5 12h-15"
                      />
                    </svg>
                  </button>
                  <span className="guest-count__indicator">{picked}</span>
                  <button
                    className="select-icon"
                    type="button"
                    onClick={() => {
                      const item = categoryMetric.get(id);
                      if (!item || disableIncrement) return;
                      item.picked++;
                      updateComponent();
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
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
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
