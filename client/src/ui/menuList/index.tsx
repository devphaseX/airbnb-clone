import { Link, useNavigate } from 'react-router-dom';
import { useStore } from 'zustand';
import { clientInfoStore } from '../../store/slice/user';
import { logoutUserApi } from '../../store/api';
import './style.css';

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
        <div>
          <span
            onClick={async () => {
              const response = await logoutUserApi();
              if (response.ok && response.status === 204) {
                resetUser();
                navigate('/');
              }
            }}
          >
            logout
          </span>
        </div>
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
