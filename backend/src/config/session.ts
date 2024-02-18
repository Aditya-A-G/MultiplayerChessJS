import session from 'express-session';
import RedisStore from 'connect-redis';
import { redisClient } from './redis';
import { SESSION_SECRET } from './config';

const sessionParser = session({
  store: new RedisStore({
    client: redisClient,
  }),
  secret: SESSION_SECRET,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 10000 * 60 * 60 * 24,
  },
  resave: false,
  saveUninitialized: false,
});

export default sessionParser;
