import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  navigate('/dashboard');
}

export default App;
