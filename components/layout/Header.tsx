
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TopDentLogo } from '../icons/HeroIcons';
import { NavigationPath } from '../../types';

interface NavLinkProps {
  to: NavigationPath;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out
        ${isActive ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
    >
      {children}
    </Link>
  );
};

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-900 shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link to={NavigationPath.Home} className="flex-shrink-0">
              <TopDentLogo className="h-10 md:h-12 w-auto" />
            </Link>
          </div>
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink to={NavigationPath.Home}>Início</NavLink>
              <NavLink to={NavigationPath.NewPatient}>Pacientes</NavLink> {/* Simplified to link to NewPatient for now */}
              <NavLink to={NavigationPath.Appointments}>Agendamentos</NavLink>
              {/* Placeholder for more nav items */}
            </div>
          </nav>
          <div className="hidden md:block">
             <Link
                to="#" // Placeholder for logout action
                onClick={() => alert('Logout clicado!')}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-200 ease-in-out border border-red-500 hover:border-red-600"
              >
                Sair
              </Link>
          </div>
          <div className="md:hidden">
            {/* Mobile menu button can be added here */}
            <button className="text-gray-400 hover:text-white focus:outline-none focus:text-white">
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu, show/hide based on state can be added here */}
    </header>
  );
};
