'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Use environment variable for server URL, fallback to localhost
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://prominent-hookworm-dailyvibes-2b2f2caa.koyeb.app';
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
