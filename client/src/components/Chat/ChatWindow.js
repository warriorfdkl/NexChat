import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { FiMenu, FiMoreVertical, FiUsers, FiFile, FiSend, FiPaperclip, FiSmile } from 'react-icons/fi';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import LoadingSpinner from '../UI/LoadingSpinner';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme.colors.background};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.surface};
  min-height: 70px;
`;

const MobileMenuButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text};
  font-size: 20px;
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius};
  transition: background-color 0.2s ease;
  margin-right: ${props => props.theme.spacing.md};
  
  &:hover {
    background: ${props => props.theme.colors.secondary};
  }
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const ChatInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const ChatAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => {
    switch (props.type) {
      case 'file': return props.theme.colors.primary;
      case 'group': return props.theme.colors.success;
      default: return props.theme.colors.textSecondary;
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
`;

const ChatDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChatName = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatSubtitle = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 18px;
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.secondary};
    color: ${props => props.theme.colors.text};
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`;

const InputContainer = styled.div`
  border-top: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.surface};
  padding: ${props => props.theme.spacing.md};
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: 16px;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const RetryButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius};
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.primaryHover};
  }
`;

const TypingIndicator = styled.div`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.textSecondary};
  font-size: 13px;
  font-style: italic;
  border-top: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.surface};
  animation: pulse 1.5s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const ChatWindow = ({ chat: propChat, onToggleSidebar, isMobile }) => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const {
    selectedChat,
    selectChat,
    getChatMessages,
    loadMessages,
    sendMessage,
    markMessagesAsRead,
    getTypingUsers,
    loading,
    error
  } = useChat();
  
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Определяем текущий чат
  const currentChat = propChat || selectedChat;
  
  // Загрузка чата по ID из URL
  useEffect(() => {
    if (chatId && (!selectedChat || selectedChat._id !== chatId)) {
      // Здесь нужно загрузить чат по ID
      // Пока используем заглушку
      console.log('Loading chat by ID:', chatId);
    }
  }, [chatId, selectedChat]);
  
  // Загрузка сообщений при выборе чата
  useEffect(() => {
    if (currentChat) {
      const loadChatMessages = async () => {
        setMessageLoading(true);
        setMessageError(null);
        
        try {
          await loadMessages(currentChat._id);
          await markMessagesAsRead(currentChat._id);
        } catch (error) {
          setMessageError('Ошибка загрузки сообщений');
        } finally {
          setMessageLoading(false);
        }
      };
      
      loadChatMessages();
    }
  }, [currentChat, loadMessages, markMessagesAsRead]);
  
  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [getChatMessages(currentChat?._id)]);
  
  const handleSendMessage = async (content, type = 'text', replyTo = null) => {
    if (!currentChat || !content.trim()) {
      return;
    }
    
    try {
      const result = await sendMessage(currentChat._id, content, type, replyTo);
      
      if (!result.success) {
        console.error('Ошибка отправки сообщения:', result.error);
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };
  
  const handleRetry = () => {
    if (currentChat) {
      loadMessages(currentChat._id);
    }
  };
  
  const getChatIcon = () => {
    if (!currentChat) return <FiFile />;
    
    switch (currentChat.type) {
      case 'file':
        return <FiFile />;
      case 'group':
        return <FiUsers />;
      default:
        return <FiFile />;
    }
  };
  
  const getChatSubtitle = () => {
    if (!currentChat) return '';
    
    if (currentChat.type === 'file') {
      return `Файл: ${currentChat.vitrocadFile?.fileName || currentChat.name}`;
    }
    
    if (currentChat.type === 'group') {
      const memberCount = currentChat.members?.length || 0;
      return `${memberCount} участник${memberCount === 1 ? '' : memberCount < 5 ? 'а' : 'ов'}`;
    }
    
    return currentChat.description || '';
  };
  
  const getTypingText = () => {
    const typingUsers = getTypingUsers(currentChat?._id);
    
    if (typingUsers.length === 0) {
      return null;
    }
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} печатает...`;
    }
    
    if (typingUsers.length === 2) {
      return `${typingUsers[0]} и ${typingUsers[1]} печатают...`;
    }
    
    return `${typingUsers[0]} и еще ${typingUsers.length - 1} печатают...`;
  };
  
  if (!currentChat) {
    return (
      <ChatContainer>
        <Header>
          {isMobile && (
            <MobileMenuButton onClick={onToggleSidebar}>
              <FiMenu />
            </MobileMenuButton>
          )}
          <ChatDetails>
            <ChatName>Выберите чат</ChatName>
            <ChatSubtitle>Выберите чат из списка для начала общения</ChatSubtitle>
          </ChatDetails>
        </Header>
      </ChatContainer>
    );
  }
  
  return (
    <ChatContainer>
      <Header>
        {isMobile && (
          <MobileMenuButton onClick={onToggleSidebar}>
            <FiMenu />
          </MobileMenuButton>
        )}
        
        <ChatInfo>
          <ChatAvatar type={currentChat.type}>
            {getChatIcon()}
          </ChatAvatar>
          
          <ChatDetails>
            <ChatName title={currentChat.name}>
              {currentChat.name}
            </ChatName>
            <ChatSubtitle title={getChatSubtitle()}>
              {getChatSubtitle()}
            </ChatSubtitle>
          </ChatDetails>
        </ChatInfo>
        
        <HeaderActions>
          <ActionButton title="Информация о чате">
            <FiMoreVertical />
          </ActionButton>
        </HeaderActions>
      </Header>
      
      <MessagesContainer>
        {messageLoading ? (
          <LoadingContainer>
            <LoadingSpinner text="Загрузка сообщений..." />
          </LoadingContainer>
        ) : messageError ? (
          <ErrorContainer>
            <ErrorMessage>{messageError}</ErrorMessage>
            <RetryButton onClick={handleRetry}>
              Попробовать снова
            </RetryButton>
          </ErrorContainer>
        ) : (
          <MessageList
            messages={getChatMessages(currentChat._id)}
            currentUser={user}
            chat={currentChat}
          />
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      {getTypingText() && (
        <TypingIndicator>
          {getTypingText()}
        </TypingIndicator>
      )}
      
      <InputContainer>
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={messageLoading}
          placeholder={`Сообщение в ${currentChat.name}...`}
        />
      </InputContainer>
    </ChatContainer>
  );
};

export default ChatWindow;