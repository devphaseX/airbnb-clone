import { useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../header/';
import { Footer } from '../footer';
import { useStore } from 'zustand';
import { clientInfoStore } from '../../store/slice/user';
import { authRoutePattern } from '../../util';
import { preAuthPageStore } from '../../store/slice/resumePage';
import { MenuInvisibleBackdrop } from '../../ui/menuList';
import { userSession } from './ReAuthUser';

const Layout = () => {
  const { pathname } = useLocation();
  const shouldOmitFooter = !/^(\/|)$/.test(pathname);
  const user = useStore(clientInfoStore, (state) => state.user);
  const setPath = useStore(preAuthPageStore, (state) => state.setPath);
  const isLoading = useStore(userSession, ({ isLoading }) => isLoading);

  useLayoutEffect(() => {
    const matchAuthRoute = authRoutePattern.test(pathname);
    if (!matchAuthRoute) {
      setPath(pathname);
    }
  }, [pathname, user]);

  return (
    <div className="layout">
      {!isLoading ? (
        <>
          <Header />
          <>
            <MenuInvisibleBackdrop />
          </>
          <Outlet />
          {!shouldOmitFooter ? <Footer /> : null}
        </>
      ) : null}
    </div>
  );
};

export { Layout };
