import { createStore } from 'zustand';

type ResumePage = {
  path: string;
  setPath: (path: string) => void;
  resetPath: () => void;
};
const resumePage = createStore<ResumePage>((set) => ({
  path: '/',
  setPath(path) {
    set({ path });
  },
  resetPath: () => {
    set({ path: '/' });
  },
}));

export { resumePage };
