import { createStore, useStore } from 'zustand';
import { useProfile } from '../../store/api';
import { clientInfoStore } from '../../store/slice/user';
import { useEffect } from 'react';

type AuthRoute = {
  isLoading: boolean;
  setLoading: (status: boolean) => void;
  resetLoading: () => void;
};

const userSession = createStore<AuthRoute>((set, get) => ({
  isLoading: true,
  setLoading: (status) => set({ isLoading: status }),
  resetLoading: () => get().setLoading(false),
}));

const ReAuthUser = () => {
  const { setUser, user } = useStore(clientInfoStore);
  const profileStatus = useProfile();
  const { data, isLoading, remove, isError } = profileStatus;
  const { resetLoading } = useStore(userSession);

  useEffect(() => {
    if (data) {
      setUser(data);
      resetLoading();
    } else if ((!isLoading && !user) || isError) {
      resetLoading();
    }
  }, [data, isLoading, user, isError]);

  useEffect(() => {
    if (!user && !isLoading) remove();
  }, [user]);

  return null;
};

export { ReAuthUser, userSession as authLockRoute };
export type { AuthRoute };
