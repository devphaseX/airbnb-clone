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
  UserPlace,
  Place,
  placeLoader,
} from '../../pages';

import { UserAccomodation } from '../userPlace/accomodation';
import { AccomodationForm } from '../userPlace/form';
import { userAccomodationLoader } from '../userPlace/showUserAccomodation';

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

    { path: '/place/:placeId', element: <Place />, loader: placeLoader },
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
          element: <UserPlace />,
          children: [
            { index: true, element: <UserAccomodation /> },

            {
              path: 'new',
              element: <AccomodationForm />,
            },

            {
              path: ':placeId',
              element: <AccomodationForm />,
              loader: userAccomodationLoader,
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

export { PageRoute, router };
