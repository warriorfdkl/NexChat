import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import { useToasts } from 'react-toast-notifications';

// Создание контекста
const SocketContext = createContext();

// Провайдер контекста
export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const {
    handleNewMessage,
    handleMessageEdited,
    handleMessageDeleted,
    handleUserTyping,
    handleUserStoppedTyping,
    selectedChat
  } = useChat();
  const { addToast } = useToasts();
  
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const typingTimeoutRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  // Подключение к WebSocket серверу
  useEffect(() => {
    if (!user || !token) {
      return;
    }

    const serverUrl = process.env.REACT_APP_SERVER_URL || window.location.origin;
    
    // Создаем соединение
    socketRef.current = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    const socket = socketRef.current;

    // Обработчики событий подключения
    socket.on('connect', () => {
      console.log('WebSocket подключен');
      setIsConnected(true);
      setConnectionError(null);
      
      // Присоединяемся к чатам пользователя
      socket.emit('join_chats');
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket отключен:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Сервер принудительно отключил соединение
        setConnectionError('Соединение разорвано сервером');
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Ошибка подключения WebSocket:', error);
      setConnectionError('Ошибка подключения к серверу');
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket переподключен после', attemptNumber, 'попыток');
      setIsConnected(true);
      setConnectionError(null);
      
      // Повторно присоединяемся к чатам
      socket.emit('join_chats');
    });

    socket.on('reconnect_error', (error) => {
      console.error('Ошибка переподключения:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('Не удалось переподключиться к серверу');
      setConnectionError('Не удалось подключиться к серверу');
    });

    // Обработчики сообщений
    socket.on('new_message', (data) => {
      console.log('Новое сообщение:', data);
      handleNewMessage(data);
      
      // Показываем уведомление, если чат не активен
      if (!selectedChat || selectedChat._id !== data.chatId) {
        addToast(`Новое сообщение от ${data.message.sender.name}`, {
          appearance: 'info',
          autoDismiss: true
        });
      }
    });

    socket.on('message_edited', (data) => {
      console.log('Сообщение отредактировано:', data);
      handleMessageEdited(data);
    });

    socket.on('message_deleted', (data) => {
      console.log('Сообщение удалено:', data);
      handleMessageDeleted(data);
    });

    socket.on('messages_read', (data) => {
      console.log('Сообщения прочитаны:', data);
      // Здесь можно обновить статус прочтения сообщений
    });

    // Обработчики набора текста
    socket.on('user_typing', (data) => {
      handleUserTyping(data);
    });

    socket.on('user_stopped_typing', (data) => {
      handleUserStoppedTyping(data);
    });

    // Обработчики статуса пользователей
    socket.on('user_status_changed', (data) => {
      console.log('Статус пользователя изменен:', data);
      // Здесь можно обновить статус пользователя в UI
    });

    // Обработчики уведомлений
    socket.on('notification', (data) => {
      console.log('Уведомление:', data);
      
      switch (data.type) {
        case 'new_chat_created':
          addToast(data.message, {
            appearance: 'success',
            autoDismiss: true
          });
          break;
        case 'file_updated':
          addToast(data.message, {
            appearance: 'info',
            autoDismiss: true
          });
          break;
        default:
          addToast(data.message, {
            appearance: 'info',
            autoDismiss: true
          });
      }
    });

    // Обработчик ошибок
    socket.on('error', (error) => {
      console.error('WebSocket ошибка:', error);
      addToast(error.message || 'Произошла ошибка', {
        appearance: 'error',
        autoDismiss: true
      });
    });

    // Очистка при размонтировании
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, token, handleNewMessage, handleMessageEdited, handleMessageDeleted, 
      handleUserTyping, handleUserStoppedTyping, selectedChat, addToast]);

  // Присоединение к конкретному чату
  const joinChat = (chatId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_chat', chatId);
    }
  };

  // Покидание чата
  const leaveChat = (chatId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_chat', chatId);
    }
  };

  // Отправка сообщения
  const sendMessage = (chatId, content, type = 'text', replyTo = null) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', {
        chatId,
        content,
        type,
        replyTo
      });
      return true;
    }
    return false;
  };

  // Редактирование сообщения
  const editMessage = (messageId, newContent) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('edit_message', {
        messageId,
        newContent
      });
      return true;
    }
    return false;
  };

  // Удаление сообщения
  const deleteMessage = (messageId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('delete_message', {
        messageId
      });
      return true;
    }
    return false;
  };

  // Начало набора текста
  const startTyping = (chatId) => {
    if (socketRef.current && isConnected && !isTyping) {
      socketRef.current.emit('typing_start', { chatId });
      setIsTyping(true);
      
      // Автоматически останавливаем индикатор через 3 секунды
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(chatId);
      }, 3000);
    }
  };

  // Остановка набора текста
  const stopTyping = (chatId) => {
    if (socketRef.current && isConnected && isTyping) {
      socketRef.current.emit('typing_stop', { chatId });
      setIsTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  // Обновление статуса пользователя
  const updateStatus = (status) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('update_status', status);
    }
  };

  // Присоединение к чату при его выборе
  useEffect(() => {
    if (selectedChat) {
      joinChat(selectedChat._id);
      
      return () => {
        if (selectedChat) {
          leaveChat(selectedChat._id);
        }
      };
    }
  }, [selectedChat]);

  // Очистка таймера набора при размонтировании
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Значение контекста
  const value = {
    // Состояние соединения
    isConnected,
    connectionError,
    isTyping,
    
    // Функции для работы с чатами
    joinChat,
    leaveChat,
    
    // Функции для работы с сообщениями
    sendMessage,
    editMessage,
    deleteMessage,
    
    // Функции для индикатора набора
    startTyping,
    stopTyping,
    
    // Функции для статуса пользователя
    updateStatus,
    
    // Прямой доступ к сокету (для расширенного использования)
    socket: socketRef.current
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Хук для использования контекста
export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket должен использоваться внутри SocketProvider');
  }
  
  return context;
};

export default SocketContext;