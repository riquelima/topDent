
import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopDentLogo, UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '../components/icons/HeroIcons';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';
import { NavigationPath } from '../types';
import { AuthLayout } from '../components/layout/AuthLayout';
import type { UserRole } from '../App'; 
import { getDentistByUsername, addDentist } from '../services/supabaseService';
import { Card } from '../components/ui/Card';

interface LoginPageProps {
  onLoginSuccess: (role: UserRole, idForApi: string, username: string, displayFullName: string) => void;
}

const LoginForm: React.FC<{
  onLogin: (username: string, pass: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
}> = ({ onLogin, isLoading, errorMessage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-white focus:outline-none" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
            {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        }
        containerClassName="mb-6"
      />
      <div className="flex items-center justify-end text-sm mb-6">
        <a href="#" className="font-medium text-[var(--accent-cyan)] hover:underline transition-colors duration-200">
          Esqueci minha senha
        </a>
      </div>
      <Button type="submit" fullWidth variant="primary" size="lg" disabled={isLoading}>
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

        if (!adminData && !adminError) {
            const { data: newAdminData, error: creationError } = await addDentist({ full_name: 'Admin', username: 'admin', password: `autogen_${Date.now()}` });
            if (creationError || !newAdminData) {
                setErrorMessage("Falha crítica ao configurar o usuário admin.");
                setIsLoading(false);
                return;
            }
            adminData = newAdminData;
        } else if (adminError) {
            setErrorMessage('Erro: usuário Admin não encontrado na base de dados.');
            setIsLoading(false);
            return;
        }
        
        if (!adminData || !adminData.id) {
            setErrorMessage('Erro: dados do usuário Admin inválidos.');
            setIsLoading(false);
            return;
        }

        showToast('Login de Admin realizado com sucesso!', 'success');
        onLoginSuccess('admin', adminData.id, adminData.username, adminData.full_name);
        navigate(NavigationPath.Home);
        setIsLoading(false);
        return;
    }
    
    const { data: dentist, error: dbError } = await getDentistByUsername(username);

    if (dbError) {
      setErrorMessage('Erro ao tentar fazer login. Tente novamente.');
    } else if (dentist && dentist.password === pass && dentist.id) {
      showToast(`Login de ${dentist.full_name} realizado com sucesso!`, 'success');
      onLoginSuccess('dentist', dentist.id, dentist.username, dentist.full_name);
      navigate(NavigationPath.Home);
    } else {
      setErrorMessage('Usuário ou senha inválidos.');
    }
    setIsLoading(false);
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-8 animate-fadeInUp opacity-0">
        <div className="text-center">
          <TopDentLogo className="h-16 w-auto mx-auto mb-6 animate-logo-pulse" />
          <h1 className="text-4xl font-bold text-white">
            Bem-vindo de volta
          </h1>
          <p className="mt-2 text-lg text-[var(--text-secondary)]">
            Acesse sua conta para gerenciar a clínica.
          </p>
        </div>
        
        <Card bodyClassName="p-8 sm:p-10">
          <LoginForm
            onLogin={handleLoginAttempt}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        </Card>
        
        <p className="mt-10 text-center text-sm text-[var(--text-secondary)]">
          © {new Date().getFullYear()} Top Dent | Todos os direitos reservados.
        </p>
      </div>
    </AuthLayout>
  );
};