import { MutableRefObject } from 'react';
import { useCallback } from 'react';
import { useId } from 'react';
import { RefObject, useState, useEffect } from 'react';
import { genNaiveRandomId } from '../component/userPlace/preview';
import { useRef } from 'react';

type UseModalResult = [
  open: boolean,
  action: {
    openModal: () => void;
    closeModal: () => void;
  }
];

type UseModalOption = {
  boundaryClass: string;
  closeClassBoundary?: string;
};

const useModal = <T extends HTMLElement>(
  ref: RefObject<T> | null,
  option: UseModalOption
): UseModalResult => {
  const [open, setModal] = useState(false);
  const _id = useRef(genNaiveRandomId().replace(/\d+/g, '')).current;
  const openModal = useCallback(() => setModal(true), []);
  const closeModal = useCallback(() => {
    setModal(false);
  }, []);

  useEffect(() => {
    if (ref && ref.current) {
      const aborter = new AbortController();
      const id = ref.current.id || _id;
      ref.current.id = id;
      const eventListernerOption: AddEventListenerOptions = {
        signal: aborter.signal,
        capture: false,
      };

      let hasDetectKeyPress = false;

      document.body.addEventListener(
        'keydown',
        () => {
          hasDetectKeyPress = true;
        },
        { capture: true }
      );

      document.body.addEventListener(
        'click',
        (event) => {
          if (hasDetectKeyPress) {
            hasDetectKeyPress = false;
            return;
          }
          const selector = option.boundaryClass
            ? `.${option.boundaryClass}`
            : `#${id}`;

          if (open && !(event.target as HTMLElement).closest(selector)) {
            closeModal();
          }
        },
        eventListernerOption
      );

      return aborter.abort.bind(aborter);
    }
  }, [open]);

  return [
    open,
    {
      closeModal,
      openModal,
    },
  ];
};

export { useModal };
