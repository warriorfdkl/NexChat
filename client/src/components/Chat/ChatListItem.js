import React from 'react';
import styled from 'styled-components';
import { FiFile, FiUsers, FiLock } from 'react-icons/fi';
import moment from 'moment';

const ChatItem = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-left: 3px solid transparent;
  position: relative;
  
  &:hover {
    background: ${props => props.theme.colors.secondary};
  }
  
  ${props => props.isSelected && `
    background: ${props.theme.colors.primary}15;
    border-left-color: ${props.theme.colors.primary};
    
    &:hover {
      background: ${props.theme.colors.primary}20;
    }
  `}
`;

const ChatAvatar = styled.div`
  width: 48px;
  height: 48px;
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
  font-size: 20px;
  margin-right: ${props => props.theme.spacing.md};
  position: relative;
  flex-shrink: 0;
`;

const ChatIcon = styled.div`
  font-size: 20px;
`;

const ChatInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.sm};
`;

const ChatName = styled.div`
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;

const ChatTime = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  white-space: nowrap;
  flex-shrink: 0;
`;

const ChatPreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.sm};
`;

const LastMessage = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  
  ${props => props.isSystem && `
    font-style: italic;
    opacity: 0.8;
  `}
`;

const ChatMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  flex-shrink: 0;
`;

const UnreadBadge = styled.div`
  background: ${props => props.theme.colors.primary};
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${props => props.count > 99 && `
    font-size: 10px;
  `}
`;

const ChatTypeIcon = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  opacity: 0.7;
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.theme.colors.online};
  border: 2px solid ${props => props.theme.colors.background};
`;

const TypingIndicator = styled.div`
  color: ${props => props.theme.colors.primary};
  font-size: 13px;
  font-style: italic;
  animation: pulse 1.5s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const ChatListItem = ({ chat, isSelected, onClick }) => {
  const getChatIcon = () => {
    switch (chat.type) {
      case 'file':
        return <FiFile />;
      case 'group':
        return <FiUsers />;
      case 'private':
        return chat.settings?.isPrivate ? <FiLock /> : <FiUsers />;
      default:
        return <FiFile />;
    }
  };

  const formatTime = (date) => {
    const messageTime = moment(date);
    const now = moment();
    
    if (now.diff(messageTime, 'days') === 0) {
      return messageTime.format('HH:mm');
    } else if (now.diff(messageTime, 'days') === 1) {
      return 'Вчера';
    } else if (now.diff(messageTime, 'days') < 7) {
      return messageTime.format('ddd');
    } else {
      return messageTime.format('DD.MM');
    }
  };

  const getLastMessageText = () => {
    if (!chat.lastMessage) {
      return 'Нет сообщений';
    }

    const message = chat.lastMessage;
    
    if (message.type === 'system') {
      const systemData = message.content?.systemData;
      switch (systemData?.action) {
        case 'chat_created':
          return 'Чат создан';
        case 'user_joined':
          return 'Пользователь присоединился';
        case 'user_left':
          return 'Пользователь покинул чат';
        case 'file_updated':
          return 'Файл обновлен';
        default:
          return 'Системное сообщение';
      }
    }
    
    if (message.type === 'file') {
      return '📎 Файл';
    }
    
    if (message.type === 'image') {
      return '🖼️ Изображение';
    }
    
    return message.content?.text || 'Сообщение';
  };

  const getUnreadCount = () => {
    return chat.unreadCount || 0;
  };

  const isTyping = () => {
    // Здесь будет логика определения набора текста
    // Пока возвращаем false
    return false;
  };

  const getTypingText = () => {
    // Здесь будет логика получения текста о наборе
    return 'печатает...';
  };

  const isCreatorOnline = () => {
    // Здесь будет логика определения онлайн статуса создателя
    return chat.creator?.status === 'online';
  };

  const getMembersCount = () => {
    return chat.members?.length || 0;
  };

  const getChatDescription = () => {
    if (chat.type === 'file') {
      return `Файл: ${chat.vitrocadFile?.fileName || chat.name}`;
    }
    
    if (chat.type === 'group') {
      const count = getMembersCount();
      return `${count} участник${count === 1 ? '' : count < 5 ? 'а' : 'ов'}`;
    }
    
    return chat.description || '';
  };

  return (
    <ChatItem isSelected={isSelected} onClick={onClick}>
      <ChatAvatar type={chat.type}>
        <ChatIcon>
          {getChatIcon()}
        </ChatIcon>
        {isCreatorOnline() && chat.type === 'private' && (
          <OnlineIndicator />
        )}
      </ChatAvatar>
      
      <ChatInfo>
        <ChatHeader>
          <ChatName title={chat.name}>
            {chat.name}
          </ChatName>
          <ChatTime>
            {chat.lastMessage && formatTime(chat.lastMessage.createdAt)}
          </ChatTime>
        </ChatHeader>
        
        <ChatPreview>
          <LastMessage 
            isSystem={chat.lastMessage?.type === 'system'}
            title={getLastMessageText()}
          >
            {isTyping() ? (
              <TypingIndicator>
                {getTypingText()}
              </TypingIndicator>
            ) : (
              getLastMessageText()
            )}
          </LastMessage>
          
          <ChatMeta>
            {chat.type === 'group' && (
              <ChatTypeIcon title={getChatDescription()}>
                <FiUsers />
              </ChatTypeIcon>
            )}
            
            {chat.settings?.isPrivate && (
              <ChatTypeIcon title="Приватный чат">
                <FiLock />
              </ChatTypeIcon>
            )}
            
            {getUnreadCount() > 0 && (
              <UnreadBadge count={getUnreadCount()}>
                {getUnreadCount() > 99 ? '99+' : getUnreadCount()}
              </UnreadBadge>
            )}
          </ChatMeta>
        </ChatPreview>
      </ChatInfo>
    </ChatItem>
  );
};

export default ChatListItem;