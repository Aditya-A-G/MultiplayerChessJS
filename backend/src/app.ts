import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import api from './api';
import passport from './config/passport';
import sessionParser from './config/session';
import { ALLOWED_ORIGINS } from './config/config';
import { connectWithRetry } from './config/mongoDb';
import * as middlewares from './middlewares';

const app = express();

connectWithRetry();

app.use(morgan('dev'));
app.use(helmet());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(sessionParser);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());

app.use('/api/v1', api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
