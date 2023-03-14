import { Link } from 'react-router-dom';
import { createStore, useStore } from 'zustand';
import { clientInfoStore } from '../../store/slice/user';
import { logoutUserApi } from '../../store/api';
import './style.css';
import { Backdrop } from '../backdrop';
import { useLayoutEffect } from 'react';
import { useBlockLinkNavigate } from '../../component/BlockableLink/lock';

type CloseMenuList = {
  status: 'open' | 'closed';
  setStatus: (nextStatus: CloseMenuList['status']) => void;
};

const closeMenuList = createStore<CloseMenuList>((set) => ({
  status: 'closed',
  setStatus: (next) => set({ status: next }),
}));

const MenuInvisibleBackdrop = () => {
  const { status, setStatus } = useStore(closeMenuList);
  return status === 'open' ? (
    <Backdrop
      classNames={['menu-backdrop']}
      onClick={() => setStatus('closed')}
    />
  ) : null;
};

type MenuListProps = { open: boolean; close: () => void };

const MenuList = ({ close, open }: MenuListProps) => {
  const { user, resetUser } = useStore(clientInfoStore);
  const navigate = useBlockLinkNavigate();
  const { status, setStatus } = useStore(closeMenuList);

  useLayoutEffect(() => {
    if (open && status === 'closed') setStatus('open');
  }, [open]);

  useLayoutEffect(() => {
    if (open && status === 'closed') close();
  }, [status]);

  return (
    <div
      className="menuList"
      onClick={(event) => {
        if ((event.target as HTMLElement).tagName.toLowerCase() === 'a') {
          close();
        }
      }}
    >
      {!user ? (
        <div>
          <Link to="/verify">Sign up</Link>
          <Link to="/verify">Login</Link>
        </div>
      ) : (
        <div>
          <span
            onClick={async () => {
              const response = await logoutUserApi();
              if (response.ok) {
                resetUser();
                navigate({ to: '/' });
              }
            }}
          >
            logout
          </span>
        </div>
      )}
      <div>
        <Link to="#">Host your home</Link>
        <Link to="#">Host an experience</Link>
        <Link to="#">Help</Link>
      </div>
    </div>
  );
};

export { MenuList, MenuInvisibleBackdrop };
