import { useMemo } from 'react';
import { useLocation, Outlet, Link } from 'react-router-dom';
import { mergeStyleClassName } from '../util';
import { BuildingOffice } from '../ui/icon/buildingOffice';
import { User } from '../ui/icon/user';
import { BulletList } from '../ui/icon/bulletList';
import '../style/account.css';

const takeLessTwoPathSegment = /^.+?(?:\/?$|[/].+?(?:\/|$))/;

const Account = () => {
  let { pathname } = useLocation();
  pathname = pathname.replace(/^[/]|[/]$/, '');

  const { currentPath, basePath } = useMemo(() => {
    const pathSegment = pathname.match(takeLessTwoPathSegment)?.[0].split('/');

    if (!pathSegment) return { currentPath: '', basePath: '' };
    let [basePath, currentPath = ''] = pathSegment;

    if (basePath === '') {
      basePath = currentPath;
      currentPath = '';
    }

    return { currentPath, basePath };
  }, [pathname]);

  return (
    <section className="account">
      <div className="section-wrapper account-wrapper">
        <div className="account-detail-switch">
          <Link
            to={`/${basePath ?? ''}/profile`}
            className={mergeStyleClassName([
              currentPath === '' || currentPath === 'profile'
                ? 'active-link'
                : '',
              'switch-link',
            ])}
          >
            <span>
              <User />
            </span>
            <span>My Profile</span>
          </Link>
          <Link
            to={`/${basePath ?? ''}/bookings`}
            className={mergeStyleClassName([
              currentPath === 'bookings' ? 'active-link' : '',
              'switch-link',
            ])}
          >
            <span>
              <BulletList />
            </span>
            <span>My Bookings</span>
          </Link>
          <Link
            to={`/${basePath ?? ''}/places`}
            className={mergeStyleClassName([
              currentPath === 'places' ? 'active-link' : '',
              'switch-link',
            ])}
          >
            <span>
              <BuildingOffice />
            </span>
            <span>My Accomodation</span>
          </Link>
        </div>
        <Outlet />
      </div>
    </section>
  );
};
export { Account };
