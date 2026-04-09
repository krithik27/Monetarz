import { SupabaseClient } from '@supabase/supabase-js';

export async function getUserProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('is_pro')
    .eq('user_id', userId)
    .single();

  if (error) {
    return { is_pro: false };
  }
  return data;
}
