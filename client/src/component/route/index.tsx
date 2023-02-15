import {
  RouterProvider,
  RouteObject,
  createBrowserRouter,
} from 'react-router-dom';
import { Layout } from '../layout';

import { ProtectedRoute } from '../layout/ProtectedRoute';
import { Home, Authenicate, Profile, authAccessCheck } from '../../pages';

const route: RouteObject = {
  element: <Layout />,
  children: [
    { path: '/', element: <Home /> },
    { path: '/login', element: <Authenicate />, loader: authAccessCheck },
    { path: '/signup', element: <Authenicate />, loader: authAccessCheck },
    {
      path: '/profile',
      element: (
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      ),
    },
  ],
};
const router = createBrowserRouter([route]);

const PageRoute = () => {
  return <RouterProvider router={router} />;
};

export { PageRoute };
