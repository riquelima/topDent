
import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopDentLogo, UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '../components/icons/HeroIcons';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';
import { NavigationPath } from '../types';
import { AuthLayout } from '../components/layout/AuthLayout';
import type { UserRole } from '../App'; // Import UserRole

interface LoginPageProps {
  onLoginSuccess: (role: UserRole, userName: string | null) => void;
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
            className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-gray-800"
            disabled={isLoading}
          />
          <span className="ml-2">Lembrar-me</span>
        </label>
        <a href="#" className="font-medium text-blue-500 hover:text-blue-400 transition-colors duration-200">
          Esqueci minha senha
        </a>
      </div>
      <Button
        type="submit"
        fullWidth
        className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white py-3 text-base"
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

  const handleLoginAttempt = (usernameInput: string, pass: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    const username = usernameInput.toLowerCase(); // Case-insensitive username check

    // Simulate API call
    setTimeout(() => {
      if (username === 'admin' && pass === '1234') {
        showToast('Login de Admin realizado com sucesso!', 'success', 3000);
        onLoginSuccess('admin', 'Admin');
        navigate(NavigationPath.Home);
      } else if (username === 'junior' && pass === '1234') {
        showToast('Login de Dentista realizado com sucesso!', 'success', 3000);
        onLoginSuccess('dentist', 'Dr. Junior');
        navigate(NavigationPath.Home);
      } else if (username === 'henrique' && pass === '1234') {
        showToast('Login de Dentista realizado com sucesso!', 'success', 3000);
        onLoginSuccess('dentist', 'Dr. Henrique');
        navigate(NavigationPath.Home);
      } else {
        setErrorMessage('Usuário ou senha inválidos.');
        showToast('Usuário ou senha inválidos.', 'error', 4000);
      }
      setIsLoading(false);
    }, 500);
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