import { Outlet, useLocation, useParams } from 'react-router-dom';
import { Header } from '../header/';
import { Footer } from '../footer';
const Layout = () => {
  const { pathname } = useLocation();
  return (
    <div className="layout">
      <Header />
      <Outlet />
      {!/^[/]?login/.test(pathname) ? <Footer /> : null}
    </div>
  );
};

export { Layout };
