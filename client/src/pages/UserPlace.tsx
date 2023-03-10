import { Outlet, useOutletContext } from 'react-router-dom';

const UserPlace = () => (
  <div>
    <Outlet context={useOutletContext()} />
  </div>
);
export { UserPlace };
