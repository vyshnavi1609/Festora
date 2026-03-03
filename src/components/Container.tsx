import React, { PropsWithChildren } from 'react';

interface ContainerProps {
  className?: string;
  variant?: 'default' | 'compact' | 'full';
}

export const Container: React.FC<PropsWithChildren<ContainerProps>> = ({ 
  children, 
  className = '', 
  variant = 'default' 
}) => {
  const variantClasses = {
    default: 'max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8',
    compact: 'max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6',
    full: 'w-full px-4 sm:px-6 py-6 sm:py-8'
  };

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};
