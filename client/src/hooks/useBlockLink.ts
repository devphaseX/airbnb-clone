import { useStore } from 'zustand';
import {
  type NavLockStore,
  navLockStore,
} from '../component/BlockableLink/lock';

const useBlockLink = <MappedState = NavLockStore>(
  selector?: (state: NavLockStore) => MappedState
): MappedState =>
  useStore(
    navLockStore,
    selector ? selector : (((state: NavLockStore) => state) as any)
  );

export { useBlockLink };
