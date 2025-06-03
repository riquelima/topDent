
import React, { useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
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
import { NavigationPath } from './types';
import { Button } from './components/ui/Button';
import { ToastProvider } from './contexts/ToastContext';

interface AppLayoutProps {
  onLogout: () => void;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ onLogout, children }) => {
  return (
    // Use a very dark gray, slightly lighter than pure black for the main app area if #121212 is for login
    // Using bg-gray-950 as a stand-in for a very dark gray, can be adjusted if needed.
    <div className="flex flex-col min-h-screen bg-gray-950 text-white selection:bg-blue-500 selection:text-white">
      <Header onLogout={onLogout} />
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // const navigateInstanceRef = React.useRef<ReturnType<typeof useNavigate> | null>(null); // Not currently used

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const ProtectedRoute: React.FC<{children: JSX.Element}> = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout onLogout={handleLogout}>
                  <Routes>
                    <Route index element={<DashboardPage />} />
                    <Route path={NavigationPath.NewPatient.substring(1)} element={<NewPatientPage />} />
                    <Route path={NavigationPath.EditPatient.substring(1)} element={<NewPatientPage />} />
                    <Route path={NavigationPath.PatientsList.substring(1)} element={<PatientListPage />} />
                    <Route path={NavigationPath.PatientDetail.substring(1)} element={<PatientDetailPage />} />
                    <Route path={NavigationPath.PatientAnamnesis.substring(1)} element={<PatientAnamnesisPage />} />
                    <Route path={NavigationPath.PatientTreatmentPlans.substring(1)} element={<PatientTreatmentPlansPage />} />
                    <Route path={NavigationPath.Anamnesis.substring(1)} element={<AnamnesisFormPage />} />
                    <Route path={NavigationPath.TreatmentPlan.substring(1)} element={<TreatmentPlanPage />} />
                    <Route path={NavigationPath.EditTreatmentPlan.substring(1)} element={<TreatmentPlanPage />} />
                    <Route path={NavigationPath.AllTreatmentPlans.substring(1)} element={<AllTreatmentPlansPage />} />
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