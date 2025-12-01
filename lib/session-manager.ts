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
    console.log('[createSession] Starting session creation...');
    console.log('[createSession] userId:', userId);
    console.log('[createSession] filename:', filename);
    console.log('[createSession] transactions count:', transactions.length);
    console.log('[createSession] statementStartDate:', statementStartDate);
    console.log('[createSession] statementEndDate:', statementEndDate);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('[createSession] supabaseUrl:', supabaseUrl);
    console.log('[createSession] Using service role key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[createSession] Missing Supabase configuration');
      throw new Error('Missing Supabase configuration');
    }

    // Use service role key to bypass RLS for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    });

    console.log('[createSession] Supabase client created, attempting insert...');

    const dataToInsert = {
      user_id: userId,
      filename,
      transaction_count: transactions.length,
      statement_start_date: statementStartDate || null,
      statement_end_date: statementEndDate || null,
      transactions_data: transactions,
    };

    console.log('[createSession] Data to insert:', {
      ...dataToInsert,
      transactions_data: `[${transactions.length} transactions]`, // Don't log all transactions
    });

    const { data, error } = await supabase
      .from('sessions')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      console.error('[createSession] Supabase error creating session:', error);
      console.error('[createSession] Error details:', JSON.stringify(error, null, 2));
      return null;
    }

    console.log('[createSession] Session created successfully!');
    console.log('[createSession] Returned data:', data);
    return data as Session;
  } catch (error) {
    console.error('[createSession] Exception in createSession:', error);
    if (error instanceof Error) {
      console.error('[createSession] Error message:', error.message);
      console.error('[createSession] Error stack:', error.stack);
    }
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
    console.log('[getUserSessions] supabaseUrl:', supabaseUrl);

    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    });

    console.log('[getUserSessions] Executing query: SELECT * FROM sessions WHERE user_id =', userId);

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('[getUserSessions] ❌ Error fetching sessions:', error);
      console.error('[getUserSessions] Error code:', error.code);
      console.error('[getUserSessions] Error message:', error.message);
      console.error('[getUserSessions] Error details:', JSON.stringify(error, null, 2));
      return [];
    }

    console.log('[getUserSessions] ✅ Query successful!');
    console.log('[getUserSessions] Raw data returned:', data);
    console.log('[getUserSessions] Number of sessions:', data?.length || 0);

    if (data && data.length > 0) {
      console.log('[getUserSessions] First session:', data[0]);
    } else {
      console.log('[getUserSessions] ⚠️ No sessions found for user:', userId);
      console.log('[getUserSessions] This could mean:');
      console.log('[getUserSessions]   1. Sessions table is empty for this user');
      console.log('[getUserSessions]   2. RLS policy is blocking reads (even with service role)');
      console.log('[getUserSessions]   3. user_id mismatch in database');
    }

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
