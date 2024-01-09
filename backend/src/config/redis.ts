import { createClient } from 'redis';
import { REDIS_URL, REDIS_PORT } from './config';

const redisClient = createClient({
  socket: {
    host: REDIS_URL,
    port: Number(REDIS_PORT),
  },
});

redisClient.connect().catch(console.error);

export default redisClient;
