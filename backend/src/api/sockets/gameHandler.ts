import { redisClient, publisher, subscriber } from '../../config/redis';
import {
  addUserConnection,
  getUserConnection,
} from '../../store/userWebsocketConnection';

export async function handleJoinGame(
  socket: any,
  userId: string,
  payload: { method: string; data: { gameId: string } }
) {
  const isGameAvailable = await redisClient.hGet(
    `games:${payload.data.gameId}`,
    'status'
  );

  if (!isGameAvailable) {
    return socket.send(
      JSON.stringify({
        method: 'joinGameResponse',
        status: 'failure',
        data: {
          message: 'game not present',
        },
      })
    );
  }

  const onGoingGameOfPlayer = await redisClient.hGet('userGames', userId);

  if (
    onGoingGameOfPlayer !== null &&
    onGoingGameOfPlayer !== payload.data.gameId
  ) {
    return socket.send(
      JSON.stringify({
        method: 'joinGameResponse',
        status: 'failure',
        data: {
          message: 'Player is already present in other game',
        },
      })
    );
  }

  const noOfPlayersJoinedAlready = await redisClient.sCard(
    `games:${payload.data.gameId}:users`
  );

  if (noOfPlayersJoinedAlready === 2) {
    const currentUserGame = await redisClient.hGet('userGames', userId);

    if (currentUserGame !== payload.data.gameId) {
      return socket.send(
        JSON.stringify({
          method: 'joinGameResponse',
          status: 'failure',
          data: {
            message: 'No player slot available',
          },
        })
      );
    }

    return socket.send(
      JSON.stringify({
        method: 'joinGameResponse',
        status: 'success',
        data: {
          gameStatus: 'gameStarted',
          gameState: 'blah blah blah',
          whoseTurn: '', //TODO:FiX - get value from redis game state
        },
      })
    );
  }

  await redisClient.sAdd(`games:${payload.data.gameId}:users`, userId);
  await redisClient.hSet('userGames', userId, payload.data.gameId);

  subscriber.subscribe(`games:${payload.data.gameId}`, async (message) => {
    const players = await redisClient.sMembers(
      `games:${payload.data.gameId}:users`
    );

    players.forEach((player) => {
      const connection = getUserConnection(player);
      if (connection) {
        connection.send(message);
      }
    });
  });

  addUserConnection(userId, socket);

  const players = await redisClient.sMembers(
    `games:${payload.data.gameId}:users`
  );

  if (players.length == 2) {
    await redisClient.hSet(
      `games:${payload.data.gameId}`,
      'whoseTurn',
      players[0]
    );
    await publisher.publish(
      `games:${payload.data.gameId}`,
      JSON.stringify({
        method: 'gameStarted',
        status: 'success',
        data: {
          gameStatus: 'gameStarted',
          gameState: 'blah blah blah',
          whoseTurn: players[0],
        },
      })
    );
    return;
  }

  return socket.send(
    JSON.stringify({
      method: 'joinGameResponse',
      status: 'success',
      data: {
        gameStatus: 'waitingForOpponent',
        gameState: 'blah blah blah',
      },
    })
  );
}
