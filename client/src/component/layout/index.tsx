import { useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../header/';
import { Footer } from '../footer';
import { useStore } from 'zustand';
import { clientInfoStore } from '../../store/slice/user';
import { authRoutePattern } from '../../util';
import { preAuthPageStore } from '../../store/slice/resumePage';

const Layout = () => {
  const { pathname } = useLocation();
  const shouldOmitFooter = /^[/]?(?:login|signup)/.test(pathname);
  const user = useStore(clientInfoStore, (state) => state.user);
  const setPath = useStore(preAuthPageStore, (state) => state.setPath);

  useLayoutEffect(() => {
    const matchAuthRoute = authRoutePattern.test(pathname);
    if (!matchAuthRoute) {
      setPath(pathname);
    }
  }, [pathname, user]);

  return (
    <div className="layout">
      <Header />
      <Outlet />
      {!shouldOmitFooter ? <Footer /> : null}
    </div>
  );
};

export { Layout };
