import { Link, useNavigate } from 'react-router-dom';

import './style.css';
import { useStore } from 'zustand';
import { clientInfoStore } from '../../store/slice/user';

type MenuListProps = { close: () => void };
const MenuList = ({ close }: MenuListProps) => {
  const { user, resetUser } = useStore(clientInfoStore);
  const navigate = useNavigate();

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
          <Link to="/signup">Sign up</Link>
          <Link to="/login">Login</Link>
        </div>
      ) : (
        <span
          onClick={() => {
            resetUser();
            navigate('/login');
          }}
        >
          logout
        </span>
      )}
      <div>
        <Link to="#">Host your home</Link>
        <Link to="#">Host an experience</Link>
        <Link to="#">Help</Link>
      </div>
    </div>
  );
};

export { MenuList };
