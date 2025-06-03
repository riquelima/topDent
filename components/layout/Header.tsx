
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TopDentLogo, ArrowRightOnRectangleIcon } from '../icons/HeroIcons'; // Added ArrowRightOnRectangleIcon for Sair
import { NavigationPath } from '../../types';

interface NavLinkProps {
  to: NavigationPath | string;
  children: React.ReactNode;
  onClick?: () => void; // Optional onClick for mobile menu item closure
  isMobile?: boolean; // To apply different styling if needed
}

const NavLink: React.FC<NavLinkProps> = ({ to, children, onClick, isMobile = false }) => {
  const location = useLocation();
  const baseToPath = typeof to === 'string' ? to.split('/:')[0] : to;
  const isActive = location.pathname === to || (location.pathname.startsWith(baseToPath) && to !== NavigationPath.Home && baseToPath !== '/');

  const mobileStyles = "block px-3 py-2 rounded-md text-base font-medium";
  const desktopStyles = "px-3 py-2 rounded-md text-sm font-medium";

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${isMobile ? mobileStyles : desktopStyles} transition-colors duration-200 ease-in-out
        ${isActive ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
    >
      {children}
    </Link>
  );
};

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    alert('Logout clicado!');
    closeMobileMenu();
  };

  return (
    <header className="bg-gray-900 shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link to={NavigationPath.Home} className="flex-shrink-0" onClick={closeMobileMenu}>
              <TopDentLogo className="h-10 md:h-12 w-auto" />
            </Link>
          </div>
          {/* Desktop Menu */}
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink to={NavigationPath.Home}>Início</NavLink>
              <NavLink to={NavigationPath.PatientsList}>Pacientes</NavLink>
              <NavLink to={NavigationPath.Appointments}>Agendamentos</NavLink>
            </div>
          </nav>
          <div className="hidden md:block">
             <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-200 ease-in-out border border-red-500 hover:border-red-600 flex items-center"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2 transform scale-x-[-1]" /> {/* Icon for Sair */}
                Sair
              </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-400 hover:text-white focus:outline-none focus:text-white p-2 rounded-md"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Abrir menu principal</span>
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu, show/hide based on state */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-800 shadow-lg" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink to={NavigationPath.Home} onClick={closeMobileMenu} isMobile>Início</NavLink>
            <NavLink to={NavigationPath.PatientsList} onClick={closeMobileMenu} isMobile>Pacientes</NavLink>
            <NavLink to={NavigationPath.Appointments} onClick={closeMobileMenu} isMobile>Agendamentos</NavLink>
          </div>
          <div className="pt-3 pb-3 border-t border-gray-700">
            <div className="flex items-center px-5">
              <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-red-700 hover:text-white transition-colors duration-200 ease-in-out border border-red-500 hover:border-red-600"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2 transform scale-x-[-1]" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
