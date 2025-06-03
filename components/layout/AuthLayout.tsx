import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] p-4 selection:bg-blue-500 selection:text-white">
      {children}
    </div>
  );
};