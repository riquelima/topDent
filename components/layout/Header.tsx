

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    TopDentLogo, 
    ArrowRightOnRectangleIcon, 
    ChatBubbleLeftRightIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    DocumentTextIcon,
    Cog6ToothIcon,
    HomeIcon,
    PhoneIcon
} from '../icons/HeroIcons';
import { NavigationPath } from '../../types';
import type { UserRole } from '../../App'; 
import { Button } from '../ui/Button';

interface NavLinkProps {
  to: NavigationPath | string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  isMobile?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children, icon, onClick, isMobile = false }) => {
  const location = useLocation();
  const baseToPath = typeof to === 'string' ? to.split('/:')[0] : to;
  const isActive = location.pathname === (to === NavigationPath.Home ? '/' : to) || 
                   (location.pathname.startsWith(baseToPath) && to !== NavigationPath.Home && baseToPath !== '/');

  const mobileStyles = "block px-4 py-3 rounded-xl text-base font-medium";
  const desktopStyles = "px-4 py-2 rounded-xl text-sm font-medium";

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${isMobile ? mobileStyles : desktopStyles} flex items-center transition-all duration-300 ease-in-out
        ${isActive ? 'bg-[var(--accent-cyan)] text-black shadow-[0_4px_14px_0_rgba(34,211,238,0.3)]' : 'text-gray-300 hover:bg-[var(--background-light)] hover:text-white'}`}
    >
      {icon && <span className="mr-2 h-5 w-5">{icon}</span>}
      <span>{children}</span>
    </Link>
  );
};

interface HeaderProps {
  onLogout: () => void;
  userRole: UserRole;
  userName: string | null;
  unreadChatCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, userRole, userName, unreadChatCount = 0 }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login'); 
    closeMobileMenu();
  };

  const isAdmin = userRole === 'admin';
  const isDentist = userRole === 'dentist';

  return (
    <header className="bg-black/50 backdrop-blur-lg shadow-lg fixed w-full top-0 z-50 border-b border-[var(--border-color)]">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-20">
          {/* Left section: Logo and Welcome */}
          <div className="flex items-center">
            <Link to={NavigationPath.Home} className="flex-shrink-0 animate-logo-pulse" onClick={closeMobileMenu}>
              <TopDentLogo className="h-10 md:h-12 w-auto" />
            </Link>
             {(isDentist || isAdmin) && userName && ( 
              <span className="ml-6 text-md font-medium text-[var(--text-secondary)] hidden md:block">
                Olá, {userName}
              </span>
            )}
          </div>

          {/* Center section: Main Navigation (Desktop) */}
          <div className="hidden md:block">
            {isAdmin && (
              <nav className="flex items-baseline space-x-1 lg:space-x-2">
                <NavLink to={NavigationPath.Home} icon={<HomeIcon />}>Início</NavLink>
                <NavLink to={NavigationPath.PatientsList} icon={<UserGroupIcon />}>Pacientes</NavLink>
                <NavLink to={NavigationPath.Appointments} icon={<CalendarDaysIcon />}>Agendamentos</NavLink>
                <NavLink to={NavigationPath.Return} icon={<PhoneIcon />}>Retornos</NavLink>
                <NavLink to={NavigationPath.ViewRecord} icon={<ClipboardDocumentListIcon />}>Prontuários</NavLink>
                <NavLink to={NavigationPath.ConsultationHistory} icon={<ClockIcon />}>Histórico</NavLink> 
                <NavLink to={NavigationPath.AllTreatmentPlans} icon={<DocumentTextIcon />}>Tratamentos</NavLink>
                <NavLink to={NavigationPath.Configurations} icon={<Cog6ToothIcon />}>Configurações</NavLink> 
              </nav>
            )}
          </div>
          
          {/* Right section: Logout and Mobile Menu Button */}
          <div className="flex items-center">
            <div className="hidden md:flex items-center">
                <Button
                  onClick={handleLogoutClick}
                  variant='danger'
                  size='md'
                  leftIcon={<ArrowRightOnRectangleIcon className="w-5 h-5 mr-1 transform scale-x-[-1]" />}
                >
                  Sair
                </Button>
            </div>
            
            <div className="md:hidden"> 
              <button
                onClick={toggleMobileMenu}
                className="text-gray-400 hover:text-white focus:outline-none p-2 rounded-md"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <span className="sr-only">Abrir menu principal</span>
                {isMobileMenuOpen ? (
                  <svg className="h-7 w-7" stroke="currentColor" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-7 w-7" stroke="currentColor" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-[var(--background-medium)] shadow-lg" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink to={NavigationPath.Home} onClick={closeMobileMenu} isMobile icon={<HomeIcon />}>Início</NavLink>
            {isAdmin && (
              <>
                <NavLink to={NavigationPath.PatientsList} onClick={closeMobileMenu} isMobile icon={<UserGroupIcon />}>Pacientes</NavLink>
                <NavLink to={NavigationPath.Appointments} onClick={closeMobileMenu} isMobile icon={<CalendarDaysIcon />}>Agendamentos</NavLink>
                <NavLink to={NavigationPath.Return} onClick={closeMobileMenu} isMobile icon={<PhoneIcon />}>Retornos</NavLink>
                <NavLink to={NavigationPath.ViewRecord} onClick={closeMobileMenu} isMobile icon={<ClipboardDocumentListIcon />}>Prontuários</NavLink>
                <NavLink to={NavigationPath.ConsultationHistory} onClick={closeMobileMenu} isMobile icon={<ClockIcon />}>Histórico</NavLink>
                <NavLink to={NavigationPath.AllTreatmentPlans} onClick={closeMobileMenu} isMobile icon={<DocumentTextIcon />}>Tratamentos</NavLink>
                <NavLink to={NavigationPath.Configurations} onClick={closeMobileMenu} isMobile icon={<Cog6ToothIcon />}>Configurações</NavLink>
              </>
            )}
             {(isDentist || isAdmin) && userName && (
              <div className="px-3 py-3 text-base font-medium text-[var(--text-secondary)] border-t border-[var(--border-color)] mt-2">
                Olá, {userName}
              </div>
            )}
          </div>
          <div className="pt-3 pb-4 border-t border-[var(--border-color)]">
            <div className="px-4">
              <Button
                  onClick={handleLogoutClick}
                  fullWidth
                  variant='danger'
                  leftIcon={<ArrowRightOnRectangleIcon className="w-5 h-5 mr-2 transform scale-x-[-1]" />}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};