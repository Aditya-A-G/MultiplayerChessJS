import { Navigate } from 'react-router-dom';
import LogOutButton from '@/components/LogOutButton';
import { useAuth } from '@/contexts/AuthContext';

function ProtectedRoute({ element }: { element: JSX.Element }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (!isAuthenticated && !loading) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <LogOutButton />
      {element}
    </>
  );
}

export default ProtectedRoute;
