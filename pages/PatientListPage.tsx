import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserPlusIcon, ClipboardDocumentListIcon, PencilIcon, TrashIcon, Squares2X2Icon, ListBulletIcon, MagnifyingGlassIcon } from '../components/icons/HeroIcons';
import { Patient, NavigationPath } from '../types';
import { isoToDdMmYyyy } from '../src/utils/formatDate';
import { getPatients, searchPatients, deletePatientByCpf } from '../services/supabaseService'; 
import { useToast } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';

const PAGE_SIZE = 50;

type ViewMode = 'list' | 'card';

interface PatientToDelete {
  cpf: string;
  name: string;
}

export const PatientListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast(); 
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const cacheRef = useRef<Patient[] | null>(null);
  const serverFallbackRef = useRef<Patient[] | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<PatientToDelete | null>(null);

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return allPatients;
    const lower = searchTerm.toLowerCase();
    const local = allPatients.filter(p =>
      p.fullName.toLowerCase().includes(lower) || p.cpf.includes(searchTerm)
    );
    if (local.length > 0) return local;
    return serverFallbackRef.current || local;
  }, [allPatients, searchTerm]);

  const visiblePatients = useMemo(() => {
    return filteredPatients.slice(0, visibleCount);
  }, [filteredPatients, visibleCount]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm]);

  useEffect(() => {
    if (cacheRef.current) {
      setAllPatients(cacheRef.current);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const controller = new AbortController();
    (async () => {
      try {
        const { data, error: fetchError } = await getPatients();
        if (fetchError) throw fetchError;
        const sorted = (data || []).sort((a, b) => a.fullName.localeCompare(b.fullName));
        cacheRef.current = sorted;
        setAllPatients(sorted);
      } catch (e: any) {
        if (!controller.signal.aborted) {
          setError("Falha ao carregar pacientes.");
          showToast("Falha ao carregar pacientes.", "error");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [showToast]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = searchTerm.trim();
    if (!term || term.length < 3) {
      serverFallbackRef.current = null;
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await searchPatients(term);
        if (data && data.length > 0) {
          serverFallbackRef.current = data;
          setAllPatients(prev => {
            const existingCpf = new Set(prev.map(p => p.cpf));
            const merged = [...prev];
            data.forEach(p => { if (!existingCpf.has(p.cpf)) merged.push(p); });
            cacheRef.current = merged.sort((a, b) => a.fullName.localeCompare(b.fullName));
            return cacheRef.current;
          });
        }
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchTerm]);

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredPatients.length));
  };

  const requestDeletePatient = (cpf: string, name: string) => {
    setPatientToDelete({ cpf, name });
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setPatientToDelete(null);
  };

  const executeDeletePatient = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true); 
    try {
      const { error: deleteError } = await deletePatientByCpf(patientToDelete.cpf);
      if (deleteError) {
        let displayMessage = `Erro ao excluir: ${deleteError.message}`;
        if (deleteError.message?.includes("foreign key constraint")) {
          displayMessage = "Erro: Paciente possui dados vinculados (agendamentos, etc.) e não pode ser excluído.";
        }
        showToast(displayMessage, "error");
      } else {
        showToast(`Paciente ${patientToDelete.name} excluído com sucesso.`, 'success');
        cacheRef.current = null;
        window.location.reload();
      }
    } catch (catchedError: any) {
      showToast(`Erro inesperado ao tentar excluir: ${catchedError.message}`, "error");
    } finally {
      setIsDeleting(false);
      closeConfirmModal();
    }
  };

  const renderPatientActions = (patient: Patient, isCardContext: boolean = false) => (
    <div className={`flex items-center ${isCardContext ? 'justify-end' : 'justify-center'} ${isCardContext ? 'space-x-1' : 'space-x-2'}`}>
        <Button
            as={Link}
            to={NavigationPath.PatientDetail.replace(':patientId', patient.cpf)}
            size="sm"
            variant="ghost"
            leftIcon={<ClipboardDocumentListIcon className="w-4 h-4" />}
            className={isDeleting ? 'opacity-50 pointer-events-none' : ''}
            aria-disabled={isDeleting}
            onClick={isDeleting ? (e) => e.preventDefault() : undefined}
          >
            Detalhes
          </Button>
        <Button 
            as={Link} 
            to={NavigationPath.EditPatient.replace(':patientId', patient.cpf)} 
            size="sm" 
            variant="ghost" 
            className={`p-2 rounded-full ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`} 
            title="Editar Paciente"
            aria-disabled={isDeleting}
            onClick={isDeleting ? (e) => e.preventDefault() : undefined}
        >
          <PencilIcon className={`w-5 h-5 ${isDeleting ? 'text-gray-500' : 'text-[var(--accent-cyan)]'}`} />
        </Button>
      <Button size="sm" variant="ghost" onClick={() => requestDeletePatient(patient.cpf, patient.fullName)} className="p-2 rounded-full" title="Excluir Paciente" disabled={isDeleting}><TrashIcon className="w-5 h-5 text-[var(--accent-red)]" /></Button>
    </div>
  );
  
  const renderList = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[var(--border-color)]">
        <thead className="bg-transparent">
          <tr>
            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Nome Completo</th>
            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">CPF</th>
            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Nascimento</th>
            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Telefone</th>
            <th scope="col" className="px-6 py-3 text-center text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]">
          {visiblePatients.map(patient => (
            <tr key={patient.cpf} className="hover:bg-[var(--background-light)] transition-colors duration-200">
              <td className="px-6 py-5 whitespace-nowrap"><Link to={NavigationPath.PatientDetail.replace(':patientId', patient.cpf)} className="text-base font-medium text-white hover:text-[var(--accent-cyan)]">{patient.fullName}</Link></td>
              <td className="px-6 py-5 whitespace-nowrap text-base text-gray-300">{patient.cpf}</td>
              <td className="px-6 py-5 whitespace-nowrap text-base text-gray-300">{isoToDdMmYyyy(patient.dob)}</td>
              <td className="px-6 py-5 whitespace-nowrap text-base text-gray-300">{patient.phone || 'N/A'}</td>
              <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">{renderPatientActions(patient)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {visiblePatients.map(patient => (
        <Card key={patient.cpf} className="flex flex-col justify-between" hoverEffect>
          <div>
            <div className="flex justify-between items-start">
              <Link to={NavigationPath.PatientDetail.replace(':patientId', patient.cpf)} className="text-xl font-semibold text-[var(--accent-cyan)] truncate pr-2 hover:underline" title={patient.fullName}>{patient.fullName}</Link>
              {renderPatientActions(patient, true)}
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-2">CPF: {patient.cpf}</p>
            <p className="text-sm text-[var(--text-secondary)]">Nascimento: {isoToDdMmYyyy(patient.dob)}</p>
            {patient.guardian && <p className="text-sm text-gray-500 italic mt-1">Responsável: {patient.guardian}</p>}
          </div>
        </Card>
      ))}
    </div>
  );

  if (error) return <div className="text-center py-10"><p className="text-red-500">{error}</p></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Lista de Pacientes</h1>
        <Button onClick={() => navigate(NavigationPath.NewPatient)} leftIcon={<UserPlusIcon className="w-5 h-5" />} disabled={isDeleting} variant="primary">Adicionar Paciente</Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Input placeholder="Buscar por nome ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} containerClassName="flex-grow w-full sm:w-auto" disabled={isDeleting} prefixIcon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />} />
          <div className="flex items-center space-x-2 p-1 bg-[var(--background-light)] rounded-2xl">
            <Button size="sm" variant={viewMode === 'list' ? 'primary' : 'ghost'} onClick={() => setViewMode('list')} disabled={isDeleting} title="Visualizar em Lista" className='border-none shadow-none'><ListBulletIcon className="w-5 h-5" /></Button>
            <Button size="sm" variant={viewMode === 'card' ? 'primary' : 'ghost'} onClick={() => setViewMode('card')} disabled={isDeleting} title="Visualizar em Cards" className='border-none shadow-none'><Squares2X2Icon className="w-5 h-5" /></Button>
          </div>
        </div>
      </Card>

      {isLoading && <div className="text-center py-10 text-[var(--text-secondary)]"><span className="animate-pulse">Carregando pacientes...</span></div>}

      {!isLoading && filteredPatients.length === 0 && (
        <Card><p className="text-center text-[var(--text-secondary)] py-8">{allPatients.length === 0 ? "Nenhum paciente cadastrado." : "Nenhum paciente encontrado."}</p></Card>
      )}

      {filteredPatients.length > 0 && (
        <>
          <Card bodyClassName={viewMode === 'list' ? 'p-0' : 'p-6'}>
              {viewMode === 'list' ? renderList() : renderCards()}
          </Card>
          {visibleCount < filteredPatients.length && (
            <div className="flex flex-col items-center space-y-2">
              <p className="text-sm text-[var(--text-secondary)]">
                Exibindo {visibleCount} de {filteredPatients.length} pacientes
              </p>
              <Button onClick={loadMore} variant="ghost" disabled={isDeleting}>
                Carregar mais {Math.min(PAGE_SIZE, filteredPatients.length - visibleCount)}
              </Button>
            </div>
          )}
        </>
      )}

      {patientToDelete && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={closeConfirmModal}
          onConfirm={executeDeletePatient}
          title="Confirmar Exclusão"
          message={<>Tem certeza que deseja excluir <strong className="text-[var(--accent-cyan)]">{patientToDelete.name}</strong>? Esta ação é irreversível e pode ser impedida se houver dados vinculados.</>}
          confirmButtonText="Excluir Paciente"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};