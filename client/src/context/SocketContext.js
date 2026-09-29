'use client';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { Capacitor } from '@capacitor/core';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Determine Server URL
    let serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://prominent-hookworm-dailyvibes-2b2f2caa.koyeb.app';
    
    // If running locally in browser (not Capacitor), use production server
    if (!Capacitor.isNativePlatform() && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      serverUrl = 'http://localhost:3001';
    }

    console.log('Socket connecting to:', serverUrl);
    
    const newSocket = io(serverUrl, {
      // Performance optimizations
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      
      // Reconnection settings
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      
      // Timeout settings
      timeout: 20000,
      
      // Ping settings for connection health
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      reconnectAttempts.current += 1;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.removeAllListeners();
      newSocket.close();
    };
  }, []);

  // Handle app visibility changes (mobile optimization)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && socket && !socket.connected) {
        console.log('App became visible, reconnecting socket...');
        socket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
