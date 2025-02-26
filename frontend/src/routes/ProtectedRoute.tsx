import { Navigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import LogOutButton from '@/components/LogOutButton';
import { useAuth } from '@/contexts/AuthContext';
import Progress from '@/components/ui/progress';

function ProtectedRoute({ element }: { element: JSX.Element }) {
  const { isAuthenticated, loading } = useAuth();
  const { gameId } = useParams();
  const [progress] = useState(90);

  if (loading) {
    return (
      <div className="h-2/5 flex justify-center items-center">
        <Progress value={progress} className="w-[60%]" />
      </div>
    );
  }

  if (!isAuthenticated && gameId) {
    localStorage.setItem('gameId', gameId);
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
