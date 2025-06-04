// src/utils/users.ts
import type { DentistUser } from '../../types';

/**
 * Retorna uma lista de dentistas conhecidos no sistema.
 * Esta função é um placeholder e deve ser substituída por uma busca
 * em uma tabela de usuários/dentistas no futuro.
 */
export const getKnownDentists = (): DentistUser[] => {
  return [
    { id: 'junior', name: 'Dr. Junior' },
    { id: 'henrique', name: 'Dr. Henrique' },
    // Adicione outros dentistas aqui conforme são cadastrados no sistema de login
    // Exemplo: { id: 'outroUsuarioDentista', name: 'Dr(a). Outro Nome' },
  ];
};