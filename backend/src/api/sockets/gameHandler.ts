import redisClient from '../../config/redis';

export async function handleJoinGame(
  socket: any,
  userId: string,
  payload: { method: string; gameId: string }
) {
  await redisClient.sAdd(`games:${payload.gameId}:users`, userId);
  await redisClient.hSet('userGames', userId, payload.gameId);

  socket.send(
    JSON.stringify({
      method: 'joinGameResponse',
      status: 'success',
      message: 'game joined successfully',
    })
  );
}
