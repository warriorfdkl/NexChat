import React, { createContext, useContext, useReducer, useCallback } from 'react';
import chatService from '../services/chatService';
import { useAuth } from './AuthContext';

// Начальное состояние
const initialState = {
  chats: [],
  selectedChat: null,
  messages: {},
  loading: false,
  error: null,
  typingUsers: {},
  unreadCounts: {},
  searchResults: [],
  searchLoading: false
};

// Типы действий
const CHAT_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Чаты
  SET_CHATS: 'SET_CHATS',
  ADD_CHAT: 'ADD_CHAT',
  UPDATE_CHAT: 'UPDATE_CHAT',
  REMOVE_CHAT: 'REMOVE_CHAT',
  SELECT_CHAT: 'SELECT_CHAT',
  
  // Сообщения
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  REMOVE_MESSAGE: 'REMOVE_MESSAGE',
  MARK_MESSAGES_READ: 'MARK_MESSAGES_READ',
  
  // Набор текста
  SET_TYPING: 'SET_TYPING',
  CLEAR_TYPING: 'CLEAR_TYPING',
  
  // Непрочитанные сообщения
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  UPDATE_UNREAD_COUNT: 'UPDATE_UNREAD_COUNT',
  
  // Поиск
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  SET_SEARCH_LOADING: 'SET_SEARCH_LOADING',
  CLEAR_SEARCH: 'CLEAR_SEARCH'
};

// Редьюсер
const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case CHAT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case CHAT_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case CHAT_ACTIONS.SET_CHATS:
      return {
        ...state,
        chats: action.payload,
        loading: false
      };
    
    case CHAT_ACTIONS.ADD_CHAT:
      return {
        ...state,
        chats: [action.payload, ...state.chats]
      };
    
    case CHAT_ACTIONS.UPDATE_CHAT:
      return {
        ...state,
        chats: state.chats.map(chat => 
          chat._id === action.payload._id ? { ...chat, ...action.payload } : chat
        ),
        selectedChat: state.selectedChat?._id === action.payload._id 
          ? { ...state.selectedChat, ...action.payload }
          : state.selectedChat
      };
    
    case CHAT_ACTIONS.REMOVE_CHAT:
      return {
        ...state,
        chats: state.chats.filter(chat => chat._id !== action.payload),
        selectedChat: state.selectedChat?._id === action.payload ? null : state.selectedChat
      };
    
    case CHAT_ACTIONS.SELECT_CHAT:
      return {
        ...state,
        selectedChat: action.payload
      };
    
    case CHAT_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: action.payload.messages
        }
      };
    
    case CHAT_ACTIONS.ADD_MESSAGE:
      const chatId = action.payload.chatId || action.payload.message.chat;
      return {
        ...state,
        messages: {
          ...state.messages,
          [chatId]: [
            ...(state.messages[chatId] || []),
            action.payload.message
          ]
        }
      };
    
    case CHAT_ACTIONS.UPDATE_MESSAGE:
      const updateChatId = action.payload.message.chat;
      return {
        ...state,
        messages: {
          ...state.messages,
          [updateChatId]: (state.messages[updateChatId] || []).map(msg =>
            msg._id === action.payload.message._id ? action.payload.message : msg
          )
        }
      };
    
    case CHAT_ACTIONS.REMOVE_MESSAGE:
      const removeChatId = action.payload.chatId;
      return {
        ...state,
        messages: {
          ...state.messages,
          [removeChatId]: (state.messages[removeChatId] || []).filter(msg =>
            msg._id !== action.payload.messageId
          )
        }
      };
    
    case CHAT_ACTIONS.MARK_MESSAGES_READ:
      const readChatId = action.payload.chatId;
      return {
        ...state,
        messages: {
          ...state.messages,
          [readChatId]: (state.messages[readChatId] || []).map(msg => ({
            ...msg,
            readBy: msg.readBy || []
          }))
        },
        unreadCounts: {
          ...state.unreadCounts,
          [readChatId]: 0
        }
      };
    
    case CHAT_ACTIONS.SET_TYPING:
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.chatId]: {
            ...state.typingUsers[action.payload.chatId],
            [action.payload.userId]: action.payload.userName
          }
        }
      };
    
    case CHAT_ACTIONS.CLEAR_TYPING:
      const typingChatId = action.payload.chatId;
      const newTypingUsers = { ...state.typingUsers[typingChatId] };
      delete newTypingUsers[action.payload.userId];
      
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [typingChatId]: newTypingUsers
        }
      };
    
    case CHAT_ACTIONS.SET_UNREAD_COUNT:
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.chatId]: action.payload.count
        }
      };
    
    case CHAT_ACTIONS.UPDATE_UNREAD_COUNT:
      return {
        ...state,
        unreadCounts: {
          ...state.unreadCounts,
          [action.payload.chatId]: Math.max(0, 
            (state.unreadCounts[action.payload.chatId] || 0) + action.payload.delta
          )
        }
      };
    
    case CHAT_ACTIONS.SET_SEARCH_RESULTS:
      return {
        ...state,
        searchResults: action.payload,
        searchLoading: false
      };
    
    case CHAT_ACTIONS.SET_SEARCH_LOADING:
      return {
        ...state,
        searchLoading: action.payload
      };
    
    case CHAT_ACTIONS.CLEAR_SEARCH:
      return {
        ...state,
        searchResults: [],
        searchLoading: false
      };
    
    default:
      return state;
  }
};

// Создание контекста
const ChatContext = createContext();

// Провайдер контекста
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user } = useAuth();

  // Загрузка списка чатов
  const loadChats = useCallback(async () => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      
      const response = await chatService.getChats();
      
      if (response.success) {
        dispatch({ type: CHAT_ACTIONS.SET_CHATS, payload: response.chats });
        
        // Устанавливаем количество непрочитанных сообщений
        response.chats.forEach(chat => {
          if (chat.unreadCount > 0) {
            dispatch({
              type: CHAT_ACTIONS.SET_UNREAD_COUNT,
              payload: { chatId: chat._id, count: chat.unreadCount }
            });
          }
        });
      } else {
        dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: response.error });
      }
    } catch (error) {
      dispatch({ 
        type: CHAT_ACTIONS.SET_ERROR, 
        payload: error.message || 'Ошибка загрузки чатов' 
      });
    }
  }, []);

  // Выбор чата
  const selectChat = useCallback(async (chat) => {
    try {
      dispatch({ type: CHAT_ACTIONS.SELECT_CHAT, payload: chat });
      
      // Загружаем сообщения чата
      if (chat && !state.messages[chat._id]) {
        await loadMessages(chat._id);
      }
      
      // Отмечаем сообщения как прочитанные
      if (chat) {
        await markMessagesAsRead(chat._id);
      }
    } catch (error) {
      console.error('Ошибка выбора чата:', error);
    }
  }, [state.messages]);

  // Загрузка сообщений чата
  const loadMessages = useCallback(async (chatId, page = 1) => {
    try {
      const response = await chatService.getMessages(chatId, page);
      
      if (response.success) {
        dispatch({
          type: CHAT_ACTIONS.SET_MESSAGES,
          payload: { chatId, messages: response.messages }
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  }, []);

  // Отправка сообщения
  const sendMessage = useCallback(async (chatId, content, type = 'text', replyTo = null) => {
    try {
      // Добавляем временное сообщение
      const tempMessage = {
        _id: `temp_${Date.now()}`,
        chat: chatId,
        sender: user,
        type,
        content: { text: content },
        replyTo,
        createdAt: new Date().toISOString(),
        status: 'sending'
      };
      
      dispatch({
        type: CHAT_ACTIONS.ADD_MESSAGE,
        payload: { chatId, message: tempMessage }
      });
      
      // Отправляем через WebSocket (будет реализовано в SocketContext)
      // Здесь пока заглушка
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Отметка сообщений как прочитанных
  const markMessagesAsRead = useCallback(async (chatId) => {
    try {
      const response = await chatService.markAsRead(chatId);
      
      if (response.success) {
        dispatch({
          type: CHAT_ACTIONS.MARK_MESSAGES_READ,
          payload: { chatId }
        });
      }
    } catch (error) {
      console.error('Ошибка отметки сообщений:', error);
    }
  }, []);

  // Создание чата для файла
  const createFileChat = useCallback(async (fileData) => {
    try {
      const response = await chatService.createFileChat(fileData);
      
      if (response.success) {
        dispatch({ type: CHAT_ACTIONS.ADD_CHAT, payload: response.chat });
        return { success: true, chat: response.chat };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Добавление участника в чат
  const addMember = useCallback(async (chatId, userId) => {
    try {
      const response = await chatService.addMember(chatId, userId);
      
      if (response.success) {
        // Обновляем чат в списке
        const updatedChat = state.chats.find(chat => chat._id === chatId);
        if (updatedChat) {
          dispatch({
            type: CHAT_ACTIONS.UPDATE_CHAT,
            payload: { ...updatedChat, membersCount: (updatedChat.membersCount || 0) + 1 }
          });
        }
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [state.chats]);

  // Поиск пользователей
  const searchUsers = useCallback(async (query) => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_SEARCH_LOADING, payload: true });
      
      const response = await chatService.searchUsers(query);
      
      if (response.success) {
        dispatch({ type: CHAT_ACTIONS.SET_SEARCH_RESULTS, payload: response.users });
      } else {
        dispatch({ type: CHAT_ACTIONS.SET_SEARCH_RESULTS, payload: [] });
      }
    } catch (error) {
      dispatch({ type: CHAT_ACTIONS.SET_SEARCH_RESULTS, payload: [] });
    }
  }, []);

  // Очистка поиска
  const clearSearch = useCallback(() => {
    dispatch({ type: CHAT_ACTIONS.CLEAR_SEARCH });
  }, []);

  // Обработчики WebSocket событий (будут вызываться из SocketContext)
  const handleNewMessage = useCallback((data) => {
    dispatch({
      type: CHAT_ACTIONS.ADD_MESSAGE,
      payload: { chatId: data.chatId, message: data.message }
    });
    
    // Обновляем счетчик непрочитанных, если чат не выбран
    if (!state.selectedChat || state.selectedChat._id !== data.chatId) {
      dispatch({
        type: CHAT_ACTIONS.UPDATE_UNREAD_COUNT,
        payload: { chatId: data.chatId, delta: 1 }
      });
    }
  }, [state.selectedChat]);

  const handleMessageEdited = useCallback((data) => {
    dispatch({
      type: CHAT_ACTIONS.UPDATE_MESSAGE,
      payload: { message: data.message }
    });
  }, []);

  const handleMessageDeleted = useCallback((data) => {
    dispatch({
      type: CHAT_ACTIONS.REMOVE_MESSAGE,
      payload: { chatId: data.chatId, messageId: data.messageId }
    });
  }, []);

  const handleUserTyping = useCallback((data) => {
    dispatch({
      type: CHAT_ACTIONS.SET_TYPING,
      payload: {
        chatId: data.chatId,
        userId: data.userId,
        userName: data.userName
      }
    });
    
    // Автоматически убираем индикатор через 3 секунды
    setTimeout(() => {
      dispatch({
        type: CHAT_ACTIONS.CLEAR_TYPING,
        payload: { chatId: data.chatId, userId: data.userId }
      });
    }, 3000);
  }, []);

  const handleUserStoppedTyping = useCallback((data) => {
    dispatch({
      type: CHAT_ACTIONS.CLEAR_TYPING,
      payload: { chatId: data.chatId, userId: data.userId }
    });
  }, []);

  // Значение контекста
  const value = {
    // Состояние
    chats: state.chats,
    selectedChat: state.selectedChat,
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    typingUsers: state.typingUsers,
    unreadCounts: state.unreadCounts,
    searchResults: state.searchResults,
    searchLoading: state.searchLoading,
    
    // Функции
    loadChats,
    selectChat,
    loadMessages,
    sendMessage,
    markMessagesAsRead,
    createFileChat,
    addMember,
    searchUsers,
    clearSearch,
    
    // WebSocket обработчики
    handleNewMessage,
    handleMessageEdited,
    handleMessageDeleted,
    handleUserTyping,
    handleUserStoppedTyping,
    
    // Вспомогательные функции
    getChatMessages: (chatId) => state.messages[chatId] || [],
    getUnreadCount: (chatId) => state.unreadCounts[chatId] || 0,
    getTypingUsers: (chatId) => Object.values(state.typingUsers[chatId] || {}),
    
    // Очистка ошибки
    clearError: () => dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR })
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Хук для использования контекста
export const useChat = () => {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat должен использоваться внутри ChatProvider');
  }
  
  return context;
};

export default ChatContext;