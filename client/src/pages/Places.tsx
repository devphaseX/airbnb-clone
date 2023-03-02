import { Outlet, useOutletContext } from 'react-router-dom';

const Places = () => (
  <div>
    <Outlet context={useOutletContext()} />
  </div>
);
export { Places };
