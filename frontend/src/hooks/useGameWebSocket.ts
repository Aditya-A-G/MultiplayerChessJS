import { useEffect } from 'react';

function useGameWebSocket(gameId: string) {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000/');

    const handleOpen = () => {
      const joinGamePayload = JSON.stringify({
        gameId,
        method: 'joinGame',
      });

      ws.send(joinGamePayload);
    };

    const handleMessage = (event: MessageEvent) => {
      const payload = JSON.parse(event.data);
      switch (payload.method) {
        case 'joinGameResponse':
          console.log('Received join game response');
          break;
        default:
          console.log('Unknown message type');
      }
    };

    const handleClose = (event: CloseEvent) => {
      console.log('WebSocket connection closed: ', event);
    };

    const handleError = (error: Event) => {
      console.error('WebSocket error: ', error);
    };

    ws.addEventListener('open', handleOpen);
    ws.addEventListener('message', handleMessage);
    ws.addEventListener('close', handleClose);
    ws.addEventListener('error', handleError);

    return () => {
      ws.close(1000);
      ws.removeEventListener('open', handleOpen);
      ws.removeEventListener('message', handleMessage);
      ws.removeEventListener('close', handleClose);
      ws.removeEventListener('error', handleError);
    };
  }, [gameId]);
}

export default useGameWebSocket;
