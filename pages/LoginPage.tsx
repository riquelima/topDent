import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopDentLogo, UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '../components/icons/HeroIcons';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';
import { NavigationPath } from '../types';
import { AuthLayout } from '../components/layout/AuthLayout';
import type { UserRole } from '../App'; 
import { getDentistByUsername, addDentist } from '../services/supabaseService'; // Import addDentist

interface LoginPageProps {
  onLoginSuccess: (role: UserRole, idForApi: string, username: string, displayFullName: string, showChangelog?: boolean) => void;
}

const LoginForm: React.FC<{
  onLogin: (username: string, pass: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
}> = ({ onLogin, isLoading, errorMessage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      <Input
        id="username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Usuário"
        required
        disabled={isLoading}
        autoFocus
        autoComplete="username"
        prefixIcon={<UserIcon className="w-5 h-5 text-gray-400" />}
        containerClassName="mb-6"
      />
      <Input
        id="password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        required
        disabled={isLoading}
        autoComplete="current-password"
        prefixIcon={<LockClosedIcon className="w-5 h-5 text-gray-400" />}
        suffixIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-200 focus:outline-none"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        }
        containerClassName="mb-6"
      />
      <div className="flex items-center justify-between text-sm mb-6">
        <label htmlFor="rememberMe" className="flex items-center cursor-pointer text-gray-300 hover:text-white">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 text-teal-600 bg-gray-700 border-gray-600 rounded focus:ring-teal-500 focus:ring-offset-gray-800"
            disabled={isLoading}
          />
          <span className="ml-2">Lembrar-me</span>
        </label>
        <a href="#" className="font-medium text-teal-500 hover:text-teal-400 transition-colors duration-200">
          Esqueci minha senha
        </a>
      </div>
      <Button
        type="submit"
        fullWidth
        variant="primary" 
        className="py-3 text-base"
        disabled={isLoading}
      >
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>
      {errorMessage && (
        <p className="text-sm text-red-500 text-center pt-2">{errorMessage}</p>
      )}
    </form>
  );
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLoginAttempt = async (usernameInput: string, pass: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    const username = usernameInput.toLowerCase(); 

    if (username === 'admin' && pass === '1234') {
        let { data: adminData, error: adminError } = await getDentistByUsername('admin');

        // Handle case where admin user does not exist in DB - self-heal by creating it.
        if (!adminData && !adminError) {
            showToast('Configurando usuário admin...', 'warning', 2500);
            const { data: newAdminData, error: creationError } = await addDentist({
                full_name: 'Admin',
                username: 'admin',
                password: `autogen_${Date.now()}` // This password is a placeholder, admin login is hardcoded.
            });

            if (creationError || !newAdminData) {
                console.error("Critical: Could not create admin user in DB:", creationError);
                setErrorMessage("Falha crítica ao configurar o usuário admin. Contate o suporte.");
                showToast("Erro de configuração do sistema.", 'error');
                setIsLoading(false);
                return;
            }
            adminData = newAdminData; // Use the newly created admin data to proceed.
        } else if (adminError) {
            console.error("Critical: Admin user not found in database or DB error:", adminError);
            setErrorMessage('Erro de configuração: usuário Admin não encontrado na base de dados.');
            showToast('Erro de configuração do sistema.', 'error');
            setIsLoading(false);
            return;
        }
        
        if (!adminData || !adminData.id) {
            // This is a safeguard, should not be hit with the logic above.
            console.error("Critical: Admin user data is invalid after fetch/create.");
            setErrorMessage('Erro de configuração: dados do usuário Admin inválidos.');
            showToast('Erro de configuração do sistema.', 'error');
            setIsLoading(false);
            return;
        }

        showToast('Login de Admin realizado com sucesso!', 'success', 3000);
        onLoginSuccess('admin', adminData.id, adminData.username, adminData.full_name, adminData.show_changelog);
        navigate(NavigationPath.Home);
        setIsLoading(false);
        return;
    }
    
    // Authenticate against Supabase 'dentists' table
    const { data: dentist, error: dbError } = await getDentistByUsername(username);

    if (dbError) {
      console.error("Login error (fetching dentist):", dbError);
      setErrorMessage('Erro ao tentar fazer login. Tente novamente.');
      showToast('Erro ao tentar fazer login.', 'error', 4000);
    } else if (dentist && dentist.password === pass && dentist.id) { // SECURITY: Plain text password check
      showToast(`Login de ${dentist.full_name} realizado com sucesso!`, 'success', 3000);
      onLoginSuccess('dentist', dentist.id, dentist.username, dentist.full_name, dentist.show_changelog);
      navigate(NavigationPath.Home);
    } else {
      setErrorMessage('Usuário ou senha inválidos.');
      showToast('Usuário ou senha inválidos.', 'error', 4000);
    }
    setIsLoading(false);
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <TopDentLogo className="h-14 sm:h-16 w-auto mx-auto mb-6" />
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Bem-vindo de volta
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Acesse sua conta para gerenciar a clínica.
          </p>
        </div>
        
        <div className="bg-[#1e1e1e] p-8 rounded-xl shadow-2xl">
          <LoginForm
            onLogin={handleLoginAttempt}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </div>
        
        <p className="mt-10 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Top Dent | Todos os direitos reservados.
        </p>
      </div>
    </AuthLayout>
  );
};
