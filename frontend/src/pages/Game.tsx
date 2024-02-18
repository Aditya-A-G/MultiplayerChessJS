import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ChessBoard } from 'chessboard-ts';

interface JoinGameResponse {
  method: string;
  status: string;
  data: {
    gameState?: string;
    gameStatus?: string;
    whoseTurn?: string;
    message?: string;
  };
}

function Game() {
  const [gameState, setGameState] = useState<string | undefined>('');
  const [gameStatus, setGameStatus] = useState<string | undefined>('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const ws = useRef<null | WebSocket>(null);
  const chessboardRef = useRef(null);

  const { gameId } = useParams();

  const handleJoinGame = (payload: JoinGameResponse) => {
    if (payload.status === 'success') {
      setGameState(payload.data.gameState);
      setGameStatus(payload.data.gameStatus);
    } else {
      setErrorMessage(payload.data.message);
    }
  };

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:3000/');

    ws.current.onerror = (error) => {
      console.error(error);
    };

    ws.current.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      switch (payload.method) {
        case 'joinGameResponse':
          handleJoinGame(payload);
          break;
        case 'gameStarted':
          handleJoinGame(payload);
          break;
        default:
          console.log('message', event.data);
      }
    };

    ws.current.onopen = () => {
      const joinGamePayload = {
        method: 'joinGame',
        data: { gameId },
      };

      ws.current?.send(JSON.stringify(joinGamePayload));
    };
    const wsCurrent = ws.current;

    return () => {
      wsCurrent.close(1000);
    };
  }, [gameId]);

  useEffect(() => {
    if (gameStatus === 'gameStarted' && chessboardRef.current) {
      const chessboard = new ChessBoard({
        selector: chessboardRef.current,
        config: {
          position: 'start',
          draggable: true,
        },
      });
    }
  }, [gameStatus]);

  if (errorMessage) {
    return <div className="text-red-500">{errorMessage}</div>;
  }

  if (gameStatus === 'waitingForOpponent') {
    return <h1>Waiting for Opponent</h1>;
  }

  if (gameStatus === 'gameStarted') {
    return <div ref={chessboardRef} className="w-2/5" />;
  }
}

export default Game;
