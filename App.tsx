import React from 'react';
import { HashRouter, Routes, Route, Outlet, Link } from 'react-router-dom'; // Added Link
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
import { AllTreatmentPlansPage } from './pages/AllTreatmentPlansPage'; // Import the new page
import { NavigationPath } from './types';
import { Button } from './components/ui/Button';
import { ToastProvider } from './contexts/ToastContext'; // Import ToastProvider

const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Header />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8"> {/* pt-20 (header height) + padding */}
        <div className="max-w-7xl mx-auto">
           <Outlet /> {/* Child routes will render here */}
        </div>
      </main>
      <Footer />
    </div>
  );
};

// Placeholder for pages not fully implemented but linked
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
  return (
    <ToastProvider> {/* Wrap with ToastProvider */}
      <HashRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path={NavigationPath.NewPatient} element={<NewPatientPage />} />
            <Route path={NavigationPath.EditPatient} element={<NewPatientPage />} /> {/* Added route for editing patient */}
            <Route path={NavigationPath.PatientsList} element={<PatientListPage />} /> 
            <Route path={NavigationPath.PatientDetail} element={<PatientDetailPage />} /> 
            <Route path={NavigationPath.PatientAnamnesis} element={<PatientAnamnesisPage />} />
            <Route path={NavigationPath.PatientTreatmentPlans} element={<PatientTreatmentPlansPage />} />
            <Route 
              path={NavigationPath.Anamnesis} 
              element={<AnamnesisFormPage />}
            />
            <Route path={NavigationPath.TreatmentPlan} element={<TreatmentPlanPage />} />
            <Route path={NavigationPath.EditTreatmentPlan} element={<TreatmentPlanPage />} />
            <Route path={NavigationPath.AllTreatmentPlans} element={<AllTreatmentPlansPage />} /> {/* Add new route */}
            <Route 
              path={NavigationPath.Appointments} 
              element={<AppointmentsPage />}
            />
            <Route 
              path={NavigationPath.ViewRecord} 
              element={<PlaceholderPage title="Visualizar Prontuário" />} 
            />
            {/* Catch-all for undefined routes under AppLayout */}
            <Route path="*" element={<PlaceholderPage title="Página não encontrada" />} />
          </Route>
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;
