
import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background-dark)] p-4 selection:bg-[var(--accent-cyan)] selection:text-black">
      {children}
    </div>
  );
};