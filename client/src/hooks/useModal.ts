import { useEffect } from 'react';
import { useRef } from 'react';

type ModalObserver = {
  unsubscribe: () => void;
  openModal: () => void;
  closeModal: () => void;
};
type UseModalResult = {
  register: (option: UseModalOption) => ModalObserver;
};

type UseModalOption = {
  id: string;
  observer: (open: boolean) => void;
  boundaryClass: string;
  closeClassBoundary?: string;
};

const useModal = (): UseModalResult => {
  const modalOptions: Map<string, [UseModalOption, boolean]> = useRef(
    new Map()
  ).current;
  const observerOptions: Map<string, ModalObserver> = useRef(new Map()).current;

  const register = (
    option: UseModalOption
  ): ReturnType<UseModalResult['register']> => {
    const id = option.id;
    const cacheOption = modalOptions.get(id);
    if (cacheOption) {
      modalOptions.set(id, [option, cacheOption?.[1] ?? false]);
      return observerOptions.get(id)!;
    }
    modalOptions.set(id, [option, false]);
    let hasUnsubscribe = false;

    const observer = {
      unsubscribe: () => {
        if (!hasUnsubscribe && (hasUnsubscribe = true)) {
          modalOptions.delete(id);
          observerOptions.delete(id);
        }
      },
      openModal: () => {
        if (hasUnsubscribe) return;
        const option = modalOptions.get(id)!;
        if (option[1] === false) modalOptions.set(id, [option[0], true]);
        option[0].observer(true);
      },
      closeModal: () => {
        if (hasUnsubscribe) return;
        const option = modalOptions.get(id)!;
        if (option[1] === true) modalOptions.set(id, [option[0], false]);
        option[0].observer(false);
      },
    };

    observerOptions.set(id, observer);

    return observer;
  };

  useEffect(() => {
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
        if (hasDetectKeyPress && !(hasDetectKeyPress = false)) return;
        const otherModalStillOpen =
          Array.from(modalOptions.values(), ([_, open]) => open).filter(Boolean)
            .length > 1;

        const hasClickedSide = Array.from(
          modalOptions.values(),
          ([{ boundaryClass }]) => {
            let boundaryElement = document.querySelector(boundaryClass);
            if (!boundaryElement) return true;
            return !boundaryElement.contains(event.target as HTMLElement);
          }
        ).some(Boolean);

        if (!otherModalStillOpen && hasClickedSide) {
          observerOptions.forEach(({ closeModal }) => {
            closeModal();
          });
        }
      },
      { capture: false }
    );
  }, []);

  return { register };
};

export { useModal };
