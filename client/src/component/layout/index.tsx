import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../header/';
import { Footer } from '../footer';
import { useRef } from 'react';
import { useStore } from 'zustand';
import { clientInfoStore } from '../../store/slice/user';
import { authRoutePattern } from '../../util';
import { useLayoutEffect } from 'react';
import { useEffect } from 'react';
import { preAuthPageStore } from '../../store/slice/resumePage';

const Layout = () => {
  const { pathname } = useLocation();
  const shouldOmitFooter = /^[/]?(?:login|signup)/.test(pathname);
  const prevPathnameRef = useRef('');
  const user = useStore(clientInfoStore, (state) => state.user);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const prevPathname = prevPathnameRef.current;
    const matchAuthRoute = authRoutePattern.test(pathname);
    const shouldBlockReAuth = !!(matchAuthRoute && user);

    // if (shouldBlockReAuth) {
    //   navigate(prevPathname ?? '/');
    // }

    if (!matchAuthRoute) {
      prevPathnameRef.current = pathname;
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
