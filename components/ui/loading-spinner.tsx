import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ 
  text = "Cargando...", 
  size = 'md' 
}: LoadingSpinnerProps) {
  const spinnerSizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4'
  };
  
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  return (
    <div className="loading-container">
      <div className={`loading-spinner ${spinnerSizeClasses[size]}`}></div>
      {text && <p className={`loading-text ${textSizeClasses[size]}`}>{text}</p>}
    </div>
  );
} 