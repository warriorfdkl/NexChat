import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const SpinnerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  ${props => props.fullScreen && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props.theme.colors.background};
    z-index: 9999;
  `}
  ${props => props.inline && `
    display: inline-flex;
  `}
`;

const Spinner = styled.div`
  width: ${props => {
    switch (props.size) {
      case 'small': return '16px';
      case 'medium': return '24px';
      case 'large': return '40px';
      default: return '24px';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'small': return '16px';
      case 'medium': return '24px';
      case 'large': return '40px';
      default: return '24px';
    }
  }};
  border: ${props => {
    switch (props.size) {
      case 'small': return '2px';
      case 'medium': return '3px';
      case 'large': return '4px';
      default: return '3px';
    }
  }} solid ${props => props.theme.colors.border};
  border-top: ${props => {
    switch (props.size) {
      case 'small': return '2px';
      case 'medium': return '3px';
      case 'large': return '4px';
      default: return '3px';
    }
  }} solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.div`
  margin-left: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '12px';
      case 'medium': return '14px';
      case 'large': return '16px';
      default: return '14px';
    }
  }};
`;

const LoadingSpinner = ({ 
  size = 'medium', 
  text = '', 
  fullScreen = false, 
  inline = false 
}) => {
  return (
    <SpinnerContainer fullScreen={fullScreen} inline={inline}>
      <Spinner size={size} />
      {text && <LoadingText size={size}>{text}</LoadingText>}
    </SpinnerContainer>
  );
};

export default LoadingSpinner;