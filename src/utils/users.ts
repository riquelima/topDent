
// src/utils/users.ts
import type { DentistUser } from '../../types';
import { getSupabaseClient } from '../../services/supabaseService';

/**
 * Fetches a list of dentists from the Supabase 'dentists' table.
 * This function is now asynchronous.
 * Returns an array of DentistUser, where 'id' is the dentist's UUID, which is crucial for correct appointment assignment.
 */
export const getKnownDentists = async (): Promise<DentistUser[]> => {
  const client = getSupabaseClient();
  if (!client) {
    console.warn("Supabase client not available for getKnownDentists.");
    return [
        { id: 'fallback_no_dentist1', full_name: 'Nenhum Dentista Cadastrado', username: 'fallback' },
    ];
  }

  // Explicitly select 'id' (UUID), 'full_name', and 'username'.
  const { data, error } = await client
    .from('dentists')
    .select('id, full_name, username') 
    .order('full_name', { ascending: true });

  if (error) {
    console.error("Error fetching dentists from Supabase for getKnownDentists:", error);
    return [
        { id: 'fallback_error_dentist', full_name: 'Erro ao Carregar Dentistas', username: 'error' },
    ];
  }

  if (data && data.length > 0) {
    // Map the fetched data to the DentistUser object.
    return (data as any[]).map(dentist => ({
      id: dentist.id, 
      full_name: dentist.full_name,
      username: dentist.username,
    }));
  }
  
  return [{ id: 'no_dentists_placeholder', full_name: 'Nenhum Dentista Cadastrado', username: 'none' }];
};