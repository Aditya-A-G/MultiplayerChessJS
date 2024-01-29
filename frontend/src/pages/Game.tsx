import { useEffect } from 'react';

function Game() {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/');

    ws.addEventListener('open', () => {
      ws.send('hello there!');
    });

    ws.addEventListener('message', (event) => {
      console.log('Message from server: ', event.data);
    });

    ws.addEventListener('close', (event) => {
      console.log('WebSocket connection closed: ', event);
    });

    return () => {
      ws.close();
    };
  }, []);
  return <h1>Game Page</h1>;
}

export default Game;
