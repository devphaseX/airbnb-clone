import { createStore, useStore } from 'zustand';
import { useProfile } from '../../store/api';
import { clientInfoStore } from '../../store/slice/user';
import { useEffect } from 'react';

type AuthRoute = {
  isLoading: boolean;
  setLoading: (status: boolean) => void;
  resetLoading: () => void;
  waitForLoadingDone: () => Promise<false>;
};

const userSession = createStore<AuthRoute>((set, get) => ({
  isLoading: true,
  setLoading: (status) => set({ isLoading: status }),
  resetLoading: () => get().setLoading(false),
  waitForLoadingDone: async () => {
    const loading = get().isLoading;
    if (loading) {
      await new Promise<void>((res) => {
        const unsubscribe = userSession.subscribe(
          ({ isLoading: nextLoading }) => {
            if (nextLoading !== loading && !nextLoading) {
              res();
              unsubscribe();
            }
          }
        );
      });
    }

    return get().isLoading as false;
  },
}));

const ReAuthUser = () => {
  const { setUser, user } = useStore(clientInfoStore);
  const profileStatus = useProfile();
  const { data, isLoading, remove, isError } = profileStatus;
  const { resetLoading, setLoading } = useStore(userSession);

  useEffect(() => {
    if (data) {
      setUser(data);
      setLoading(false);
    } else if ((!isLoading && !user) || isError) {
      setLoading(false);
    }
  }, [data, isLoading, user, isError]);

  useEffect(() => {
    if (!user && !isLoading) remove();
  }, [user]);

  useEffect(() => () => resetLoading(), []);
  return null;
};

export { ReAuthUser, userSession };
export type { AuthRoute };
