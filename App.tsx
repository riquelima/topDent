
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
import { ChatPage } from './pages/ChatPage';
import { NavigationPath, ChatMessage } from './types';
import { Button } from './components/ui/Button';
import { ToastProvider } from './contexts/ToastContext';
import { ChangelogModal } from './components/ChangelogModal';
import { updateUserPreferences, getUnreadMessages, subscribeToMessages } from './services/supabaseService';
import { RealtimeChannel } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'dentist' | null;

interface AppLayoutProps {
  onLogout: () => void;
  userRole: UserRole;
  userName: string | null;
  children: React.ReactNode;
  unreadChatCount?: number;
}

const AppLayout: React.FC<AppLayoutProps> = ({ onLogout, userRole, userName, children, unreadChatCount }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#0e0e0e] text-white selection:bg-[#00bcd4] selection:text-black">
      <Header onLogout={onLogout} userRole={userRole} userName={userName} unreadChatCount={unreadChatCount} />
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

const SESSION_STORAGE_KEY = 'topDentUserSession_v1';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userDisplayFullName, setUserDisplayFullName] = useState<string | null>(null); 
  const [userIdForApi, setUserIdForApi] = useState<string | null>(null); 
  const [userUsername, setUserUsername] = useState<string | null>(null);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // State for unread chat messages
  const [unreadMessages, setUnreadMessages] = useState<ChatMessage[]>([]);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const isAudioUnlocked = useRef(false);

  useEffect(() => {
    // This effect runs only once on initial app load to restore the session.
    try {
      const persistedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (persistedSession) {
        const sessionData = JSON.parse(persistedSession);
        // Basic validation of the stored session data
        if (sessionData && sessionData.userRole && sessionData.userIdForApi && sessionData.userDisplayFullName) {
          setUserRole(sessionData.userRole);
          setUserIdForApi(sessionData.userIdForApi);
          setUserUsername(sessionData.userUsername);
          setUserDisplayFullName(sessionData.userDisplayFullName);
        } else {
          // Clear invalid session data
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Could not load user session from localStorage", error);
      // Ensure corrupted data is cleared
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      // Finished attempting to load session, allow rendering
      setIsInitializing(false);
    }
  }, []);
  
  // Effect for chat notifications, now for all roles
  useEffect(() => {
    notificationSoundRef.current = new Audio('https://www.soundjay.com/buttons/sounds/button-1.mp3');
    notificationSoundRef.current.load();

    const unlockAudio = () => {
      if (notificationSoundRef.current && !isAudioUnlocked.current) {
        notificationSoundRef.current.muted = true;
        notificationSoundRef.current.play().then(() => {
          notificationSoundRef.current?.pause();
          if (notificationSoundRef.current) {
            notificationSoundRef.current.currentTime = 0;
            notificationSoundRef.current.muted = false;
          }
          isAudioUnlocked.current = true;
        }).catch(() => {});
      }
    };
    window.addEventListener('click', unlockAudio, { once: true });

    let chatSub: RealtimeChannel | null = null;
    
    if (userIdForApi) {
      const handleNewMessage = (newMessagePayload: ChatMessage) => {
        setUnreadMessages(prev => {
            if (prev.some(msg => msg.id === newMessagePayload.id)) {
                return prev;
            }
            if (notificationSoundRef.current && isAudioUnlocked.current) {
                notificationSoundRef.current.play().catch(e => console.error("Error playing sound", e));
            }
            return [...prev, newMessagePayload];
        });
      };

      chatSub = subscribeToMessages(userIdForApi, handleNewMessage);
      
      if (chatSub) {
        chatSub.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                // Now that we are subscribed, fetch the initial unread messages to fill the gap.
                getUnreadMessages(userIdForApi).then(({ data: initialData }) => {
                    if (initialData && initialData.length > 0) {
                        setUnreadMessages(currentMessages => {
                            const messageMap = new Map<string, ChatMessage>();
                            // Add messages already in state from real-time events
                            currentMessages.forEach(msg => messageMap.set(msg.id, msg));
                            // Add initial unread messages, overwriting duplicates (which is fine and handles race conditions)
                            initialData.forEach(msg => messageMap.set(msg.id, msg));
                            // Return the unique messages as an array
                            return Array.from(messageMap.values());
                        });
                    }
                });
            }
        });
      }
    }

    return () => {
      window.removeEventListener('click', unlockAudio);
      if (chatSub) {
        chatSub.unsubscribe();
      }
    };
  }, [userIdForApi]);

  const handleLoginSuccess = useCallback((role: UserRole, idForApi: string, username: string, displayFullName: string, showChangelog?: boolean) => {
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
    setUnreadMessages([]); // Explicitly clear unread messages on logout
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
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
    if (isInitializing) {
      // While checking for session, show a loading indicator to prevent flicker.
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#0e0e0e] text-white">
            Carregando sessão...
        </div>
      );
    }

    if (!userRole) {
      // If not logged in after checking, redirect to login.
      return <Navigate to="/login" replace />;
    }
    if (adminOnly && userRole !== 'admin') {
      // If route is admin-only and user is not admin, redirect to home.
      return <Navigate to="/" replace />; 
    }
    return children;
  };
  
  const renderDashboard = () => {
    if (userRole === 'admin') {
      return <DashboardPage />;
    }
    if (userRole === 'dentist' && userIdForApi && userUsername && userDisplayFullName) {
      return (
        <DentistDashboardPage
            dentistId={userIdForApi}
            dentistUsername={userUsername}
            dentistDisplayFullName={userDisplayFullName}
            onLogout={handleLogout}
            unreadMessages={unreadMessages}
            setUnreadMessages={setUnreadMessages}
        />
      );
    }
    // If userRole is somehow set but other data is missing, redirect to login as a failsafe.
    return <Navigate to="/login" replace />; 
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0e0e0e] text-white">
        Inicializando...
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
            element={userRole && !isInitializing ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout onLogout={handleLogout} userRole={userRole} userName={userDisplayFullName} unreadChatCount={unreadMessages.length}>
                  <Routes>
                    <Route index element={renderDashboard()} />
                    
                    <Route path={NavigationPath.NewPatient.substring(1)} element={<ProtectedRoute adminOnly>{<NewPatientPage />}</ProtectedRoute>} />
                    <Route path={NavigationPath.EditPatient.substring(1)} element={<ProtectedRoute adminOnly>{<NewPatientPage />}</ProtectedRoute>} />
                    <Route path={NavigationPath.PatientsList.substring(1)} element={<ProtectedRoute adminOnly>{<PatientListPage />}</ProtectedRoute>} />
                    <Route path={NavigationPath.Anamnesis.substring(1)} element={<ProtectedRoute adminOnly>{<AnamnesisFormPage />}</ProtectedRoute>} />
                    <Route path={NavigationPath.AllTreatmentPlans.substring(1)} element={<ProtectedRoute adminOnly>{<AllTreatmentPlansPage />}</ProtectedRoute>} />
                    <Route path={NavigationPath.Chat.substring(1)} element={<ProtectedRoute adminOnly><ChatPage adminId={userIdForApi!} unreadMessages={unreadMessages} setUnreadMessages={setUnreadMessages} /></ProtectedRoute>} />
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
              </ProtectedRoute>
            }
          />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;
