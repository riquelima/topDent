
import React, { useState, useCallback, useEffect } from 'react';
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
import { ChatPage } from './pages/ChatPage'; // Added
import { NavigationPath } from './types';
import { Button } from './components/ui/Button';
import { ToastProvider } from './contexts/ToastContext';
import { ChangelogModal } from './components/ChangelogModal';
import { updateUserPreferences } from './services/supabaseService';

export type UserRole = 'admin' | 'dentist' | null;

interface AppLayoutProps {
  onLogout: () => void;
  userRole: UserRole;
  userName: string | null; // This will now be the display name (full name)
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ onLogout, userRole, userName, children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#0e0e0e] text-white selection:bg-[#00bcd4] selection:text-black">
      <Header onLogout={onLogout} userRole={userRole} userName={userName} />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-screen-2xl mx-auto"> 
           {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="text-center py-10">
    <h1 className="text-3xl font-bold text-[#00bcd4]">{title}</h1>
    <p className="text-[#b0b0b0] mt-4">Esta página está em construção.</p>
    <Link to={NavigationPath.Home} className="mt-6 inline-block">
        <Button variant="primary">Voltar ao Início</Button>
    </Link>
  </div>
);

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userDisplayFullName, setUserDisplayFullName] = useState<string | null>(null); 
  const [userIdForApi, setUserIdForApi] = useState<string | null>(null); 
  const [userUsername, setUserUsername] = useState<string | null>(null);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    try {
      const persistedSession = localStorage.getItem('topDentUserSession');
      if (persistedSession) {
        const sessionData = JSON.parse(persistedSession);
        if (sessionData && sessionData.userRole && sessionData.userIdForApi) {
          setUserRole(sessionData.userRole);
          setUserIdForApi(sessionData.userIdForApi);
          setUserUsername(sessionData.userUsername);
          setUserDisplayFullName(sessionData.userDisplayFullName);
        }
      }
    } catch (error) {
      console.error("Could not load user session from localStorage", error);
      localStorage.removeItem('topDentUserSession');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const handleLoginSuccess = useCallback((role: UserRole, idForApi: string, username: string, displayFullName: string, showChangelog?: boolean) => {
    setUserRole(role);
    setUserIdForApi(idForApi);
    setUserUsername(username);
    setUserDisplayFullName(displayFullName);
    
    try {
      const sessionData = { userRole: role, userIdForApi: idForApi, userUsername: username, userDisplayFullName: displayFullName };
      localStorage.setItem('topDentUserSession', JSON.stringify(sessionData));
    } catch (error) {
      console.error("Could not save user session to localStorage", error);
    }

    if (role === 'admin' && showChangelog !== false) {
        setIsChangelogModalOpen(true);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setUserRole(null);
    setUserIdForApi(null);
    setUserUsername(null);
    setUserDisplayFullName(null);
    setIsChangelogModalOpen(false);
    try {
      localStorage.removeItem('topDentUserSession');
    } catch (error) {
      console.error("Could not remove user session from localStorage", error);
    }
  }, []);

  const handleCloseChangelogModal = async (dontShowAgain: boolean) => {
    setIsChangelogModalOpen(false);
    if (dontShowAgain && userRole === 'admin' && userIdForApi) {
        await updateUserPreferences(userIdForApi, { show_changelog: false });
    }
  };

  const ProtectedRoute: React.FC<{children: JSX.Element; adminOnly?: boolean}> = ({ children, adminOnly = false }) => {
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
      return <DashboardPage />;
    }
    if (userRole === 'dentist' && userIdForApi && userUsername && userDisplayFullName) {
      return <DentistDashboardPage dentistId={userIdForApi} dentistUsername={userUsername} dentistDisplayFullName={userDisplayFullName} onLogout={handleLogout} />;
    }
    return <Navigate to="/login" replace />; 
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0e0e0e] text-white">
        Carregando...
      </div>
    );
  }

  return (
    <ToastProvider>
      <HashRouter>
        {userRole === 'admin' && <ChangelogModal isOpen={isChangelogModalOpen} onClose={handleCloseChangelogModal} />}
        <Routes>
          <Route
            path="/login"
            element={userRole ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout onLogout={handleLogout} userRole={userRole} userName={userDisplayFullName}>
                  <Routes>
                    <Route index element={renderDashboard()} />
                    
                    {/* Admin Specific Routes */}
                    <Route 
                      path={NavigationPath.NewPatient.substring(1)} 
                      element={<ProtectedRoute adminOnly>{<NewPatientPage />}</ProtectedRoute>} 
                    />
                    <Route 
                      path={NavigationPath.EditPatient.substring(1)} 
                      element={<ProtectedRoute adminOnly>{<NewPatientPage />}</ProtectedRoute>} 
                    />
                    <Route 
                      path={NavigationPath.PatientsList.substring(1)} 
                      element={<ProtectedRoute adminOnly>{<PatientListPage />}</ProtectedRoute>} 
                    />
                    <Route 
                      path={NavigationPath.Anamnesis.substring(1)} 
                      element={<ProtectedRoute adminOnly>{<AnamnesisFormPage />}</ProtectedRoute>} 
                    />
                    <Route 
                      path={NavigationPath.AllTreatmentPlans.substring(1)} 
                      element={<ProtectedRoute adminOnly>{<AllTreatmentPlansPage />}</ProtectedRoute>} 
                    />
                     <Route 
                      path={NavigationPath.Chat.substring(1)} 
                      element={<ProtectedRoute adminOnly>{<ChatPage adminId={userIdForApi!} />}</ProtectedRoute>} 
                    />
                    <Route 
                      path={NavigationPath.Configurations.substring(1)} 
                      element={<ProtectedRoute adminOnly>{<ConfigurationsPage />}</ProtectedRoute>} 
                    />
                     <Route 
                      path={NavigationPath.Appointments.substring(1)} 
                      element={<ProtectedRoute adminOnly><AppointmentsPage /></ProtectedRoute>} 
                    />
                     <Route 
                      path={NavigationPath.NewAppointment.substring(1)} 
                      element={<ProtectedRoute adminOnly><ManageAppointmentPage /></ProtectedRoute>} 
                    />
                    <Route 
                      path={NavigationPath.EditAppointment.substring(1)} 
                      element={<ProtectedRoute adminOnly><ManageAppointmentPage /></ProtectedRoute>} 
                    />
                    <Route 
                      path={NavigationPath.Return.substring(1)} 
                      element={<ProtectedRoute adminOnly><ReturnsPage /></ProtectedRoute>} 
                    />


                    {/* Routes for Admin and Dentist */}
                    <Route path={NavigationPath.TreatmentPlan.substring(1)} element={<TreatmentPlanPage />} />
                    <Route path={NavigationPath.EditTreatmentPlan.substring(1)} element={<TreatmentPlanPage />} />
                    <Route 
                      path={NavigationPath.ConsultationHistory.substring(1)} 
                      element={<ConsultationHistoryPage />} // Accessible to both admin and dentist
                    />
                    
                    {/* Common Routes or routes accessible by logged-in users based on other logic */}
                    <Route path={NavigationPath.PatientDetail.substring(1)} element={<PatientDetailPage />} />
                    <Route path={NavigationPath.PatientAnamnesis.substring(1)} element={<PatientAnamnesisPage />} />
                    <Route path={NavigationPath.PatientTreatmentPlans.substring(1)} element={<PatientTreatmentPlansPage />} />
                   
                    <Route path={NavigationPath.ViewRecord.substring(1)} element={<ViewRecordPage />} />
                    
                    <Route path="*" element={<PlaceholderPage title="Página não encontrada" />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;
