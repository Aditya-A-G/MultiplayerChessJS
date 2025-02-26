/* eslint-disable no-plusplus */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable react/jsx-no-bind */
import { useNavigate, useParams } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Square } from 'react-chessboard/dist/chessboard/types';
import {
  Copy,
  Clock,
  Trophy,
  RefreshCw,
  Home,
  Flag,
  MessageSquare,
} from 'lucide-react';
import { useState, useEffect } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import useGame from '@/hooks/useGame';

function Game() {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { toast } = useToast();
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [gameTimer, setGameTimer] = useState<number>(0);
  const [capturedPieces, setCapturedPieces] = useState<{
    white: string[];
    black: string[];
  }>({
    white: [],
    black: [],
  });

  const currentUrl = window.location.href;

  const {
    ws,
    game,
    isLoading,
    gameStatus,
    progress,
    isYourTurn,
    orientation,
    alertTitle,
    open,
    showGameInviteLink,
    setGame,
    setIsYourTurn,
    setAlertTitle,
    setOpen,
  } = useGame(gameId as string);

  useEffect(() => {
    let interval: number | undefined;

    if (gameStatus === 'gameStarted' && !open) {
      interval = window.setInterval(() => {
        setGameTimer((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStatus, open]);

  // Track captured pieces
  useEffect(() => {
    if (game) {
      const captured = {
        white: [] as string[],
        black: [] as string[],
      };

      // Count pieces that should be on board
      const fen = game.fen();
      const pieces = fen.split(' ')[0];

      // Count existing pieces
      const pieceCounts = {
        p: 0,
        r: 0,
        n: 0,
        b: 0,
        q: 0,
        k: 0,
        P: 0,
        R: 0,
        N: 0,
        B: 0,
        Q: 0,
        K: 0,
      };

      for (const char of pieces) {
        if (char in pieceCounts) {
          pieceCounts[char as keyof typeof pieceCounts]++;
        }
      }

      // Calculate captured pieces
      const startingCounts = { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 };

      for (const piece in startingCounts) {
        // Black pieces captured by white
        const blackPiece = piece;
        const blackCaptured =
          startingCounts[piece as keyof typeof startingCounts] -
          pieceCounts[blackPiece as keyof typeof pieceCounts];

        for (let i = 0; i < blackCaptured; i++) {
          captured.white.push(blackPiece);
        }

        // White pieces captured by black
        const whitePiece = piece.toUpperCase();
        const whiteCaptured =
          startingCounts[piece as keyof typeof startingCounts] -
          pieceCounts[whitePiece as keyof typeof pieceCounts];

        for (let i = 0; i < whiteCaptured; i++) {
          captured.black.push(whitePiece);
        }
      }

      setCapturedPieces(captured);
    }
  }, [game]);

  function makeAMove(move: { from: Square; to: Square; promotion: string }) {
    try {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(move);
      if (result !== null && result !== undefined) {
        setGame(gameCopy);
      }
      const newMove = `${moveHistory.length + 1}. ${result.san}`;
      setMoveHistory([...moveHistory, newMove]);

      const isCheckmate = gameCopy.isCheckmate();
      const isDraw = gameCopy.isDraw();
      const isStalemate = gameCopy.isStalemate();
      const isInsufficientMaterial = gameCopy.isInsufficientMaterial();
      const isThreefoldRepetition = gameCopy.isThreefoldRepetition();

      return {
        move: result,
        isCheckmate,
        isDraw,
        isStalemate,
        isInsufficientMaterial,
        isThreefoldRepetition,
      };
    } catch (error) {
      return { move: null, isCheckmate: false, isDraw: false };
    }
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    const {
      move,
      isCheckmate,
      isDraw,
      isStalemate,
      isInsufficientMaterial,
      isThreefoldRepetition,
    } = makeAMove({
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
      setAlertTitle("It's a Draw, Try Again!");
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

  // Function to render captured pieces
  const renderCapturedPieces = (pieces: string[]) => {
    const pieceSymbols: Record<string, string> = {
      p: '♟',
      r: '♜',
      n: '♞',
      b: '♝',
      q: '♛',
      k: '♚',
      P: '♙',
      R: '♖',
      N: '♘',
      B: '♗',
      Q: '♕',
      K: '♔',
    };
    return pieces.map((piece, index) => (
      <span
        // eslint-disable-next-line react/no-array-index-key
        key={index}
        className={`text-xl ${
          piece === piece.toLowerCase() ? 'text-black' : 'text-slate-700'
        }`}
      >
        {pieceSymbols[piece]}
      </span>
    ));
  };

  const handleResign = () => {
    setAlertTitle('You Resigned');
    setOpen(true);

    ws.current?.send(
      JSON.stringify({
        method: 'endGame',
        data: {
          gameId,
          reason: 'Resigned',
        },
      })
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="min-h-svh bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <Toaster />

      {isLoading && (
        <div className="h-2/5 flex flex-col justify-center items-center gap-4 mt-8">
          <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300">
            Setting up game...
          </h2>
          <Progress value={progress} className="w-[60%]" />
        </div>
      )}

      {gameStatus === 'gameStarted' && (
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h1 className="text-xl font-bold">Chess Match</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Game info and controls - Mobile first (top) */}
            <div className="lg:col-span-2 lg:order-1 order-2 space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        {formatTime(gameTimer)}
                      </Badge>
                    </div>
                    <div>
                      {isYourTurn ? (
                        <Badge className="bg-green-500">Your Turn</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">
                          Opponent&apos;s Turn
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="font-medium text-sm mb-2">
                      Captured Pieces
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2 min-h-8 bg-slate-100 dark:bg-slate-800 p-2 rounded">
                      {renderCapturedPieces(capturedPieces.white)}
                    </div>
                    <div className="flex flex-wrap gap-1 min-h-8 bg-slate-100 dark:bg-slate-800 p-2 rounded">
                      {renderCapturedPieces(capturedPieces.black)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium text-sm">Move History</div>
                    <div className="h-48 overflow-y-auto bg-slate-100 dark:bg-slate-800 rounded p-2 text-sm">
                      {moveHistory.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {moveHistory.map((move, index) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <div key={index} className="font-mono">
                              {move}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-500 text-center py-4">
                          No moves yet
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleResign}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Resign
                    </Button>

                    <Button variant="outline" size="sm" className="flex-1">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Offer Draw
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chessboard - always centered */}
            <div className="lg:col-span-3 lg:order-2 order-1">
              <Card className="bg-slate-200 dark:bg-slate-800 shadow-md">
                <CardContent className="p-2 sm:p-4">
                  <Chessboard
                    id="MainBoard"
                    position={game.fen()}
                    arePiecesDraggable={isYourTurn}
                    onPieceDrop={onDrop}
                    boardOrientation={orientation}
                    customBoardStyle={{
                      borderRadius: '4px',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    }}
                    customDarkSquareStyle={{ backgroundColor: '#779556' }}
                    customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {open === true && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center text-xl">
                {alertTitle}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="flex justify-center py-4">
              {/* eslint-disable-next-line no-nested-ternary */}
              {alertTitle.includes('Won') ? (
                <Trophy className="h-16 w-16 text-amber-500" />
              ) : alertTitle.includes('Draw') ? (
                <RefreshCw className="h-16 w-16 text-blue-500" />
              ) : (
                <Flag className="h-16 w-16 text-red-500" />
              )}
            </div>
            <AlertDialogFooter>
              <Button
                className="w-full"
                onClick={() => {
                  navigate('/dashboard');
                }}
              >
                Return to Dashboard
              </Button>
              {alertTitle !== 'game not present' && (
                <AlertDialogCancel>View Board</AlertDialogCancel>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {showGameInviteLink && (
        <Dialog open={showGameInviteLink}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Game Invite Link</DialogTitle>
              <DialogDescription>
                Waiting for your opponent to join this game!
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 mt-4">
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
    </div>
  );
}

export default Game;
