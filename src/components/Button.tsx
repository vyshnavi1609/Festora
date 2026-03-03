import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  className = '', 
  children, 
  disabled,
  ...rest 
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px]',
    lg: 'px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px]'
  };

  const variants: Record<string, string> = {
    primary: 'btn-primary',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200',
    ghost: 'bg-transparent text-zinc-900 hover:bg-zinc-50 border border-transparent',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
  };

  const baseClasses = 'font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button 
      className={`${baseClasses} ${sizeClasses[size]} ${variants[variant]} ${className}`} 
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};
