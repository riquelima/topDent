import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-transparent border-t border-[var(--border-color)] mt-auto py-6">
      <div className="px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-[var(--text-secondary)]">
          &copy; {new Date().getFullYear()} Top Dent. Desenvolvido para a excelência.
        </p>
      </div>
    </footer>
  );
};