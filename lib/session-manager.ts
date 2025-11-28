import { createClient } from '@supabase/supabase-js';

interface Session {
  id: string;
  filename: string;
  upload_date: string;
  modified_date: string;
  transaction_count: number;
  statement_start_date: string | null;
  statement_end_date: string | null;
  transactions_data: any[];
}

// Session management functions
export async function createSession(
  userId: string,
  filename: string,
  transactions: any[],
  statementStartDate?: string,
  statementEndDate?: string
): Promise<Session | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      throw new Error('Missing Supabase configuration');
    }

    // Use service role key to bypass RLS for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Creating session for user:', userId, 'filename:', filename);

    const { data, error } = await supabase
      .from('sessions')
      .insert([
        {
          user_id: userId,
          filename,
          transaction_count: transactions.length,
          statement_start_date: statementStartDate || null,
          statement_end_date: statementEndDate || null,
          transactions_data: transactions,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating session:', error);
      return null;
    }

    console.log('Session created successfully:', data);
    return data as Session;
  } catch (error) {
    console.error('Error in createSession:', error);
    return null;
  }
}

export async function getUserSessions(userId: string): Promise<Session[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    console.log('[getUserSessions] Fetching sessions for user:', userId);
    console.log('[getUserSessions] Using service role:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Use service role key to bypass RLS (createClient automatically handles RLS bypass with service role)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('[getUserSessions] Error fetching sessions:', error);
      console.error('[getUserSessions] Error details:', JSON.stringify(error, null, 2));
      return [];
    }

    console.log('[getUserSessions] Found sessions:', data);
    console.log('[getUserSessions] Number of sessions:', data?.length || 0);
    return (data as Session[]) || [];
  } catch (error) {
    console.error('[getUserSessions] Error in getUserSessions:', error);
    return [];
  }
}

export async function renameSession(
  sessionId: string,
  newFilename: string,
  userId: string
): Promise<Session | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('sessions')
      .update({
        filename: newFilename,
        modified_date: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error renaming session:', error);
      return null;
    }

    return data as Session;
  } catch (error) {
    console.error('Error in renameSession:', error);
    return null;
  }
}

export async function deleteSession(
  sessionId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSession:', error);
    return false;
  }
}

export async function getSession(
  sessionId: string,
  userId: string
): Promise<Session | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    return data as Session;
  } catch (error) {
    console.error('Error in getSession:', error);
    return null;
  }
}

/**
 * Check if user has reached their session limit
 * Free: 0 sessions allowed (single upload only)
 * Premium: 12 sessions per year
 */
export function checkSessionLimit(
  userPlan: 'free' | 'premium',
  currentSessionCount: number
): boolean {
  if (userPlan === 'free') {
    return currentSessionCount >= 1; // Free users can only have 1 (current) session
  }

  if (userPlan === 'premium') {
    return currentSessionCount >= 12; // Premium users can have max 12 sessions
  }

  return true;
}

export function getSessionLimitMessage(userPlan: 'free' | 'premium'): string {
  if (userPlan === 'free') {
    return 'Free plan: Only 1 statement at a time. Upgrade to Premium to save session history (up to 12 per year).';
  }

  if (userPlan === 'premium') {
    return 'Premium plan: You can save up to 12 statements per year.';
  }

  return 'Unknown plan';
}
