import { Loader2, Clock, Badge, Trophy, User } from 'lucide-react';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { createNewGame } from '@/lib/api';
import useUserGames from '@/hooks/useUserGames';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [createGameError, setCreateGameError] = useState<null | string>(null);
  const { games, userId } = useUserGames();
  const navigate = useNavigate();

  // Calculate stats for user
  const totalGames = games.length;
  const wins = games.filter((game) => game.winner === userId).length;
  const losses = games.filter((game) => game.loser === userId).length;
  const draws = games.filter((game) => !game.winner && !game.loser).length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  async function createGame() {
    setIsLoading(true);

    try {
      const { gameId } = await createNewGame();

      if (gameId) {
        navigate(`/games/${gameId}`);
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.status === 401) {
          navigate('/login');
        }
      }

      setCreateGameError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="w-full min-h-svh bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Game Section */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-bold">Chess Arena</CardTitle>
            </div>
            <CardDescription>
              Create a new game or continue a match
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {createGameError && (
              <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-sm">
                {createGameError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <Button
                size="lg"
                className="w-full text-base font-medium h-16 shadow-sm"
                disabled={isLoading}
                onClick={() => createGame()}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <User className="mr-2 h-5 w-5" />
                )}
                Create New Game
              </Button>

              {/* Game stats summary */}
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                  <div className="text-green-600 dark:text-green-400 text-2xl font-bold">
                    {wins}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Wins
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                  <div className="text-amber-600 dark:text-amber-400 text-2xl font-bold">
                    {draws}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Draws
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                  <div className="text-red-600 dark:text-red-400 text-2xl font-bold">
                    {losses}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Losses
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-md mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Win Rate</span>
                  <Badge>{winRate}%</Badge>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game History */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-bold">
                Match History
              </CardTitle>
            </div>
            <CardDescription>Your recent chess matches</CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="text-right">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center py-8 text-slate-500"
                    >
                      No games played yet. Create your first game!
                    </TableCell>
                  </TableRow>
                ) : (
                  games.map((game, index) => {
                    // Determine outcome
                    let result;
                    let resultColor;

                    if (userId === game.winner) {
                      result = 'Victory';
                      resultColor = 'text-green-600 dark:text-green-400';
                    } else if (userId === game.loser) {
                      result = 'Defeat';
                      resultColor = 'text-red-600 dark:text-red-400';
                    } else {
                      result = 'Draw';
                      resultColor = 'text-amber-600 dark:text-amber-400';
                    }

                    return (
                      <TableRow
                        key={game.gameId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${resultColor}`}
                        >
                          {result}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              <TableCaption>Showing {games.length} recent games</TableCaption>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default Dashboard;
