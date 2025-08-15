import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

// Компоненты
import Sidebar from './Sidebar';
import ChatWindow from '../Chat/ChatWindow';
import WelcomeScreen from '../Chat/WelcomeScreen';
import UserProfile from '../User/UserProfile';
import Settings from '../Settings/Settings';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background: ${props => props.theme.colors.background};
  overflow: hidden;
`;

const SidebarContainer = styled.div`
  width: 320px;
  min-width: 320px;
  height: 100vh;
  background: ${props => props.theme.colors.surface};
  border-right: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    width: ${props => props.isOpen ? '100vw' : '0'};
    min-width: ${props => props.isOpen ? '100vw' : '0'};
    position: absolute;
    z-index: 1000;
    transition: width 0.3s ease;
  }
`;

const MainContent = styled.div`
  flex: 1;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  
  @media (max-width: 768px) {
    width: ${props => props.sidebarOpen ? '0' : '100vw'};
  }
`;

const MobileOverlay = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.show ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: ${props => props.theme.colors.background};
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: ${props => props.theme.colors.background};
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: 18px;
  text-align: center;
  max-width: 400px;
`;

const RetryButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius};
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.primaryHover};
  }
`;

const ChatLayout = () => {
  const { user } = useAuth();
  const { chats, selectedChat, loading, error, loadChats } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Определение мобильного устройства
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Загрузка чатов при монтировании
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user, loadChats]);

  // Закрытие сайдбара при выборе чата на мобильных
  useEffect(() => {
    if (isMobile && selectedChat) {
      setSidebarOpen(false);
    }
  }, [selectedChat, isMobile]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  const handleRetry = () => {
    loadChats();
  };

  // Обработка ошибок
  if (error && !chats.length) {
    return (
      <ErrorContainer>
        <ErrorMessage>
          Произошла ошибка при загрузке чатов: {error}
        </ErrorMessage>
        <RetryButton onClick={handleRetry}>
          Попробовать снова
        </RetryButton>
      </ErrorContainer>
    );
  }

  return (
    <LayoutContainer>
      {/* Мобильный оверлей */}
      <MobileOverlay show={sidebarOpen && isMobile} onClick={handleOverlayClick} />
      
      {/* Боковая панель */}
      <SidebarContainer isOpen={sidebarOpen || !isMobile}>
        <Sidebar 
          onToggle={handleSidebarToggle}
          isMobile={isMobile}
          isOpen={sidebarOpen}
        />
      </SidebarContainer>
      
      {/* Основной контент */}
      <MainContent sidebarOpen={sidebarOpen && isMobile}>
        <Routes>
          {/* Главная страница чатов */}
          <Route 
            path="/" 
            element={
              selectedChat ? (
                <ChatWindow 
                  chat={selectedChat}
                  onToggleSidebar={handleSidebarToggle}
                  isMobile={isMobile}
                />
              ) : (
                <WelcomeScreen 
                  onToggleSidebar={handleSidebarToggle}
                  isMobile={isMobile}
                />
              )
            } 
          />
          
          {/* Конкретный чат */}
          <Route 
            path="/chat/:chatId" 
            element={
              <ChatWindow 
                onToggleSidebar={handleSidebarToggle}
                isMobile={isMobile}
              />
            } 
          />
          
          {/* Профиль пользователя */}
          <Route 
            path="/profile" 
            element={
              <UserProfile 
                onToggleSidebar={handleSidebarToggle}
                isMobile={isMobile}
              />
            } 
          />
          
          {/* Настройки */}
          <Route 
            path="/settings" 
            element={
              <Settings 
                onToggleSidebar={handleSidebarToggle}
                isMobile={isMobile}
              />
            } 
          />
        </Routes>
      </MainContent>
    </LayoutContainer>
  );
};

export default ChatLayout;