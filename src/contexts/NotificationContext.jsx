import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const newNotification = { id, message, type };

    setNotifications(prev => [...prev, newNotification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const value = { addNotification };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer notifications={notifications} />
    </NotificationContext.Provider>
  );
};

// This container will live here to keep logic coupled, but it's a presentational component.
// It receives notifications and renders them.
const NotificationContainer = ({ notifications }) => {
  return (
    <div className="fixed top-24 right-6 z-[200] w-full max-w-sm space-y-3">
      {notifications.map(n => (
        <Notification key={n.id} {...n} />
      ))}
    </div>
  );
};

// The actual notification component with styling.
const Notification = ({ message, type }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Mount animation
        setIsVisible(true);
        // Unmount logic is handled by the provider's timeout
    }, []);


  const baseClasses = "relative w-full p-4 border text-sm text-white font-mono rounded-none shadow-lg backdrop-blur-md animate-slide-in-from-right";
  const typeClasses = {
    info: 'bg-blue-900/50 border-blue-700',
    success: 'bg-green-900/50 border-green-700',
    error: 'bg-red-900/50 border-red-700',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type] || typeClasses.info}`}>
        <div className={`absolute top-0 left-0 bottom-0 w-1 ${type === 'success' ? 'bg-neon-green' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
        <p className="pl-2">{message}</p>
    </div>
  );
};

// We need to add the animation to tailwind or a css file.
// Let's add it to tailwind.config.js
