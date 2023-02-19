import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from '../../ui/icon/plus';

const CreateNewAccomdation = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="new-accomodation">
      <button
        className="add-new-button"
        onClick={() => navigate(`${pathname}/new`)}
      >
        <span className="add-button-icon">
          <Plus />
        </span>
        <span>Add new place</span>
      </button>
    </div>
  );
};

export { CreateNewAccomdation };
