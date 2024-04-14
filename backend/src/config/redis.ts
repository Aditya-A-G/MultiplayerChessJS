import { createClient } from 'redis';
import { REDIS_URL, REDIS_PORT } from './config';
import { handleGameEnd } from '../api/sockets/gameHandler';

const redisClient = createClient({
  socket: {
    host: REDIS_URL,
    port: Number(REDIS_PORT),
  },
});
const publisher = redisClient;

redisClient.connect().catch(console.error);

const subscriber = redisClient.duplicate();

subscriber.connect().catch(console.error);

function getUserIdFromKey(key: string): string | null {
  const match = key.match(/^leftTheGame:(.*)$/);
  return match ? match[1] : null;
}

redisClient.configSet('notify-keyspace-events', 'Ex');
subscriber.subscribe('__keyevent@0__:expired', async (message) => {
  const expiredKey = message;

  // Acquire lock before performing action
  const lockKey = `lock:${expiredKey}`;
  const lockValue = `${process.pid}:${Date.now()}`;
  const lockAcquired = await redisClient.set(lockKey, lockValue, {
    NX: true,
    EX: 10,
  }); // 10 seconds lock expiration

  if (lockAcquired === 'OK') {
    try {
      const playerLeftUserId = getUserIdFromKey(message) as string;
      let remainingPlayerUserId;
      const onGoingGameOfPlayer = (await redisClient.hGet(
        'userGames',
        playerLeftUserId
      )) as string;

      const players = await redisClient.sMembers(
        `games:${onGoingGameOfPlayer}:users`
      );

      if (players[0] === playerLeftUserId) {
        remainingPlayerUserId = players[1];
      } else {
        remainingPlayerUserId = players[0];
      }

      const opponentLeftPayload = {
        method: 'opponentLeft',
        remainingPlayerUserId: remainingPlayerUserId,
        playerLeftUserId: playerLeftUserId,
      };

      publisher.publish(
        `games:${onGoingGameOfPlayer}`,
        JSON.stringify(opponentLeftPayload)
      );

      handleGameEnd(playerLeftUserId, {
        method: 'endGame',
        data: { gameId: onGoingGameOfPlayer, reason: 'userLeftTheGame' },
      });
    } finally {
      // Release the lock
      await redisClient.DEL(lockKey);
    }
  }
});

export { redisClient, publisher, subscriber };
