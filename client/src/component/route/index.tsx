import {
  RouterProvider,
  RouteObject,
  createBrowserRouter,
} from 'react-router-dom';
import { Layout } from '../layout';
import { Home, Authenicate } from '../../pages';

const route: RouteObject = {
  element: <Layout />,
  children: [
    { path: '/', element: <Home /> },
    { path: '/login', element: <Authenicate /> },
    { path: '/signup', element: <Authenicate /> },
  ],
};
const router = createBrowserRouter([route]);

const PageRoute = () => <RouterProvider router={router} />;

export { PageRoute };
