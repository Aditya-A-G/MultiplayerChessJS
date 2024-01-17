import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { logOutUser } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function LogOutButton() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const logOut = async () => {
    await logOutUser();
    logout();
    navigate('/login');
  };

  return (
    <div className="border-red-700 w-full h-10 flex justify-end pr-5 pt-4">
      <Button onClick={logOut} className="">
        LogOut
      </Button>
    </div>
  );
}

export default LogOutButton;
