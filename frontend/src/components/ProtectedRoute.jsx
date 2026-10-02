import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

export default function ProtectedRoute({ adminOnly = false, children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loading full />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  if (adminOnly && !user.is_admin) return <Navigate to="/" replace />;
  return children ?? <Outlet />;
}
