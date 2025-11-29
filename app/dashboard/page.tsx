'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import TransactionFilters from '@/components/TransactionFilters';
import TransactionTable from '@/components/TransactionTable';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import LoadingScreen from '@/components/LoadingScreen';
import { generateCSV, downloadCSV, generateFilename } from '@/lib/csv-export';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string | null;
  balance: number | null;
  category: string | null;
  bank_name: string | null;
}

interface AnalyticsData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    transactionCount: number;
  };
  byCategory: Record<string, number>;
  byMonth: Record<string, { income: number; expenses: number }>;
}

interface Statement {
  id: string;
  bank_name: string | null;
  file_name: string;
  uploaded_at: string;
  start_date: string | null;
  end_date: string | null;
  transaction_count: number;
}

export default function DashboardPage() {
  const { user, incrementUploadCount } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [selectedStatementId, setSelectedStatementId] = useState<string | 'all'>('all');
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadedSessionName, setLoadedSessionName] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: 'all',
  });

  const fetchStatements = useCallback(async () => {
    try {
      // Fetch statements directly from localStorage (client-side only)
      const statementsStr = localStorage.getItem('bank_analyzer_statements');
      const statements: Statement[] = statementsStr ? JSON.parse(statementsStr) : [];

      // Add transaction count to each statement
      const transactionsStr = localStorage.getItem('bank_analyzer_transactions');
      const transactions: any[] = transactionsStr ? JSON.parse(transactionsStr) : [];

      const statementsWithCount = statements.map((s: any) => ({
        id: s.id,
        bank_name: s.bank_name,
        file_name: s.file_name,
        uploaded_at: s.uploaded_at,
        start_date: s.start_date,
        end_date: s.end_date,
        transaction_count: transactions.filter((t: any) => t.statement_id === s.id).length,
      }));

      setStatements(statementsWithCount);
    } catch (error) {
      console.error('Failed to fetch statements:', error);
    }
  }, []);

  const loadSession = async (sessionId: string) => {
    if (!user?.id) return;

    setLoadingSession(true);
    setLoading(true);

    try {
      console.log('[Dashboard] Loading session:', sessionId);

      const response = await fetch(
        `/api/sessions/load?sessionId=${sessionId}&userId=${user.id}`
      );
      const data = await response.json();

      if (response.ok && data.success) {
        console.log('[Dashboard] Session loaded successfully:', data);
        setLoadedSessionName(data.session.filename);

        // Refresh statements and data from localStorage
        await fetchStatements();
        await fetchData();
      } else {
        console.error('[Dashboard] Failed to load session:', data.error);
      }
    } catch (error) {
      console.error('[Dashboard] Error loading session:', error);
    } finally {
      setLoadingSession(false);
      setLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      // Fetch transactions directly from localStorage (client-side only)
      const transactionsStr = localStorage.getItem('bank_analyzer_transactions');
      let allTransactions: Transaction[] = transactionsStr ? JSON.parse(transactionsStr) : [];

      // Apply filters on client side
      let filteredTransactions = allTransactions;

      if (selectedStatementId !== 'all') {
        filteredTransactions = filteredTransactions.filter(
          (t: any) => t.statement_id === selectedStatementId
        );
      }

      if (filters.startDate) {
        filteredTransactions = filteredTransactions.filter(
          (t) => t.date >= filters.startDate
        );
      }

      if (filters.endDate) {
        filteredTransactions = filteredTransactions.filter(
          (t) => t.date <= filters.endDate
        );
      }

      if (filters.category && filters.category !== 'all') {
        filteredTransactions = filteredTransactions.filter(
          (t) => t.category === filters.category
        );
      }

      setTransactions(filteredTransactions);

      // Calculate analytics client-side
      const income = filteredTransactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      const expenses = Math.abs(
        filteredTransactions
          .filter((t) => t.amount < 0)
          .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
      );

      const byCategory: Record<string, number> = {};
      filteredTransactions
        .filter((t) => t.amount < 0)
        .forEach((t) => {
          const category = t.category || 'Miscellaneous';
          byCategory[category] =
            (byCategory[category] || 0) + Math.abs(parseFloat(t.amount.toString()));
        });

      const byMonth: Record<string, { income: number; expenses: number }> = {};
      filteredTransactions.forEach((t) => {
        const month = t.date.substring(0, 7);
        if (!byMonth[month]) {
          byMonth[month] = { income: 0, expenses: 0 };
        }

        const amount = parseFloat(t.amount.toString());
        if (amount > 0) {
          byMonth[month].income += amount;
        } else {
          byMonth[month].expenses += Math.abs(amount);
        }
      });

      const analyticsData = {
        summary: {
          totalIncome: income,
          totalExpenses: expenses,
          netSavings: income - expenses,
          transactionCount: filteredTransactions.length,
        },
        byCategory,
        byMonth,
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedStatementId]);

  // Clear localStorage when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // Cleanup when leaving dashboard
      console.log('[Dashboard] Cleaning up transactions from localStorage');
      localStorage.removeItem('bank_analyzer_transactions');
      localStorage.removeItem('bank_analyzer_statements');
    };
  }, []);

  // Check for loadSession query parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const sessionId = searchParams.get('loadSession');

      if (sessionId) {
        console.log('[Dashboard] Found loadSession parameter:', sessionId);
        loadSession(sessionId);
        // Remove the query parameter after loading
        window.history.replaceState({}, '', '/dashboard');
      } else {
        // Normal data fetch
        fetchStatements();
        fetchData();
      }
    }
  }, []);

  // Refetch data when filters, selected statement, or statements list changes
  useEffect(() => {
    if (!loadingSession && statements.length > 0) {
      fetchData();
    }
  }, [filters, selectedStatementId, statements.length]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: 'all',
    });
  };

  const handleUploadSuccess = async () => {
    incrementUploadCount();
    await fetchStatements();
    fetchData();
  };

  const handleExportCSV = () => {
    const isFiltered = filters.startDate !== '' || filters.endDate !== '' || filters.category !== 'all';
    const statementName = selectedStatementId === 'all'
      ? 'all'
      : statements.find((s) => s.id === selectedStatementId)?.file_name || 'statement';

    const csv = generateCSV(transactions, statementName);
    const filename = generateFilename(statementName, isFiltered);
    downloadCSV(csv, filename);
  };

  // Check free plan limit
  const canUpload = user?.plan === 'premium' || (user?.plan === 'free' && user.uploadCount < 1);

  // Show full-screen loading when loading a session
  if (loadingSession) {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-3xl font-bold text-black dark:text-white smooth-transition">
            Bank Statement Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 smooth-transition">
            Upload your bank statements and analyze your spending patterns
          </p>

          {/* Loaded Session Indicator */}
          {loadedSessionName && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg animate-slideInDown">
              <p className="text-sm text-green-900 dark:text-green-200">
                <span className="font-semibold">📂 Loaded Session:</span> {loadedSessionName}
              </p>
            </div>
          )}

          {/* Free Plan Usage Info */}
          {user?.plan === 'free' && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg animate-slideInDown">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <span className="font-semibold">Free Plan Usage:</span> {user.uploadCount} / 1 statement upload
                {user.uploadCount >= 1 && (
                  <span className="block mt-2 text-blue-800 dark:text-blue-300">
                    You've used your free upload limit.{' '}
                    <button
                      onClick={() => router.push('/plans')}
                      className="underline font-semibold hover:text-blue-700 dark:hover:text-blue-100"
                    >
                      Upgrade to Premium
                    </button>{' '}
                    to upload more statements.
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Upload Section */}
        {canUpload ? (
          <div className="mb-8">
            <FileUpload
              onUploadSuccess={handleUploadSuccess}
              canUpload={canUpload}
              isFreeUser={user?.plan === 'free'}
              onStatementSelect={(id) => setSelectedStatementId(id)}
            />
          </div>
        ) : (
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-yellow-200 dark:border-yellow-800 animate-slideInUp hover-lift">
            <p className="text-gray-900 dark:text-white font-semibold smooth-transition">Upload Limit Reached</p>
            <p className="text-gray-700 dark:text-gray-300 mt-2">
              You've reached the maximum number of statements for the free plan (1 statement).
              <button
                onClick={() => router.push('/plans')}
                className="block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Upgrade to Premium
              </button>
            </p>
          </div>
        )}

        {/* Statement Tabs */}
        {statements.length > 0 && (
          <div className="mb-8 animate-slideInUp hover-lift">
            <div className="flex flex-wrap gap-3 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm smooth-transition">
              <div className="flex flex-wrap gap-3">
                {statements.map((stmt) => (
                  <button
                    key={stmt.id}
                    onClick={() => setSelectedStatementId(stmt.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedStatementId === stmt.id
                        ? 'bg-blue-600 text-white shadow-md hover:shadow-lg hover:bg-blue-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0015.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                      </svg>
                      {stmt.file_name.replace(/\.pdf$/i, '')}
                      <span className="ml-1 px-2 py-0.5 bg-opacity-30 rounded-full text-xs font-semibold">
                        {stmt.transaction_count}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelectedStatementId('all')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedStatementId === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM15 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM5 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM15 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
                  </svg>
                  Combine All
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {analytics && (
          <div className="mb-8">
            <AnalyticsCharts data={analytics} loading={loading} />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <TransactionFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* Transactions Table */}
        <div className="mb-8 animate-slideInUp">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-black dark:text-white smooth-transition">Transactions</h2>
            {transactions.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium smooth-transition hover-lift"
              >
                Export as CSV
              </button>
            )}
          </div>
          <TransactionTable transactions={transactions} loading={loading} />
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
          <p>Built with Next.js, Supabase, and Tailwind CSS</p>
        </footer>
      </div>
    </main>
  );
}
