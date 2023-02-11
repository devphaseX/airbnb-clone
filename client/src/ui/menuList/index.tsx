import { Link } from 'react-router-dom';

import './style.css';

type MenuListProps = { close: () => void };
const MenuList = ({ close }: MenuListProps) => {
  return (
    <div
      className="menuList"
      onClick={(event) => {
        if ((event.target as HTMLElement).tagName.toLowerCase() === 'a') {
          close();
        }
      }}
    >
      <div>
        <Link to="/signup">Sign up</Link>
        <Link to="/login">Login</Link>
      </div>
      <div>
        <Link to="#">Host your home</Link>
        <Link to="#">Host an experience</Link>
        <Link to="#">Help</Link>
      </div>
    </div>
  );
};

export { MenuList };
