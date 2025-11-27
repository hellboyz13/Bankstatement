'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface FileUploadProps {
  onUploadSuccess: () => void;
  canUpload?: boolean;
  isFreeUser?: boolean;
  onStatementSelect?: (statementId: string | 'all') => void;
}

interface UploadedData {
  filename: string;
  transactions: any[];
  startDate: string | null;
  endDate: string | null;
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

export default function FileUpload({ onUploadSuccess, canUpload = true, isFreeUser = false, onStatementSelect }: FileUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadedData | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [statements, setStatements] = useState<Statement[]>([]);
  const [selectedStatementId, setSelectedStatementId] = useState<string | 'all'>('all');

  // Don't fetch from server on mount - server storage is unreliable in dev mode
  // Statements will be added directly from upload responses

  const handleRemoveStatement = async (statementId: string) => {
    try {
      console.log('[FileUpload] Removing statement:', statementId);

      // Call API to remove specific statement
      const response = await fetch('/api/remove-statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statementId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove statement');
      }

      console.log('[FileUpload] Statement removed successfully');

      // Remove from local state
      setStatements(prev => prev.filter(stmt => stmt.id !== statementId));

      // If we removed the selected statement, switch to 'all'
      if (selectedStatementId === statementId) {
        setSelectedStatementId('all');
        onStatementSelect?.('all');
      }

      // Notify dashboard to refresh
      onUploadSuccess();
    } catch (err) {
      console.error('Error removing statement:', err);
      setError('Failed to remove statement');
    }
  };

  const handleClearAllStatements = async () => {
    try {
      // Clear server-side storage
      await fetch('/api/clear-local', { method: 'POST' });

      // Clear component state
      setStatements([]);
      setSelectedStatementId('all');
      setUploadedData(null);
      setSessionName('');
      setSuccess(null);
      setError(null);
      onStatementSelect?.('all');

      // Notify dashboard to refresh
      onUploadSuccess();
    } catch (err) {
      console.error('Error clearing statements:', err);
      setError('Failed to clear statements');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate free plan can only upload 1 file
    if (isFreeUser && files.length > 1) {
      setError('Free plan allows uploading only 1 file at a time. Please select 1 PDF file.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (file.type !== 'application/pdf') {
          throw new Error(`${file.name}: Invalid file type. Only PDF files are allowed.`);
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name}: File size must be less than 10MB`);
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-local', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(`${file.name}: ${data.error || 'Upload failed'}`);
        }

        console.log(`Upload successful: ${file.name}`, data);

        // Store uploaded data for session saving
        if (data.statement && data.transactions) {
          setUploadedData({
            filename: data.statement.file_name,
            transactions: data.transactions,
            startDate: data.statement.start_date,
            endDate: data.statement.end_date,
          });
          setSessionName(data.statement.file_name.replace(/\.pdf$/i, ''));

          // Add the newly uploaded statement to the list immediately
          const newStatement: Statement = {
            id: data.statement.id,
            bank_name: data.statement.bank_name,
            file_name: data.statement.file_name,
            uploaded_at: new Date().toISOString(),
            start_date: data.statement.start_date,
            end_date: data.statement.end_date,
            transaction_count: data.statement.transaction_count,
          };
          setStatements(prev => [...prev, newStatement]);
          console.log('Added statement to list:', newStatement);
        }
      }

      onUploadSuccess();

      // Don't fetch from server - we're managing statements locally now
      // await fetchStatements();

      // Reset form
      e.target.value = '';
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSession = async () => {
    if (!uploadedData || !user?.id) {
      setError('Missing upload data or user information');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          filename: sessionName || uploadedData.filename,
          transactions: uploadedData.transactions,
          statementStartDate: uploadedData.startDate,
          statementEndDate: uploadedData.endDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save session');
      }

      // Show success message
      setSuccess(`✅ Session "${sessionName || uploadedData.filename}" saved successfully!`);

      // Clear uploaded data after successful save
      setUploadedData(null);
      setSessionName('');

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Save session error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-slideInUp hover-lift">
      <h2 className="text-xl font-semibold mb-4 text-black dark:text-white smooth-transition">Upload Bank Statement</h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="file"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            PDF Statement
          </label>
          <input
            type="file"
            id="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={uploading || !canUpload}
            multiple={!isFreeUser}
          />
        </div>

        {/* Statement Navigation Tabs */}
        {console.log('Rendering FileUpload - statements.length:', statements.length, 'statements:', statements)}
        {statements.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-blue-300 dark:border-blue-600">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">📂 Your Uploaded Statements ({statements.length})</h3>
            <div className="flex flex-wrap gap-2">
              {statements.map((stmt) => (
                <div
                  key={stmt.id}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedStatementId === stmt.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500'
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedStatementId(stmt.id);
                      onStatementSelect?.(stmt.id);
                    }}
                    className="flex items-center gap-1 flex-1 min-w-0"
                  >
                    <span className="flex items-center gap-1">
                      📄 {stmt.file_name.replace(/\.pdf$/i, '')}
                      <span className="ml-1 px-1.5 py-0.5 bg-black bg-opacity-20 rounded text-xs">
                        {stmt.transaction_count}
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveStatement(stmt.id);
                    }}
                    className="ml-2 p-1 hover:bg-red-500 hover:text-white rounded transition-colors"
                    title="Remove this file"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  setSelectedStatementId('all');
                  onStatementSelect?.('all');
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedStatementId === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500'
                }`}
              >
                📊 Combine All
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
              <button
                onClick={handleClearAllStatements}
                className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium text-sm"
              >
                🗑️ Clear All Files
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <svg
              className="animate-spin h-5 w-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing PDF...
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-200 text-sm animate-slideInDown">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md text-green-700 dark:text-green-200 text-sm animate-slideInDown">
            {success}
          </div>
        )}

        {uploadedData && (
          <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md animate-slideInUp">
            <h3 className="font-semibold text-green-900 dark:text-green-200 mb-3">
              ✅ File uploaded successfully! ({uploadedData.transactions.length} transactions)
            </h3>

            <div className="space-y-3">
              <div>
                <label htmlFor="sessionName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Save as Session (Premium only)
                </label>
                <input
                  type="text"
                  id="sessionName"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., January 2025 Statement"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  disabled={saving || user?.plan !== 'premium'}
                />
              </div>

              {user?.plan === 'free' && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  💡 Session saving is available for Premium users only. <a href="/plans" className="font-semibold underline hover:text-yellow-700 dark:hover:text-yellow-300">Upgrade now</a>
                </p>
              )}

              <button
                onClick={handleSaveSession}
                disabled={saving || user?.plan !== 'premium'}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving to Database...
                  </>
                ) : (
                  <>
                    💾 Save Session
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
