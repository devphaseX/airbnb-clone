import { createStore } from 'zustand';

type ResumePage = {
  path: string;
  setPath: (path: string) => void;
  resetPath: () => void;
};

const preAuthPageStore = createStore<ResumePage>((set) => ({
  path: '/',
  setPath(path) {
    set({ path });
  },
  resetPath: () => {
    set({ path: '/' });
  },
}));

export { preAuthPageStore };
