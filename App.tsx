import React, { useState, useCallback } from 'react';
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
import { ReturnsPage } from './pages/ReturnsPage'; // Added
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
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);

  const handleLoginSuccess = useCallback((role: UserRole, idForApi: string, displayFullName: string, showChangelog?: boolean) => {
    setUserRole(role);
    setUserIdForApi(idForApi); 
    setUserDisplayFullName(displayFullName);
    if (role === 'admin' && showChangelog !== false) {
        setIsChangelogModalOpen(true);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setUserRole(null);
    setUserIdForApi(null);
    setUserDisplayFullName(null);
    setIsChangelogModalOpen(false);
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
    if (userRole === 'dentist' && userIdForApi && userDisplayFullName) {
      return <DentistDashboardPage dentistUsername={userIdForApi} dentistDisplayFullName={userDisplayFullName} onLogout={handleLogout} />;
    }
    return <Navigate to="/login" replace />; 
  };

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