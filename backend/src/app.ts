import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import api from './api';
import passport from './config/passport';
import sessionConfig from './config/session';
import { connectWithRetry } from './config/mongoDb';
import * as middlewares from './middlewares';

const app = express();

connectWithRetry();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(sessionConfig);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());

app.use('/api/v1', api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
