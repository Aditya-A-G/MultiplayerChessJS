import { redisClient, publisher, subscriber } from '../../config/redis';
import {
  addUserConnection,
  deleteUserConnection,
  getUserConnection,
} from '../../store/user';

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

  const gameState = await redisClient.hGet(
    `games:${payload.data.gameId}`,
    'state'
  );
  const whoseTurn = await redisClient.hGet(
    `games:${payload.data.gameId}`,
    'whoseTurn'
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

    addUserConnection(userId, socket);

    return socket.send(
      JSON.stringify({
        method: 'joinGameResponse',
        status: 'success',
        data: {
          userId,
          gameStatus: 'gameStarted',
          gameState: gameState,
          whoseTurn: whoseTurn,
        },
      })
    );
  }

  await redisClient.sAdd(`games:${payload.data.gameId}:users`, userId);
  await redisClient.hSet('userGames', userId, payload.data.gameId);
  subscriber.subscribe(`games:${payload.data.gameId}`, async (message) => {
    const parsedPayload = JSON.parse(message);

    if (parsedPayload.method === 'makeMove') {
      const connection = getUserConnection(parsedPayload.to);

      if (!connection) return;
      return connection.send(
        JSON.stringify({
          method: 'opponentMove',
          move: parsedPayload.move,
          whoseTurn: parsedPayload.to,
        })
      );
    }

    if (parsedPayload.method === 'deleteUserConnection') {
      deleteUserConnection(parsedPayload.userId);
      subscriber.unsubscribe(`games:${payload.data.gameId}`);
    }

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

    await redisClient.hSet(`games:${payload.data.gameId}`, 'black', userId);

    socket.send(
      JSON.stringify({
        method: 'joinGameResponse',
        status: 'success',
        data: {
          userId,
          gameStatus: 'waitingForOpponent',
          gameState: gameState,
          orientation: 'black',
        },
      })
    );

    await publisher.publish(
      `games:${payload.data.gameId}`,
      JSON.stringify({
        method: 'gameStarted',
        status: 'success',
        data: {
          gameStatus: 'gameStarted',
          gameState: gameState,
          whoseTurn: players[0],
        },
      })
    );
    return;
  }

  await redisClient.hSet(`games:${payload.data.gameId}`, 'white', userId);

  return socket.send(
    JSON.stringify({
      method: 'joinGameResponse',
      status: 'success',
      data: {
        userId,
        gameStatus: 'waitingForOpponent',
        gameState: gameState,
      },
    })
  );
}

export async function handleMakeMove(
  socket: any,
  userId: string,
  payload: {
    method: string;
    data: { gameId: string; move: { after: string; before: string } };
  }
) {
  await redisClient.hSet(
    `games:${payload.data.gameId}`,
    'state',
    payload.data.move.after
  );

  const players = await redisClient.sMembers(
    `games:${payload.data.gameId}:users`
  );

  const whoseTurn = players[0] === userId ? players[1] : players[0];

  await redisClient.hSet(
    `games:${payload.data.gameId}`,
    'whoseTurn',
    whoseTurn
  );
  await publisher.publish(
    `games:${payload.data.gameId}`,
    JSON.stringify({
      method: 'makeMove',
      from: userId,
      to: whoseTurn,
      move: payload.data.move,
    })
  );
  return;
}

export async function handleGameEnd(
  socket: any,
  userId: string,
  payload: {
    method: string;
    data: { gameId: string };
  }
) {
  //TODO: Store all game data in MongoDb with updated status of Game and gameEnd reason!

  const players = await redisClient.sMembers(
    `games:${payload.data.gameId}:users`
  );

  players.forEach((player) => {
    const isDeleted = deleteUserConnection(player);
    if (isDeleted === false) {
      publisher.publish(
        `games:${payload.data.gameId}`,
        JSON.stringify({
          method: 'deleteUserConnection',
          userId: player,
        })
      );
    } else {
      subscriber.unsubscribe(`games:${payload.data.gameId}`);
    }
    redisClient.HDEL('userGames', player);
    redisClient.SREM(`games:${payload.data.gameId}:users`, player);
  });
}
