import { WebSocketServer } from 'ws';
import sessionParser from '../config/session';
import { Request, Response } from 'express';
import { Duplex } from 'stream';
import { handleJoinGame } from '../api/sockets/gameHandler';

const wss = new WebSocketServer({ noServer: true });

function parseSession(request: Request) {
  return new Promise((resolve) => {
    sessionParser(request, {} as Response, resolve);
  });
}

function upgradeWebSocket(
  request: any,
  socket: Duplex,
  head: Buffer,
  userId: string
) {
  wss.handleUpgrade(request, socket, head, (client) => {
    wss.emit('connection', client, userId);
  });
}

export async function handleWebSocketUpgrade(
  request: any,
  socket: Duplex,
  head: Buffer
) {
  await parseSession(request);

  const userId = request.session.passport?.user;
  if (!userId) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  upgradeWebSocket(request, socket, head, userId);
}

export function handleWebSocketConnection(socket: any, userId: string) {
  socket.userId = userId;

  socket.on('message', (message: string) => {
    const payload = JSON.parse(message);

    switch (payload.method) {
      case 'joinGame':
        handleJoinGame(socket, userId, payload);
        break;
      default:
        console.log(
          `Received ${message.toLocaleString()} from user: ${socket.userId}`
        );
        socket.send('thanks for your message!');
    }
  });
}

wss.on('connection', handleWebSocketConnection);
