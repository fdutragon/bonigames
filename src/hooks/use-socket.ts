import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
  const [counter, setCounter] = useState<number>(0);

  useEffect(() => {
    if (!socket) {
      socket = io({ path: '/api/socketio' });
    }
    socket.on('update', setCounter);
    return () => {
      socket?.off('update', setCounter);
    };
  }, []);

  const increment = () => {
    socket?.emit('increment');
  };

  return { counter, increment };
}
