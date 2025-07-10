

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { ConsultationHistoryEntry, Patient, DentistUser, NavigationPath, Appointment } from '../types';
import { getConsultationHistory, getPatients } from '../services/supabaseService';
import { getKnownDentists } from '../src/utils/users';
import { useToast } from '../contexts/ToastContext';
import { isoToDdMmYyyy, formatToHHMM } from '../src/utils/formatDate';
import { MagnifyingGlassIcon, ChevronUpDownIcon, ArrowUturnLeftIcon } from '../components/icons/HeroIcons'; // Added ArrowUturnLeftIcon

const statusDisplayConfig: Record<Appointment['status'], { label: string; className: string }> = {
  Scheduled: { label: 'Agendado', className: 'bg-yellow-500 text-black' },
  Confirmed: { label: 'Confirmado', className: 'bg-[#00bcd4] text-black' },
  Completed: { label: 'Concluído', className: 'bg-green-500 text-white' },
  Cancelled: { label: 'Cancelado', className: 'bg-red-500 text-white' },
};

export const ConsultationHistoryPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate(); // Initialize useNavigate
  const [historyEntries, setHistoryEntries] = useState<ConsultationHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allPatientsList, setAllPatientsList] = useState<Patient[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [selectedPatientCpfFilter, setSelectedPatientCpfFilter] = useState<string>('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const patientDropdownRef = useRef<HTMLDivElement>(null);

  const [availableDentists, setAvailableDentists] = useState<DentistUser[]>([]);
  const [selectedDentistIdFilter, setSelectedDentistIdFilter] = useState<string>('');
  
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Effect to load data for filters (runs once)
  useEffect(() => {
    const loadFilterData = async () => {
        try {
            const [patientsRes, dentistsRes] = await Promise.all([
                getPatients(),
                getKnownDentists()
            ]);

            if (patientsRes.error) {
                console.warn("Erro ao carregar lista de pacientes para filtro.");
            } else {
                setAllPatientsList(patientsRes.data || []);
            }
            
            setAvailableDentists(dentistsRes);
        } catch (err) {
            showToast('Erro ao carregar dados para filtros', 'error');
        }
    };
    loadFilterData();
  }, [showToast]);

  // Effect to fetch history based on filters
  useEffect(() => {
      const fetchHistory = async () => {
          setIsLoading(true);
          setError(null);
          try {
              const filters = {
                  // If a patient is selected from the dropdown, use their CPF. Otherwise, use the search term.
                  patientSearchTerm: selectedPatientCpfFilter || patientSearchTerm.trim() || undefined,
                  dentistId: selectedDentistIdFilter || undefined,
                  startDate: startDateFilter || undefined,
                  endDate: endDateFilter || undefined,
              };

              const historyRes = await getConsultationHistory(filters);
              if (historyRes.error) {
                  throw new Error(historyRes.error.message || "Erro ao buscar histórico.");
              }
              setHistoryEntries(historyRes.data || []);
          } catch (err: any) {
              setError(err.message);
              showToast(err.message, 'error');
              setHistoryEntries([]);
          } finally {
              setIsLoading(false);
          }
      };

      fetchHistory();
  }, [selectedPatientCpfFilter, patientSearchTerm, selectedDentistIdFilter, startDateFilter, endDateFilter, showToast]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePatientSelectForFilter = (patient: Patient) => {
    setSelectedPatientCpfFilter(patient.cpf);
    setPatientSearchTerm(patient.fullName); 
    setIsPatientDropdownOpen(false);
  };

  const handleClearFilters = () => {
    setPatientSearchTerm('');
    setSelectedPatientCpfFilter('');
    setSelectedDentistIdFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const filteredDropdownPatients = allPatientsList.filter(p =>
    p.fullName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    p.cpf.includes(patientSearchTerm)
  );

  const dentistOptionsForFilter = [
    { value: '', label: 'Todos os Dentistas' },
    ...availableDentists.map(d => ({ value: d.id, label: d.full_name }))
  ];
  
  const formatCompletionTimestamp = (isoTimestamp: string | undefined) => {
    if (!isoTimestamp) return 'N/A';
    const date = new Date(isoTimestamp);
    return `${isoToDdMmYyyy(date.toISOString().split('T')[0])} ${formatToHHMM(date.toTimeString().split(' ')[0])}`;
  };


  if (isLoading && historyEntries.length === 0 && allPatientsList.length === 0) { 
    return <div className="text-center py-10 text-[#b0b0b0]">Carregando histórico de consultas...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Histórico de Consultas</h1>
      </div>

      <Card title="Filtrar Histórico" className="bg-[#1a1a1a] overflow-visible" titleClassName="text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-baseline"> 
          <div className="relative" ref={patientDropdownRef}>
            <label htmlFor="patientFilterInput" className="block text-sm font-medium text-[#b0b0b0] mb-1">Paciente</label>
            <div className="flex">
              <Input
                id="patientFilterInput"
                placeholder="Buscar por Nome ou CPF"
                value={patientSearchTerm}
                onChange={(e) => {
                  setPatientSearchTerm(e.target.value);
                  if (e.target.value.trim() !== '') {
                    setIsPatientDropdownOpen(true);
                    setSelectedPatientCpfFilter(''); // Clear CPF filter when typing
                  }
                  else {
                    setIsPatientDropdownOpen(false);
                    setSelectedPatientCpfFilter(''); 
                  }
                }}
                onFocus={() => { if (allPatientsList.length > 0) setIsPatientDropdownOpen(true); }}
                containerClassName="flex-grow mb-0"
                className="rounded-r-none h-[46px] bg-[#1f1f1f] border-gray-700 focus:border-[#00bcd4]"
                prefixIcon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
              />
              <Button type="button" onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                className="px-3 bg-[#1f1f1f] hover:bg-gray-700 border border-l-0 border-gray-700 rounded-l-none rounded-r-md h-[46px]"
                aria-expanded={isPatientDropdownOpen} title="Selecionar Paciente">
                <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
            {isPatientDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 w-full bg-[#1f1f1f] border border-gray-700 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                {filteredDropdownPatients.length > 0 ? (
                  <ul>{filteredDropdownPatients.map(p => (
                      <li key={p.cpf} onClick={() => handlePatientSelectForFilter(p)}
                        className="cursor-pointer px-4 py-3 text-sm text-white hover:bg-[#00bcd4] hover:text-black">
                        {p.fullName} <span className="text-xs text-gray-400">({p.cpf})</span>
                      </li>))}
                  </ul>
                ) : <p className="text-center py-3 text-sm text-[#b0b0b0]">Nenhum paciente encontrado.</p>}
              </div>
            )}
          </div>
          <Select
            label="Dentista"
            options={dentistOptionsForFilter}
            value={selectedDentistIdFilter}
            onChange={(e) => setSelectedDentistIdFilter(e.target.value)}
            containerClassName="mb-0"
          />
          <DatePicker
            label="Data Início (Consulta)"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            containerClassName="mb-0"
          />
          <DatePicker
            label="Data Fim (Consulta)"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            containerClassName="mb-0"
          />
        </div>
        <div className="mt-4 flex justify-end space-x-3">
            <Button variant="ghost" onClick={handleClearFilters}>Limpar Filtros</Button>
        </div>
      </Card>

      {error && <p className="text-red-500 text-center py-4">{error}</p>}
      
      {isLoading && historyEntries.length === 0 ? ( 
          <div className="text-center py-10 text-[#b0b0b0]">Carregando...</div>
      ) : historyEntries.length === 0 && !isLoading && !error ? (
        <Card className="bg-[#1a1a1a]">
          <p className="text-center text-[#b0b0b0] py-8">Nenhuma consulta encontrada com os filtros atuais.</p>
        </Card>
      ) : (
        <div className="bg-[#1a1a1a] shadow-lg rounded-lg overflow-x-auto border border-gray-700/50">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#1f1f1f]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Data Consulta</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Paciente</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Dentista</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Procedimento(s)</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Data Finalização/Cancelamento</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#b0b0b0] uppercase tracking-wider">Notas</th>
              </tr>
            </thead>
            <tbody className="bg-[#1a1a1a] divide-y divide-gray-700">
              {historyEntries.map(entry => {
                const currentStatusConfig = statusDisplayConfig[entry.status] || { label: entry.status, className: 'bg-gray-500 text-white' };
                return (
                  <tr key={entry.id} className="hover:bg-[#1f1f1f] transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{isoToDdMmYyyy(entry.consultation_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                      {entry.patient_cpf ? (
                        <Link to={NavigationPath.PatientDetail.replace(':patientId', entry.patient_cpf)} className="hover:text-[#00bcd4]">
                          {entry.patient_name}
                        </Link>
                      ) : (
                        <span>{entry.patient_name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-[#b0b0b0]">{entry.dentist_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-[#b0b0b0] max-w-xs truncate" title={entry.procedure_details}>{entry.procedure_details}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${currentStatusConfig.className}`}>
                          {currentStatusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-[#b0b0b0]">{formatCompletionTimestamp(entry.completion_timestamp)}</td>
                    <td className="px-4 py-3 text-sm text-[#b0b0b0] max-w-xs truncate" title={entry.notes || undefined}>{entry.notes || 'Nenhuma'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
       <div className="mt-8 pt-6 border-t border-gray-700 text-center">
        <Button 
          variant="secondary" 
          onClick={() => navigate(-1)} 
          leftIcon={<ArrowUturnLeftIcon />}
          disabled={isLoading}
        >
          Voltar
        </Button>
      </div>
    </div>
  );
};