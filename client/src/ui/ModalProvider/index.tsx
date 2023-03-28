import React, { createContext, FC } from 'react';
import { useModal } from '../../hooks/useModal';
import { useContext } from 'react';

type Modal = ReturnType<typeof useModal>;

const modal = {} as Modal;

const ModalContext = createContext<Modal>(modal);

interface ModalProviderProps {
  children: React.ReactNode;
}
const ModalProvider: FC<ModalProviderProps> = ({ children }) => (
  <ModalContext.Provider value={useModal()}>{children}</ModalContext.Provider>
);

const useModalContext = () => useContext(ModalContext);

export { ModalProvider, useModalContext };
