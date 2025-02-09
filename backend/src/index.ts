import app from './app';
import { PORT } from './config/config';
import { handleWebSocketUpgrade } from './websockets/webSocketHandler';

const port = PORT || 5000;
const server = app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});

server.on('upgrade', (request: Request, socket, head) => {
  handleWebSocketUpgrade(request, socket, head);
});
