import { useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Move } from 'chess.js';
import { Square } from 'react-chessboard/dist/chessboard/types';
import { Copy } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Progress from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Label from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';

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
  const [open, setOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [progress, setProgress] = useState(13);
  const [isLoading, setIsLoading] = useState(true);
  const [showGameInviteLink, setShowGameInviteLink] = useState(false);
  const ws = useRef<null | WebSocket>(null);
  const navigate = useNavigate();
  const userId = useRef('');
  const { gameId } = useParams();
  const { toast } = useToast();

  const currentUrl = window.location.href;

  const interval = useRef<NodeJS.Timeout>();

  const handleJoinGame = useCallback((payload: JoinGameResponse) => {
    setIsLoading(false);
    if (payload.status === 'success') {
      setGameStatus(payload.data.gameStatus);
      if (payload.data.gameStatus === 'waitingForOpponent') {
        setShowGameInviteLink(true);
      }
      setGame(new Chess(payload.data.gameState));
      setIsYourTurn(payload.data.whoseTurn === payload.data.userId);
      userId.current = payload.data.userId as string;
      if (payload.data.orientation === 'black') {
        setOrientation('black');
      }
    } else {
      clearInterval(interval.current);
      setAlertTitle(payload.data.message as string);
      setOpen(true);
    }
  }, []);

  const handleGameStarted = useCallback((payload: JoinGameResponse) => {
    if (payload.status === 'success') {
      setShowGameInviteLink(false);
      setGameStatus(payload.data.gameStatus);
      setGame(new Chess(payload.data.gameState));
      setIsYourTurn(payload.data.whoseTurn === userId.current);
    } else {
      setAlertTitle(payload.data.message as string);
      setOpen(true);
    }
  }, []);

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

  const handleOpponentLeft = useCallback(() => {
    setAlertTitle('Opponent Left the Game!');
    setOpen(true);
  }, []);

  const handleGameClosed = useCallback(() => {
    setAlertTitle('Game Closed! Start a New Game...');
    setOpen(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(95), 500);

    ws.current = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);

    ws.current.onerror = (error) => {
      console.error(error);
    };

    ws.current.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      switch (payload.method) {
        case 'gameClosed':
          handleGameClosed();
          break;
        case 'opponentLeft':
          handleOpponentLeft();
          break;
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
      interval.current = setInterval(() => {
        const pingPayload = {
          method: 'ping',
        };

        ws.current?.send(JSON.stringify(pingPayload));
      }, 500); // 500ms

      setTimeout(() => {
        const joinGamePayload = {
          method: 'joinGame',
          data: { gameId },
        };

        ws.current?.send(JSON.stringify(joinGamePayload));
      }, 2000); // 2 seconds
    };

    ws.current.onclose = () => {
      clearInterval(interval.current);
    };

    const wsCurrent = ws.current;

    return () => {
      clearTimeout(timer);
      wsCurrent.close(1000);
      clearInterval(interval.current);
    };
  }, [
    gameId,
    handleGameStarted,
    handleJoinGame,
    handleOpponentMove,
    handleOpponentLeft,
    handleGameClosed,
  ]);

  function makeAMove(move: { from: Square; to: Square; promotion: string }) {
    try {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(move);
      if (result !== null && result !== undefined) {
        setGame(gameCopy);
      }
      const isCheckmate = gameCopy.isCheckmate();
      const isDraw = gameCopy.isDraw();

      return { move: result, isCheckmate, isDraw };
    } catch (error) {
      return { move: null, isCheckmate: false, isDraw: false };
    }
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    const { move, isCheckmate, isDraw } = makeAMove({
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

    if (isCheckmate) {
      setAlertTitle('You Won, Congrats!');
      setOpen(true);

      ws.current?.send(
        JSON.stringify({
          method: 'endGame',
          data: {
            gameId,
            reason: 'Won',
          },
        })
      );
    } else if (isDraw) {
      setAlertTitle("It'a a Draw, Try Again!");
      setOpen(true);

      ws.current?.send(
        JSON.stringify({
          method: 'endGame',
          data: {
            gameId,
            reason: 'Draw',
          },
        })
      );
    }

    return true;
  }

  return (
    <>
      <Toaster />
      {isLoading && (
        <div className="h-2/5 flex justify-center items-center">
          <Progress value={progress} className="w-[60%]" />
        </div>
      )}

      {gameStatus === 'gameStarted' && (
        <div className="w-full md:flex md:justify-center">
          <div className="md:w-full lg:w-[46%] ">
            <Chessboard
              position={game.fen()}
              arePiecesDraggable={isYourTurn}
              // eslint-disable-next-line react/jsx-no-bind
              onPieceDrop={onDrop}
              boardOrientation={orientation}
            />
          </div>
        </div>
      )}

      {open === true && (
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
      )}

      {showGameInviteLink && (
        <Dialog open={showGameInviteLink}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Game Invite link</DialogTitle>
              <DialogDescription>
                Waiting for Opponent to Join this Game!
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link" className="sr-only">
                  Link
                </Label>
                <Input id="link" defaultValue={currentUrl} readOnly />
              </div>
              <Button
                type="submit"
                size="sm"
                className="px-3"
                onClick={() => {
                  navigator.clipboard.writeText(currentUrl);
                  toast({
                    title: '🎉 Game Invite Copied!',
                    description:
                      'Ready to play? Challenge your friends to a chess match now!',
                  });
                }}
              >
                <span className="sr-only">Copy</span>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default Game;
