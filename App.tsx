

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { DashboardPage } from './pages/DashboardPage';
import { NewPatientPage } from './pages/NewPatientPage';
import { AnamnesisFormPage } from './pages/AnamnesisFormPage';
import { TreatmentPlanPage } from './pages/TreatmentPlanPage';
import { PatientListPage } from './pages/PatientListPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { PatientAnamnesisPage } from './pages/PatientAnamnesisPage';
import { PatientTreatmentPlansPage } from './pages/PatientTreatmentPlansPage';
import { AllTreatmentPlansPage } from './pages/AllTreatmentPlansPage';
import { ViewRecordPage } from './pages/ViewRecordPage';
import { LoginPage } from './pages/LoginPage';
import { DentistDashboardPage } from './pages/DentistDashboardPage'; 
import { ConfigurationsPage } from './pages/ConfigurationsPage';
import { ManageAppointmentPage } from './pages/ManageAppointmentPage'; 
import { ConsultationHistoryPage } from './pages/ConsultationHistoryPage';
import { ReturnsPage } from './pages/ReturnsPage'; 
import { NavigationPath, ChatMessage } from './types';
import { Button } from './components/ui/Button';
import { ToastProvider } from './contexts/ToastContext';
import { ChangelogModal } from './components/ChangelogModal';
import { DentistChangelogModal } from './components/DentistChangelogModal';
import { ChatWidget } from './components/ChatWidget';
import { DentistChatWidget } from './components/DentistChatWidget';


export type UserRole = 'admin' | 'dentist' | null;

interface AppLayoutProps {
  onLogout: () => void;
  userRole: UserRole;
  userName: string | null;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ onLogout, userRole, userName, children }) => {
  const mainPadding = "px-4 sm:px-6 lg:px-8";

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background-dark)] text-white selection:bg-[var(--accent-cyan)] selection:text-black">
      <Header onLogout={onLogout} userRole={userRole} userName={userName} />
      <main className={`flex-grow pt-28 pb-12 ${mainPadding}`}>
        {/* A restrição max-w-7xl foi removida para permitir que o conteúdo preencha a largura da tela. */}
        {children}
      </main>
      <Footer />
    </div>
  );
};

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="text-center py-10">
    <h1 className="text-3xl font-bold text-[var(--accent-cyan)]">{title}</h1>
    <p className="text-[var(--text-secondary)] mt-4">Esta página está em construção.</p>
    <Link to={NavigationPath.Home} className="mt-6 inline-block">
        <Button variant="primary">Voltar ao Início</Button>
    </Link>
  </div>
);

const SESSION_STORAGE_KEY = 'topDentUserSession_v1';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userDisplayFullName, setUserDisplayFullName] = useState<string | null>(null); 
  const [userIdForApi, setUserIdForApi] = useState<string | null>(null); 
  const [userUsername, setUserUsername] = useState<string | null>(null);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [isDentistChangelogModalOpen, setIsDentistChangelogModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    try {
      const persistedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (persistedSession) {
        const sessionData = JSON.parse(persistedSession);
        if (sessionData && sessionData.userRole && sessionData.userIdForApi && sessionData.userDisplayFullName) {
          setUserRole(sessionData.userRole);
          setUserIdForApi(sessionData.userIdForApi);
          setUserUsername(sessionData.userUsername);
          setUserDisplayFullName(sessionData.userDisplayFullName);
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Could not load user session from localStorage", error);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setIsInitializing(false);
    }
  }, []);
  
  const handleLoginSuccess = useCallback((role: UserRole, idForApi: string, username: string, displayFullName: string) => {
    const sessionData = { 
      userRole: role, 
      userIdForApi: idForApi, 
      userUsername: username, 
      userDisplayFullName: displayFullName 
    };
    setUserRole(role);
    setUserIdForApi(idForApi);
    setUserUsername(username);
    setUserDisplayFullName(displayFullName);
    
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error("Could not save user session to localStorage", error);
    }
    if (role === 'admin') {
        setIsChangelogModalOpen(true);
    }
    if (role === 'dentist') {
      setIsDentistChangelogModalOpen(true);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setUserRole(null);
    setUserIdForApi(null);
    setUserUsername(null);
    setUserDisplayFullName(null);
    setIsChangelogModalOpen(false);
    setIsDentistChangelogModalOpen(false);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error("Could not remove user session from localStorage", error);
    }
  }, []);

  const handleCloseChangelogModal = () => {
    setIsChangelogModalOpen(false);
  };
  
  const handleCloseDentistChangelogModal = () => {
    setIsDentistChangelogModalOpen(false);
  };

  const ProtectedRoute: React.FC<{children: JSX.Element; adminOnly?: boolean}> = ({ children, adminOnly = false }) => {
    if (isInitializing) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--background-dark)] text-white">
            Carregando sessão...
        </div>
      );
    }
    if (!userRole) {
      return <Navigate to="/login" replace />;
    }
    if (adminOnly && userRole !== 'admin') {
      return <Navigate to="/" replace />; 
    }
    return children;
  };
  
  const renderDashboard = () => {
    if (userRole === 'admin') {
      return <DashboardPage onLogout={handleLogout} />;
    }
    if (userRole === 'dentist' && userIdForApi && userUsername && userDisplayFullName) {
      return (
        <DentistDashboardPage
            dentistId={userIdForApi}
            dentistUsername={userUsername}
            dentistDisplayFullName={userDisplayFullName}
        />
      );
    }
    return <Navigate to="/login" replace />; 
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background-dark)] text-white">
        Inicializando...
      </div>
    );
  }

  return (
    <ToastProvider>
      <HashRouter>
        {userRole === 'admin' && <ChangelogModal isOpen={isChangelogModalOpen} onClose={handleCloseChangelogModal} />}
        {userRole === 'dentist' && <DentistChangelogModal isOpen={isDentistChangelogModalOpen} onClose={handleCloseDentistChangelogModal} />}
        <Routes>
          <Route
            path="/login"
            element={userRole && !isInitializing ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <>
                  <AppLayout onLogout={handleLogout} userRole={userRole} userName={userDisplayFullName}>
                    <Routes>
                      <Route index element={renderDashboard()} />
                      <Route path={NavigationPath.NewPatient.substring(1)} element={<ProtectedRoute adminOnly>{<NewPatientPage />}</ProtectedRoute>} />
                      <Route path={NavigationPath.EditPatient.substring(1)} element={<ProtectedRoute adminOnly>{<NewPatientPage />}</ProtectedRoute>} />
                      <Route path={NavigationPath.PatientsList.substring(1)} element={<ProtectedRoute adminOnly>{<PatientListPage />}</ProtectedRoute>} />
                      <Route path={NavigationPath.Anamnesis.substring(1)} element={<ProtectedRoute adminOnly>{<AnamnesisFormPage />}</ProtectedRoute>} />
                      <Route path={NavigationPath.AllTreatmentPlans.substring(1)} element={<ProtectedRoute adminOnly>{<AllTreatmentPlansPage />}</ProtectedRoute>} />
                      <Route path={NavigationPath.Configurations.substring(1)} element={<ProtectedRoute adminOnly>{<ConfigurationsPage />}</ProtectedRoute>} />
                      <Route path={NavigationPath.Appointments.substring(1)} element={<ProtectedRoute adminOnly><AppointmentsPage /></ProtectedRoute>} />
                      <Route path={NavigationPath.NewAppointment.substring(1)} element={<ProtectedRoute adminOnly><ManageAppointmentPage /></ProtectedRoute>} />
                      <Route path={NavigationPath.EditAppointment.substring(1)} element={<ProtectedRoute adminOnly><ManageAppointmentPage /></ProtectedRoute>} />
                      <Route path={NavigationPath.Return.substring(1)} element={<ProtectedRoute adminOnly><ReturnsPage /></ProtectedRoute>} />
                      <Route path={NavigationPath.TreatmentPlan.substring(1)} element={<TreatmentPlanPage />} />
                      <Route path={NavigationPath.EditTreatmentPlan.substring(1)} element={<TreatmentPlanPage />} />
                      <Route path={NavigationPath.ConsultationHistory.substring(1)} element={<ConsultationHistoryPage />} />
                      <Route path={NavigationPath.PatientDetail.substring(1)} element={<PatientDetailPage />} />
                      <Route path={NavigationPath.PatientAnamnesis.substring(1)} element={<PatientAnamnesisPage />} />
                      <Route path={NavigationPath.PatientTreatmentPlans.substring(1)} element={<PatientTreatmentPlansPage />} />
                      <Route path={NavigationPath.ViewRecord.substring(1)} element={<ViewRecordPage />} />
                      <Route path="*" element={<PlaceholderPage title="Página não encontrada" />} />
                    </Routes>
                  </AppLayout>

                  {userRole === 'admin' && userIdForApi && (
                     <ChatWidget adminId={userIdForApi} />
                  )}
                  
                  {userRole === 'dentist' && userIdForApi && (
                     <DentistChatWidget dentistId={userIdForApi} />
                  )}
                </>
              </ProtectedRoute>
            }
          />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;