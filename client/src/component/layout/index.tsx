import { Outlet, useLocation, useParams } from 'react-router-dom';
import { Header } from '../header/';
import { Footer } from '../footer';
const Layout = () => {
  const { pathname } = useLocation();
  const shouldOmitFooter = /^[/]?(?:login|signup)/.test(pathname);

  return (
    <div className="layout">
      <Header />
      <Outlet />
      {!shouldOmitFooter ? <Footer /> : null}
    </div>
  );
};

export { Layout };
