import mongoose from 'mongoose';

import { MONGO_USER, MONGO_PASSWORD, MONGO_IP } from './config';

let mongoURL = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}/?retryWrites=true&w=majority&appName=MultiplayerChess`;

export const connectWithRetry = () => {
  mongoose
    .connect(mongoURL)
    .then(() => console.log('successfully connected to DB'))
    .catch((e: Error) => {
      console.log(e);
      console.log('will try connect to DB after 5s');

      setTimeout(connectWithRetry, 5000);
    });
};
