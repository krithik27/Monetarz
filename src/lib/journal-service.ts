import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET RECENT JOURNAL ENTRY
 * Fetches the latest entry for a specific prompt (e.g., 'pulse_check_1' or 'monthly_note_2026_04')
 */
export async function getRecentJournalEntry(userId: string, promptId: string) {
  if (!userId || !promptId) return null;

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('response, created_at')
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching journal entry:', error?.message || error);
      return null;
    }

    return data;
  } catch (err: any) {
    console.error('Unexpected error in getRecentJournalEntry:', err?.message || err);
    return null;
  }
}

/**
 * SAVE JOURNAL ENTRY
 * Simple insert for a new journal response
 */
export async function saveJournalEntry(userId: string, promptId: string, response: string, category: string) {
  if (!userId) return { success: false, error: 'User ID required' };

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        prompt_id: promptId,
        response: response,
        category: category,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('Error saving journal entry:', err?.message || err);
    return { success: false, error: err };
  }
}

/**
 * UPSERT JOURNAL ENTRY
 * Used for auto-saving reflections where the most recent draft should be updated
 */
export async function upsertJournalEntry(userId: string, promptId: string, response: string, category: string) {
  if (!userId || !promptId) return { success: false, error: 'User ID and Prompt ID required' };

  try {
    // Check if an entry for this specific prompt already exists to update it, 
    // otherwise create a new one.
    const { data, error } = await supabase
      .from('journal_entries')
      .upsert({
        user_id: userId,
        prompt_id: promptId,
        response: response,
        category: category,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,prompt_id'
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('Error upserting journal entry:', err?.message || err);
    return { success: false, error: err };
  }
}
