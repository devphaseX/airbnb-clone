import { UserDoc } from '../../../../server/src/model/user';
import { createStore } from 'zustand';

type UserData = Omit<UserDoc, 'password'>;

type ClientInfo = {
  user?: null | UserData;
  setUser: (user: UserData) => void;
  resetUser: () => void;
};

const clientInfoStore = createStore<ClientInfo>((set) => ({
  user: null,
  setUser: (user) => {
    set({ user });
  },
  resetUser: () => {
    set({ user: null });
  },
}));

export { clientInfoStore };
