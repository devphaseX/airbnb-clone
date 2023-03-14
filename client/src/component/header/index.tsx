import { useLocation } from 'react-router-dom';
import airbnbLogo from '../../assets/logo.svg';
import './style.css';
import { Menu } from '../../ui/icon/menu';
import { World } from '../../ui/icon/world';
import { Person } from '../../ui/icon/person';
import { MenuList } from '../../ui/menuList';
import { useState } from 'react';
import { useStore } from 'zustand';
import { clientInfoStore } from '../../store/slice/user';
import { BlockableLink } from '../BlockableLink';
import { useBlockLinkNavigate } from '../BlockableLink/lock';

const Header = () => {
  const [openMenuList, setOpenMenuList] = useState(false);
  const pathname = useLocation().pathname;
  const navigate = useBlockLinkNavigate();
  const shouldOmitSearch = /^[/]?(?:login|signup)/.test(pathname);
  const user = useStore(clientInfoStore, (state) => state.user);
  return (
    <header className="header">
      <div className="header-wrapper section-wrapper">
        <div
          className="logo-wrapper"
          onClick={() => {
            navigate({ to: '/' });
          }}
        >
          <span>
            <img src={airbnbLogo} alt="website logo" />
            <p>airbnb</p>
          </span>
        </div>
        {!shouldOmitSearch ? (
          <div className="search-wrapper">
            <span>Anywhere</span>
            <span>Any week</span>

            <span className="search__input-wrapper">
              <span>Add guests</span>
              <span className="search__button-wrapper">
                <span className="search__button">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </span>
              </span>
            </span>
          </div>
        ) : null}
        <div className="product-action">
          <span>Become a Host</span>
          <span className="nav__icon">
            <World />
          </span>
          <span className="group__2">
            <span
              onClick={() => setOpenMenuList((status) => !status)}
              style={{ cursor: 'pointer' }}
            >
              <Menu />
            </span>
            <BlockableLink
              to={user ? '/account' : '/verify'}
              className="person"
            >
              <span className="person-icon">
                <Person />
              </span>

              {user ? <p>{`${user.firstName} ${user.lastName}`}</p> : null}
            </BlockableLink>
          </span>
          <div
            className="menu-list-wrapper"
            style={{ display: openMenuList ? 'initial' : 'none' }}
          >
            <MenuList
              open={openMenuList}
              close={() => setOpenMenuList(false)}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export { Header };
