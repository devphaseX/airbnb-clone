import airbnbLogo from '../../assets/logo.svg';
import './style.css';
import { Menu } from '../../ui/icon/menu';
import { World } from '../../ui/icon/world';
import { Person } from '../../ui/icon/person';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const pathname = useLocation().pathname;
  return (
    <header className="header">
      <div className="header-wrapper section-wrapper">
        <div className="logo-wrapper">
          <span>
            <img src={airbnbLogo} alt="website logo" />
            <p>airbnb</p>
          </span>
        </div>
        {!/^[/]?login/.test(pathname) ? (
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
          <span>Become a member</span>
          <span className="nav__icon">
            <World />
          </span>
          <span className="group__2">
            <Menu />
            <span className="person-icon">
              <Person />
            </span>
          </span>
        </div>
      </div>
    </header>
  );
};

export { Header };

//eye <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
// <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
// </svg>
