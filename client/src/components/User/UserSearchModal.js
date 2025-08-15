import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiSearch, FiX, FiUser, FiUserPlus, FiLoader } from 'react-icons/fi';
import { useChat } from '../../context/ChatContext';
import authService from '../../services/authService';
import LoadingSpinner from '../UI/LoadingSpinner';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing.md};
`;

const ModalContainer = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius};
  box-shadow: ${props => props.theme.shadows.large};
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  font-size: 20px;
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
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const SearchInputContainer = styled.div`
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  padding-left: 40px;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 16px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
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
  font-size: 18px;
  pointer-events: none;
`;

const ResultsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
  max-height: 400px;
`;

const UserList = styled.div`
  padding: ${props => props.theme.spacing.sm} 0;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
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
  margin-right: ${props => props.theme.spacing.md};
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserEmail = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
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
  margin-top: 2px;
`;

const AddButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius};
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryHover};
  }
  
  &:disabled {
    background: ${props => props.theme.colors.textSecondary};
    cursor: not-allowed;
  }
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

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
`;

const ErrorMessage = styled.div`
  padding: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.error};
  text-align: center;
  font-size: 14px;
  background: ${props => props.theme.colors.error}10;
  border: 1px solid ${props => props.theme.colors.error}30;
  border-radius: ${props => props.theme.borderRadius};
  margin: ${props => props.theme.spacing.md};
`;

const ModalFooter = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-top: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: flex-end;
  gap: ${props => props.theme.spacing.md};
`;

const CancelButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.secondary};
    border-color: ${props => props.theme.colors.textSecondary};
  }
`;

const UserSearchModal = ({ isOpen, onClose, chatId = null }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addingUsers, setAddingUsers] = useState(new Set());
  
  const { addMember, createFileChat } = useChat();

  // Поиск пользователей с дебаунсом
  const searchUsers = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authService.searchUsers(query);
      
      if (response.success) {
        setSearchResults(response.users || []);
      } else {
        setError(response.error || 'Ошибка поиска пользователей');
        setSearchResults([]);
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Дебаунс для поиска
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  // Очистка при закрытии
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
      setAddingUsers(new Set());
    }
  }, [isOpen]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAddUser = async (user) => {
    if (!chatId) {
      // Если нет chatId, создаем новый чат
      // Пока что просто закрываем модальное окно
      onClose();
      return;
    }

    setAddingUsers(prev => new Set([...prev, user.id]));

    try {
      const result = await addMember(chatId, user.id);
      
      if (result.success) {
        // Убираем пользователя из результатов поиска
        setSearchResults(prev => prev.filter(u => u.id !== user.id));
      } else {
        setError(result.error || 'Ошибка добавления пользователя');
      }
    } catch (err) {
      setError('Ошибка добавления пользователя');
    } finally {
      setAddingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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
      default: return '';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>
            {chatId ? 'Добавить участника' : 'Найти пользователей'}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>

        <SearchContainer>
          <SearchInputContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Введите имя, email или логин пользователя..."
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
            />
          </SearchInputContainer>
        </SearchContainer>

        <ResultsContainer>
          {error && (
            <ErrorMessage>
              {error}
            </ErrorMessage>
          )}

          {loading ? (
            <LoadingContainer>
              <LoadingSpinner text="Поиск пользователей..." />
            </LoadingContainer>
          ) : searchQuery.length < 2 ? (
            <EmptyState>
              <EmptyIcon>🔍</EmptyIcon>
              <EmptyText>
                Введите минимум 2 символа для поиска пользователей
              </EmptyText>
            </EmptyState>
          ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
            <EmptyState>
              <EmptyIcon>👤</EmptyIcon>
              <EmptyText>
                Пользователи не найдены.\nПопробуйте изменить запрос.
              </EmptyText>
            </EmptyState>
          ) : (
            <UserList>
              {searchResults.map(user => (
                <UserItem key={user.id}>
                  <UserAvatar>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      getInitials(user.name)
                    )}
                  </UserAvatar>
                  
                  <UserInfo>
                    <UserName>{user.name}</UserName>
                    {user.email && (
                      <UserEmail>{user.email}</UserEmail>
                    )}
                    {user.status && (
                      <UserStatus status={user.status}>
                        {getStatusText(user.status)}
                      </UserStatus>
                    )}
                  </UserInfo>
                  
                  <AddButton
                    onClick={() => handleAddUser(user)}
                    disabled={addingUsers.has(user.id)}
                  >
                    {addingUsers.has(user.id) ? (
                      <FiLoader className="animate-spin" />
                    ) : (
                      <>
                        <FiUserPlus />
                        {chatId ? 'Добавить' : 'Выбрать'}
                      </>
                    )}
                  </AddButton>
                </UserItem>
              ))}
            </UserList>
          )}
        </ResultsContainer>

        <ModalFooter>
          <CancelButton onClick={onClose}>
            Отмена
          </CancelButton>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default UserSearchModal;