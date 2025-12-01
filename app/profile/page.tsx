'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

interface Session {
  id: string;
  filename: string;
  upload_date: string;
  modified_date: string;
  transaction_count: number;
  statement_start_date: string | null;
  statement_end_date: string | null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  useEffect(() => {
    // Fetch sessions for all users to show what's saved
    fetchSessions();
  }, [user.id]);

  // Auto-refresh when page becomes visible (e.g., after navigating back from dashboard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSessions();
      }
    };

    // Listen for sessionSaved events from FileUpload component
    const handleSessionSaved = (event: Event) => {
      console.log('[Profile] Session saved event received, refreshing sessions');
      fetchSessions();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('sessionSaved', handleSessionSaved as EventListener);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('sessionSaved', handleSessionSaved as EventListener);
    };
  }, []);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    setError(null);

    try {
      console.log('[Profile] Fetching sessions for user:', user.id);

      // Check if this is a demo user
      const isDemoUser = user.id === 'demo-user-localhost' || user.id.startsWith('google_user_');

      if (isDemoUser) {
        console.log('[Profile] Demo user - reading sessions from localStorage');
        // For demo users, read from localStorage
        const sessionsStr = localStorage.getItem('bank_analyzer_sessions');
        const localSessions = sessionsStr ? JSON.parse(sessionsStr) : [];
        console.log('[Profile] Found', localSessions.length, 'sessions in localStorage');
        setSessions(localSessions);
        return;
      }

      // For real users, fetch from API
      const response = await fetch(`/api/sessions/list?userId=${user.id}`);
      const data = await response.json();

      console.log('[Profile] Sessions API response:', response.ok, data);

      if (response.ok) {
        setSessions(data.sessions || []);
        console.log('[Profile] Set sessions state:', data.sessions);
      } else {
        setError(data.error || 'Failed to fetch sessions');
        console.error('[Profile] Failed to fetch sessions:', data.error);
      }
    } catch (err) {
      console.error('[Profile] Error fetching sessions:', err);
      setError('Failed to fetch sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRenameSession = async (sessionId: string) => {
    if (!newName.trim()) {
      setError('Session name cannot be empty');
      return;
    }

    try {
      const response = await fetch('/api/sessions/rename', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          newFilename: newName,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSessions(sessions.map((s) => (s.id === sessionId ? { ...s, filename: newName } : s)));
        setRenamingId(null);
        setNewName('');
      } else {
        setError(data.error || 'Failed to rename session');
      }
    } catch (err) {
      console.error('Error renaming session:', err);
      setError('Failed to rename session');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/delete?sessionId=${sessionId}&userId=${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
      } else {
        setError(data.error || 'Failed to delete session');
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete session');
    }
  };

  const createdDate = new Date(user.createdAt);
  const planBadgeColor = user.plan === 'premium' ? 'bg-gold-100 text-gold-800' : 'bg-blue-100 text-blue-800';

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">Account Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account details and subscription
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-6xl">👤</div>
              <div>
                <h2 className="text-2xl font-bold text-black dark:text-white">Account Information</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-medium">
                  {user.email}
                </div>
              </div>

              {/* Account Created */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Created
                </label>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {format(createdDate, 'MMMM d, yyyy')}
                </div>
              </div>

              {/* Plan Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Plan
                </label>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      user.plan === 'premium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                    }`}
                  >
                    {user.plan === 'premium' ? '⭐ Premium' : 'Free'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Usage */}
          <div>
            <h3 className="text-xl font-bold text-black dark:text-white mb-6">Usage & Limits</h3>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Statement Uploads</span>
                <span
                  className={`text-lg font-bold ${
                    user.plan === 'premium' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {user.plan === 'premium' ? '∞ Unlimited' : `${user.uploadCount} / 1`}
                </span>
              </div>

              {user.plan === 'free' && (
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all"
                    style={{ width: `${Math.min((user.uploadCount / 1) * 100, 100)}%` }}
                  />
                </div>
              )}

              {user.plan === 'free' && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                  {user.uploadCount === 0
                    ? 'You have 1 free statement upload available.'
                    : 'You have used your free upload. Upgrade to Premium for unlimited uploads.'}
                </p>
              )}

              {user.plan === 'premium' && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-3">
                  Premium members enjoy unlimited statement uploads and full access to all features.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Session History - Premium Only */}
        {user.plan === 'premium' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-black dark:text-white">📁 Statement Sessions</h3>
                <button
                  onClick={fetchSessions}
                  disabled={loadingSessions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                View and manage your saved statement sessions. You can store up to 12 sessions per year.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-200 text-sm">
                  {error}
                </div>
              )}

              {loadingSessions ? (
                <div className="flex items-center text-blue-600 dark:text-blue-400">
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading sessions...
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-400">
                    No saved sessions yet. Upload a statement and click "Save Session" to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        {renamingId === session.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder="New session name"
                              className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                              autoFocus
                            />
                            <button
                              onClick={() => handleRenameSession(session.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setRenamingId(null)}
                              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{session.filename}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              📊 {session.transaction_count} transactions
                              {session.statement_start_date && session.statement_end_date && (
                                <span> • {format(new Date(session.statement_start_date), 'MMM d')} to {format(new Date(session.statement_end_date), 'MMM d, yyyy')}</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Uploaded: {format(new Date(session.upload_date), 'PPP p')}
                              {session.modified_date !== session.upload_date && (
                                <span> • Last modified: {format(new Date(session.modified_date), 'PPP p')}</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {renamingId !== session.id && (
                        <div className="flex gap-2 ml-4">
                          <Link
                            href={`/dashboard?loadSession=${session.id}`}
                            className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 text-sm font-medium transition-colors"
                          >
                            👁️ View
                          </Link>
                          <button
                            onClick={() => {
                              setRenamingId(session.id);
                              setNewName(session.filename);
                            }}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 text-sm font-medium transition-colors"
                          >
                            ✏️ Rename
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {user.plan === 'free' && (
            <Link
              href="/plans"
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
            >
              Upgrade to Premium
            </Link>
          )}

          <Link
            href="/plans"
            className="block w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-center"
          >
            View Plans & Pricing
          </Link>

          <Link
            href="/dashboard"
            className="block w-full px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium text-center"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
