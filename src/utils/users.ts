// src/utils/users.ts
import type { DentistUser } from '../../types';
import { getSupabaseClient } from '../../services/supabaseService';

/**
 * Fetches a list of dentists from the Supabase 'dentists' table.
 * This function is now asynchronous.
 * Returns an array of DentistUser, where 'id' is the dentist's username.
 */
export const getKnownDentists = async (): Promise<DentistUser[]> => {
  const client = getSupabaseClient();
  if (!client) {
    console.warn("Supabase client not available for getKnownDentists.");
    return [
        { id: 'fallback_no_dentist1', full_name: 'Nenhum Dentista Cadastrado' },
    ];
  }

  const { data, error } = await client
    .from('dentists')
    .select('username, full_name') // Fetch username to use as ID
    .order('full_name', { ascending: true });

  if (error) {
    console.error("Error fetching dentists from Supabase for getKnownDentists:", error);
    return [
        { id: 'fallback_error_dentist', full_name: 'Erro ao Carregar Dentistas' },
    ];
  }

  if (data && data.length > 0) {
    return data.map(dentist => ({
      id: dentist.username, // Use username as the ID, as per type definition
      full_name: dentist.full_name,
    }));
  }
  
  return [{ id: 'no_dentists_placeholder', full_name: 'Nenhum Dentista Cadastrado' }];
};
