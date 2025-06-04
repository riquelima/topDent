
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
import { DentistDashboardPage } from './pages/DentistDashboardPage'; // Import Dentist Dashboard
import { NavigationPath } from './types';
import { Button } from './components/ui/Button';
import { ToastProvider } from './contexts/ToastContext';

export type UserRole = 'admin' | 'dentist' | null;

interface AppLayoutProps {
  onLogout: () => void;
  userRole: UserRole;
  userName: string | null;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ onLogout, userRole, userName, children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white selection:bg-blue-500 selection:text-white">
      <Header onLogout={onLogout} userRole={userRole} userName={userName} />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
           {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="text-center py-10">
    <h1 className="text-3xl font-bold text-teal-400">{title}</h1>
    <p className="text-gray-300 mt-4">Esta página está em construção.</p>
    <Link to={NavigationPath.Home} className="mt-6 inline-block">
        <Button variant="primary">Voltar ao Início</Button>
    </Link>
  </div>
);

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const handleLoginSuccess = useCallback((role: UserRole, name: string | null) => {
    setUserRole(role);
    setUserName(name);
  }, []);

  const handleLogout = useCallback(() => {
    setUserRole(null);
    setUserName(null);
  }, []);

  const ProtectedRoute: React.FC<{children: JSX.Element}> = ({ children }) => {
    if (!userRole) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  const renderDashboard = () => {
    if (userRole === 'admin') {
      return <DashboardPage />;
    }
    if (userRole === 'dentist') {
      return <DentistDashboardPage userName={userName || 'Dentista'} />;
    }
    return <Navigate to="/login" replace />; // Fallback, should not happen if ProtectedRoute works
  };

  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route
            path="/login"
            element={userRole ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout onLogout={handleLogout} userRole={userRole} userName={userName}>
                  <Routes>
                    <Route index element={renderDashboard()} />
                    {/* Admin-specific routes can be further protected if needed */}
                    {userRole === 'admin' && (
                      <>
                        <Route path={NavigationPath.NewPatient.substring(1)} element={<NewPatientPage />} />
                        <Route path={NavigationPath.EditPatient.substring(1)} element={<NewPatientPage />} />
                        <Route path={NavigationPath.PatientsList.substring(1)} element={<PatientListPage />} />
                        <Route path={NavigationPath.Anamnesis.substring(1)} element={<AnamnesisFormPage />} />
                        <Route path={NavigationPath.TreatmentPlan.substring(1)} element={<TreatmentPlanPage />} />
                        <Route path={NavigationPath.EditTreatmentPlan.substring(1)} element={<TreatmentPlanPage />} />
                        <Route path={NavigationPath.AllTreatmentPlans.substring(1)} element={<AllTreatmentPlansPage />} />
                      </>
                    )}
                    {/* Routes accessible by both admin and potentially dentist (if dashboard links to them) */}
                    <Route path={NavigationPath.PatientDetail.substring(1)} element={<PatientDetailPage />} />
                    <Route path={NavigationPath.PatientAnamnesis.substring(1)} element={<PatientAnamnesisPage />} />
                    <Route path={NavigationPath.PatientTreatmentPlans.substring(1)} element={<PatientTreatmentPlansPage />} />
                    <Route path={NavigationPath.Appointments.substring(1)} element={<AppointmentsPage />} />
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
