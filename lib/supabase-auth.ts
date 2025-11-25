import { supabase } from './supabase';
import { User } from './auth-types';

/**
 * Sign up a new user with email and password
 */
export async function signUpUser(
  email: string,
  password: string,
  plan: 'free' | 'premium' = 'free'
): Promise<User> {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Failed to create user');

  // Create user profile in database
  const { data: userData, error: dbError } = await supabase
    .from('users')
    .insert([
      {
        id: authData.user.id,
        email,
        plan,
        upload_count: 0,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (dbError) throw new Error(dbError.message);

  return {
    id: userData.id,
    email: userData.email,
    plan: userData.plan,
    uploadCount: userData.upload_count,
    createdAt: userData.created_at,
    lastLogin: userData.last_login,
  };
}

/**
 * Sign in user with email and password
 */
export async function signInUser(email: string, password: string): Promise<User> {
  // Authenticate with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Authentication failed');

  // Get user profile
  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (dbError) throw new Error(dbError.message);

  // Update last login
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', authData.user.id);

  return {
    id: userData.id,
    email: userData.email,
    plan: userData.plan,
    uploadCount: userData.upload_count,
    createdAt: userData.created_at,
    lastLogin: userData.last_login,
  };
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

/**
 * Get current user session from Supabase
 */
export async function getCurrentUserSession(): Promise<User | null> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) return null;

  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (dbError || !userData) return null;

  return {
    id: userData.id,
    email: userData.email,
    plan: userData.plan,
    uploadCount: userData.upload_count,
    createdAt: userData.created_at,
    lastLogin: userData.last_login,
  };
}

/**
 * Get or create a demo user for Google login
 */
export async function getOrCreateDemoUser(isPremium: boolean = false): Promise<User> {
  const timestamp = Date.now();
  const email = `google_user_${timestamp}@google-demo.com`;
  const demoPassword = `GoogleDemo${timestamp}!@#`;
  const plan = isPremium ? 'premium' : 'free';

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    return {
      id: existingUser.id,
      email: existingUser.email,
      plan: existingUser.plan,
      uploadCount: existingUser.upload_count,
      createdAt: existingUser.created_at,
      lastLogin: existingUser.last_login,
    };
  }

  // Create new demo user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: demoPassword,
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Failed to create demo user');

  // Create user profile
  const { data: userData, error: dbError } = await supabase
    .from('users')
    .insert([
      {
        id: authData.user.id,
        email,
        plan,
        upload_count: 0,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (dbError) throw new Error(dbError.message);

  return {
    id: userData.id,
    email: userData.email,
    plan: userData.plan,
    uploadCount: userData.upload_count,
    createdAt: userData.created_at,
    lastLogin: userData.last_login,
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'email'>>
): Promise<User> {
  // Convert camelCase to snake_case
  const dbUpdates: Record<string, any> = {};

  if (updates.plan) dbUpdates.plan = updates.plan;
  if (updates.uploadCount !== undefined) dbUpdates.upload_count = updates.uploadCount;
  if (updates.lastLogin) dbUpdates.last_login = updates.lastLogin;
  if (updates.createdAt) dbUpdates.created_at = updates.createdAt;

  const { data: userData, error } = await supabase
    .from('users')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: userData.id,
    email: userData.email,
    plan: userData.plan,
    uploadCount: userData.upload_count,
    createdAt: userData.created_at,
    lastLogin: userData.last_login,
  };
}

/**
 * Increment upload count for a user
 */
export async function incrementUploadCount(userId: string): Promise<number> {
  const { data: currentUser, error: fetchError } = await supabase
    .from('users')
    .select('upload_count')
    .eq('id', userId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const newCount = (currentUser.upload_count || 0) + 1;

  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({ upload_count: newCount })
    .eq('id', userId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  return updatedUser.upload_count;
}

/**
 * Upgrade user to premium
 */
export async function upgradeToPremium(userId: string): Promise<User> {
  const { data: userData, error } = await supabase
    .from('users')
    .update({ plan: 'premium' })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: userData.id,
    email: userData.email,
    plan: userData.plan,
    uploadCount: userData.upload_count,
    createdAt: userData.created_at,
    lastLogin: userData.last_login,
  };
}
