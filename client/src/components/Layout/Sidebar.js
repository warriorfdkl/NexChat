import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiSearch, FiMenu, FiSettings, FiUser, FiPlus, FiMoreVertical } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import ChatListItem from '../Chat/ChatListItem';
import UserSearchModal from '../User/UserSearchModal';
import LoadingSpinner from '../UI/LoadingSpinner';

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme.colors.surface};
`;

const Header = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.background};
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text};
  font-size: 20px;
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius};
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.secondary};
  }
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
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

const SearchContainer = styled.div`
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  padding-left: 40px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 20px;
  background: ${props => props.theme.colors.secondary};
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.background};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.textSecondary};
  font-size: 16px;
  pointer-events: none;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius};
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.secondary};
  }
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserStatus = styled.div`
  font-size: 12px;
  color: ${props => {
    switch (props.status) {
      case 'online': return props.theme.colors.online;
      case 'away': return props.theme.colors.away;
      default: return props.theme.colors.textSecondary;
    }
  }};
`;

const ChatList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.xs} 0;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  gap: ${props => props.theme.spacing.md};
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 16px;
  line-height: 1.5;
`;

const CreateChatButton = styled.button`
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

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
`;

const ErrorMessage = styled.div`
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.error};
  text-align: center;
  font-size: 14px;
`;

const Sidebar = ({ onToggle, isMobile, isOpen }) => {
  const { user, logout } = useAuth();
  const { 
    chats, 
    selectedChat, 
    selectChat, 
    loading, 
    error, 
    loadChats,
    searchResults,
    searchUsers,
    clearSearch,
    searchLoading
  } = useChat();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Обработка поиска
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        clearSearch();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers, clearSearch]);

  const handleChatSelect = (chat) => {
    selectChat(chat);
    if (isMobile) {
      onToggle();
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleUserClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleCreateChat = () => {
    setShowUserSearch(true);
  };

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'В сети';
      case 'away': return 'Отошел';
      case 'offline': return 'Не в сети';
      default: return 'Неизвестно';
    }
  };

  const filteredChats = searchQuery.trim() 
    ? chats.filter(chat => 
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;

  const displayChats = searchQuery.trim() && searchResults.length > 0 
    ? searchResults 
    : filteredChats;

  return (
    <SidebarContainer>
      <Header>
        <HeaderTop>
          {isMobile && (
            <MenuButton onClick={onToggle}>
              <FiMenu />
            </MenuButton>
          )}
          <Title>Nexus Chat</Title>
          <HeaderActions>
            <ActionButton onClick={handleCreateChat} title="Создать чат">
              <FiPlus />
            </ActionButton>
            <ActionButton onClick={handleUserClick} title="Меню">
              <FiMoreVertical />
            </ActionButton>
          </HeaderActions>
        </HeaderTop>
        
        <SearchContainer>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Поиск чатов и пользователей..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </SearchContainer>
        
        {user && (
          <UserInfo onClick={handleUserClick}>
            <UserAvatar>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                getInitials(user.name)
              )}
            </UserAvatar>
            <UserDetails>
              <UserName>{user.name}</UserName>
              <UserStatus status={user.status}>
                {getStatusText(user.status)}
              </UserStatus>
            </UserDetails>
          </UserInfo>
        )}
      </Header>

      <ChatList>
        {loading && (
          <LoadingContainer>
            <LoadingSpinner text="Загрузка чатов..." />
          </LoadingContainer>
        )}
        
        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}
        
        {!loading && !error && displayChats.length === 0 && (
          <EmptyState>
            <EmptyIcon>💬</EmptyIcon>
            <EmptyText>
              {searchQuery.trim() 
                ? 'Ничего не найдено'
                : 'У вас пока нет чатов.\nЧаты будут создаваться автоматически при загрузке файлов в VitroCAD.'
              }
            </EmptyText>
            {!searchQuery.trim() && (
              <CreateChatButton onClick={handleCreateChat}>
                Найти пользователей
              </CreateChatButton>
            )}
          </EmptyState>
        )}
        
        {!loading && !error && displayChats.map(chat => (
          <ChatListItem
            key={chat._id}
            chat={chat}
            isSelected={selectedChat?._id === chat._id}
            onClick={() => handleChatSelect(chat)}
          />
        ))}
        
        {searchLoading && (
          <LoadingContainer>
            <LoadingSpinner size="small" text="Поиск..." />
          </LoadingContainer>
        )}
      </ChatList>
      
      {/* Модальное окно поиска пользователей */}
      {showUserSearch && (
        <UserSearchModal
          isOpen={showUserSearch}
          onClose={() => setShowUserSearch(false)}
        />
      )}
    </SidebarContainer>
  );
};

export default Sidebar;