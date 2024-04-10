import { useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Move } from 'chess.js';
import { Square } from 'react-chessboard/dist/chessboard/types';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface JoinGameResponse {
  method: string;
  status: string;
  data: {
    gameState?: string;
    gameStatus?: string;
    whoseTurn?: string;
    message?: string;
    userId?: string;
    orientation: string;
  };
}

function Game() {
  const [game, setGame] = useState(new Chess());
  const [gameStatus, setGameStatus] = useState<string | undefined>('');
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [userId, setUserId] = useState<string | undefined>('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [open, setOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const ws = useRef<null | WebSocket>(null);
  const navigate = useNavigate();

  const { gameId } = useParams();

  const handleJoinGame = useCallback((payload: JoinGameResponse) => {
    if (payload.status === 'success') {
      setGameStatus(payload.data.gameStatus);
      setGame(new Chess(payload.data.gameState));
      setIsYourTurn(payload.data.whoseTurn === payload.data.userId);
      setUserId(payload.data.userId);
      if (payload.data.orientation === 'black') {
        setOrientation('black');
      }
    } else {
      setErrorMessage(payload.data.message);
    }
  }, []);

  const handleGameStarted = useCallback(
    (payload: JoinGameResponse) => {
      if (payload.status === 'success') {
        setGameStatus(payload.data.gameStatus);
        setGame(new Chess(payload.data.gameState));
        setIsYourTurn(payload.data.whoseTurn === userId);
      } else {
        setErrorMessage(payload.data.message);
      }
    },
    [userId]
  );

  const handleOpponentMove = useCallback(
    (payload: { method: string; move: Move; whoseTurn: string }) => {
      const updatedGame = new Chess(payload.move.after);
      setGame(updatedGame);

      if (updatedGame.isCheckmate()) {
        setAlertTitle('Opponent Won, Try Again!');
        setOpen(true);
      } else if (updatedGame.isDraw()) {
        setAlertTitle("It'a a Draw, Try Again!");
        setOpen(true);
      }
      setIsYourTurn(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

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
          handleGameStarted(payload);
          break;
        case 'opponentMove':
          handleOpponentMove(payload);
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
  }, [gameId, handleGameStarted, handleJoinGame, handleOpponentMove]);

  function makeAMove(move: { from: Square; to: Square; promotion: string }) {
    try {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(move);
      if (result !== null && result !== undefined) {
        setGame(gameCopy);
      }
      if (gameCopy.isCheckmate()) {
        setAlertTitle('You Won, Congrats!');
        setOpen(true);

        // Todo: Add reason for endGame
        ws.current?.send(
          JSON.stringify({
            method: 'endGame',
            data: {
              gameId,
            },
          })
        );
      } else if (gameCopy.isDraw()) {
        setAlertTitle("It'a a Draw, Try Again!");
        setOpen(true);

        // Todo: Add reason for endGame
        ws.current?.send(
          JSON.stringify({
            method: 'endGame',
            data: {
              gameId,
            },
          })
        );
      }

      return result;
    } catch (error) {
      return null;
    }
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    // illegal move
    if (move === null || move === undefined) return false;

    const makeMovePayload = {
      method: 'makeMove',
      data: { gameId, move },
    };

    ws.current?.send(JSON.stringify(makeMovePayload));

    setIsYourTurn(false);

    return true;
  }

  if (errorMessage) {
    return <div className="text-red-500">{errorMessage}</div>;
  }

  if (gameStatus === 'waitingForOpponent') {
    return <h1>Waiting for Opponent</h1>;
  }

  if (gameStatus === 'gameStarted') {
    return (
      <>
        <Chessboard
          position={game.fen()}
          arePiecesDraggable={isYourTurn}
          // eslint-disable-next-line react/jsx-no-bind
          onPieceDrop={onDrop}
          boardOrientation={orientation}
        />
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  navigate('/dashboard');
                }}
              >
                Close
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
}

export default Game;
