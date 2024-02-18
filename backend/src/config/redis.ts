import { createClient } from 'redis';
import { REDIS_URL, REDIS_PORT } from './config';

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

export { redisClient, publisher, subscriber };
