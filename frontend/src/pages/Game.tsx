import { useParams } from 'react-router-dom';
import useGameWebSocket from '@/hooks/useGameWebSocket';

function Game() {
  const { gameId } = useParams();

  useGameWebSocket(gameId as string);

  return <h1>Game Page</h1>;
}

export default Game;
