import {
  RouterProvider,
  RouteObject,
  createBrowserRouter,
} from 'react-router-dom';
import { Layout } from '../layout';

import {
  Home,
  Authenicate,
  Profile,
  shouldBlockAuthAccess,
  shouldGrantProtectAccess,
  Account,
  Booking,
  Places,
} from '../../pages';

import { CreateNewAccomdation } from '../../component/place/create';
import {
  AccomodationForm,
  createAccomodationAction,
} from '../../component/place/form';

const route: RouteObject = {
  element: <Layout />,
  children: [
    { path: '/', element: <Home /> },
    {
      path: '/verify',
      element: <Authenicate />,
      loader: shouldBlockAuthAccess,
    },
    { path: '/login', element: <Authenicate />, loader: shouldBlockAuthAccess },
    {
      path: '/signup',
      element: <Authenicate />,
      loader: shouldBlockAuthAccess,
    },
    {
      path: '/account',
      element: <Account />,
      loader: shouldGrantProtectAccess,
      children: [
        { index: true, element: <Profile /> },
        { path: 'profile', element: <Profile /> },
        { path: 'bookings', element: <Booking /> },
        {
          path: 'places',
          element: <Places />,
          children: [
            { index: true, element: <CreateNewAccomdation /> },
            {
              path: 'new',
              element: <AccomodationForm />,
              action: createAccomodationAction,
            },
          ],
        },
      ],
    },
  ],
};
const router = createBrowserRouter([route]);

const PageRoute = () => {
  return <RouterProvider router={router} />;
};

export { PageRoute };
