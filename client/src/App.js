import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { ToastProvider } from 'react-toast-notifications';

// Компоненты
import LoginPage from './components/Auth/LoginPage';
import ChatLayout from './components/Layout/ChatLayout';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Контекст и сервисы
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import authService from './services/authService';

// Темы
const lightTheme = {
  colors: {
    primary: '#0088cc',
    primaryHover: '#006699',
    secondary: '#f5f5f5',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e1e5e9',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    online: '#28a745',
    away: '#ffc107',
    offline: '#6c757d'
  },
  shadows: {
    small: '0 1px 3px rgba(0,0,0,0.12)',
    medium: '0 4px 6px rgba(0,0,0,0.1)',
    large: '0 10px 25px rgba(0,0,0,0.15)'
  },
  borderRadius: '8px',
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  }
};

const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#4a9eff',
    primaryHover: '#3d8bdb',
    background: '#1a1a1a',
    surface: '#2d2d2d',
    secondary: '#3a3a3a',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    border: '#404040'
  }
};

// Глобальные стили
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    overflow: hidden;
  }

  #root {
    height: 100vh;
    width: 100vw;
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.secondary};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.textSecondary};
  }
`;

const AppContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
`;

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Компонент для публичных маршрутов (только для неавторизованных)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return !user ? children : <Navigate to="/" replace />;
};

// Основное приложение
function AppContent() {
  const { user, loading, theme } = useAuth();
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle />
      <AppContainer>
        <Router>
          <Routes>
            {/* Публичные маршруты */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } 
            />
            
            {/* Защищенные маршруты */}
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <ChatProvider>
                      <ChatLayout />
                    </ChatProvider>
                  </SocketProvider>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </AppContainer>
    </ThemeProvider>
  );
}

// Главный компонент приложения
function App() {
  return (
    <ToastProvider
      autoDismiss
      autoDismissTimeout={5000}
      placement="top-right"
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;