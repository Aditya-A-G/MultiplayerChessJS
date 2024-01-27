import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../../config/redis';

export const createGame = async (req: Request, res: Response) => {
  try {
    const gameId = uuidv4();

    await redisClient.hSet(`games:${gameId}`, {
      state: 'default',
      status: 'waiting',
    });

    res.json({ gameId });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
