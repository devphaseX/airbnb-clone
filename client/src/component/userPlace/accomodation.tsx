import { useLocation } from 'react-router-dom';
import { Plus } from '../../ui/icon/plus';
import { ShowUserAccomodation } from './showUserAccomodation';
import './showUserAccomodation';
import { useBlockLinkNavigate } from '../BlockableLink/lock';

const UserAccomodation = () => {
  const { pathname } = useLocation();
  const navigate = useBlockLinkNavigate();

  return (
    <div className="new-accomodation">
      <div className="accomodation-list">
        <button
          className="add-new-button"
          onClick={() => navigate({ to: `${pathname}/new` })}
        >
          <span className="add-button-icon">
            <Plus />
          </span>
          <span>Add new place</span>
        </button>
      </div>
      <ShowUserAccomodation />
    </div>
  );
};

export { UserAccomodation };
