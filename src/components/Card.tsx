import React, { PropsWithChildren } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'default' | 'elevated' | 'flat';
  hoverable?: boolean;
}

export const Card: React.FC<PropsWithChildren<CardProps>> = ({ 
  children, 
  className = '', 
  variant = 'default',
  hoverable = true,
  ...rest 
}) => {
  const variantClasses = {
    default: 'bg-white rounded-[40px] overflow-hidden border border-zinc-100 card-shadow',
    elevated: 'bg-white rounded-[40px] overflow-hidden border border-zinc-100 shadow-lg hover:shadow-2xl',
    flat: 'bg-zinc-50 rounded-[40px] overflow-hidden border border-zinc-100'
  };

  return (
    <div
      className={`${variantClasses[variant]} ${hoverable ? 'interactive' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
