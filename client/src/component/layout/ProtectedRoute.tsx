import { useStore } from 'zustand';
import { Navigate } from 'react-router-dom';
import { clientInfoStore } from '../../store/slice/user';

type ProtectedRouteProps = {
  children: React.ReactNode;
};
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const user = useStore(clientInfoStore, (state) => state.user);

  if (!user) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

export { ProtectedRoute };
