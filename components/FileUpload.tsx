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
  const useClaudeParser = true; // Always use AI Parser

  // Progress tracking
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

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

  const processFiles = async (files: FileList) => {
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
        const fileStartTime = Date.now();

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

        console.log(`[CLIENT TIMING] Starting upload for ${file.name} (${(file.size / 1024).toFixed(2)}KB) using ${useClaudeParser ? 'AI' : 'Legacy'} parser`);

        let data: any;
        let parseTime = 0;
        const parseStartTime = Date.now();

        if (useClaudeParser) {
          // Use streaming endpoint with progress
          setProgress(0);
          setProgressMessage('Uploading PDF...');

          const response = await fetch('/api/parse-statement-stream', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok || !response.body) {
            throw new Error(`${file.name}: Upload failed`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;

              const jsonStr = line.slice(6);
              if (!jsonStr.trim()) continue;

              try {
                const event = JSON.parse(jsonStr);
                console.log(`[SSE] Received event:`, event.type, `progress: ${event.progress}%`);

                if (event.type === 'status') {
                  setProgressMessage(event.message);
                  setProgress(event.progress);
                } else if (event.type === 'estimate') {
                  if (event.estimatedTime !== undefined) {
                    setEstimatedTime(event.estimatedTime);
                  }
                  setProgressMessage(event.message);
                  setProgress(event.progress);
                } else if (event.type === 'progress') {
                  console.log(`[SSE] Setting progress to ${event.progress}%`);
                  setProgress(event.progress);
                  setProgressMessage(event.message);
                  if (event.estimatedTimeRemaining !== undefined) {
                    setEstimatedTime(event.estimatedTimeRemaining);
                  }
                } else if (event.type === 'complete') {
                  setProgress(100);
                  setProgressMessage(event.message);
                  data = { success: true, statement: event.statement };
                } else if (event.type === 'error') {
                  throw new Error(event.error);
                }
              } catch (parseError) {
                console.error('Failed to parse SSE event:', parseError);
              }
            }
          }

          parseTime = Date.now() - parseStartTime;
          console.log(`[CLIENT TIMING] Parse API call took ${parseTime}ms with streaming`);
        } else {
          // Legacy parser without progress
          const response = await fetch('/api/upload-local', {
            method: 'POST',
            body: formData,
          });

          data = await response.json();
          parseTime = Date.now() - parseStartTime;
          console.log(`[CLIENT TIMING] Parse API call took ${parseTime}ms`);

          if (!response.ok) {
            throw new Error(`${file.name}: ${data.error || 'Upload failed'}`);
          }
        }

        // Handle response based on parser type
        console.log(`[DEBUG] Upload complete - useClaudeParser: ${useClaudeParser}, data exists: ${!!data}`);
        if (data) {
          console.log(`[DEBUG] Data structure:`, { success: data.success, hasStatement: !!data.statement });
        }

        // Check if parsing failed
        if (useClaudeParser && !data) {
          throw new Error('AI parsing failed or timed out. Please try again or use a smaller PDF.');
        }

        if (useClaudeParser && data && data.success && data.statement) {
          // Claude parser response - need to store to local storage
          console.log(`[CLIENT TIMING] Starting store operation`);
          console.log(`[DEBUG] Parsed statement has ${data.statement.transactions?.length || 0} transactions`);
          const storeStartTime = Date.now();

          const storeResponse = await fetch('/api/store-parsed-statement', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              parsedStatement: data.statement,
              fileName: file.name,
            }),
          });

          const storeData = await storeResponse.json();
          const storeTime = Date.now() - storeStartTime;

          console.log(`[CLIENT TIMING] Store API call took ${storeTime}ms`);
          console.log(`[DEBUG] Store response has ${storeData.transactions?.length || 0} transactions`);

          if (storeData.statement && storeData.transactions) {
            // CRITICAL: Save to localStorage on CLIENT-SIDE (API route runs on server and can't access localStorage)
            console.log(`[DEBUG] Claude parser - saving ${storeData.transactions.length} transactions to localStorage`);

            // Save statement to localStorage
            const statements = JSON.parse(localStorage.getItem('bank_analyzer_statements') || '[]');
            const statementToSave = {
              id: storeData.statement.id,
              bank_name: storeData.statement.bank_name || data.statement?.meta?.bank_name,
              file_name: storeData.statement.file_name,
              uploaded_at: new Date().toISOString(),
              start_date: storeData.statement.start_date,
              end_date: storeData.statement.end_date,
              created_at: new Date().toISOString(),
            };
            statements.push(statementToSave);
            localStorage.setItem('bank_analyzer_statements', JSON.stringify(statements));
            console.log(`[DEBUG] Saved statement to localStorage. Total statements: ${statements.length}`);

            // Save transactions to localStorage
            const existingTransactions = JSON.parse(localStorage.getItem('bank_analyzer_transactions') || '[]');
            existingTransactions.push(...storeData.transactions);
            localStorage.setItem('bank_analyzer_transactions', JSON.stringify(existingTransactions));
            console.log(`[DEBUG] Saved to localStorage - ${storeData.transactions.length} transactions. Total: ${existingTransactions.length}`);

            setUploadedData({
              filename: storeData.statement.file_name,
              transactions: storeData.transactions,
              startDate: storeData.statement.start_date,
              endDate: storeData.statement.end_date,
            });
            setSessionName(storeData.statement.file_name.replace(/\.pdf$/i, ''));

            const newStatement: Statement = {
              id: storeData.statement.id,
              bank_name: storeData.statement.bank_name || data.statement?.meta?.bank_name,
              file_name: storeData.statement.file_name,
              uploaded_at: new Date().toISOString(),
              start_date: storeData.statement.start_date,
              end_date: storeData.statement.end_date,
              transaction_count: storeData.statement.transaction_count,
            };
            setStatements(prev => [...prev, newStatement]);

            const totalFileTime = Date.now() - fileStartTime;
            console.log(`[CLIENT TIMING] ✅ TOTAL time for ${file.name}: ${totalFileTime}ms (Parse: ${parseTime}ms + Store: ${storeTime}ms)`);
          } else {
            console.error('[DEBUG] Store response missing statement or transactions:', storeData);
          }
        } else if (data.statement && data.transactions) {
          // Legacy parser response - save to localStorage
          console.log(`[DEBUG] Legacy parser - saving ${data.transactions.length} transactions to localStorage`);

          // Save statement to localStorage
          const statements = JSON.parse(localStorage.getItem('bank_analyzer_statements') || '[]');
          const statementToSave = {
            id: data.statement.id,
            bank_name: data.statement.bank_name,
            file_name: data.statement.file_name,
            uploaded_at: new Date().toISOString(),
            start_date: data.statement.start_date,
            end_date: data.statement.end_date,
            created_at: new Date().toISOString(),
          };
          statements.push(statementToSave);
          localStorage.setItem('bank_analyzer_statements', JSON.stringify(statements));

          // Save transactions to localStorage
          const existingTransactions = JSON.parse(localStorage.getItem('bank_analyzer_transactions') || '[]');
          existingTransactions.push(...data.transactions);
          localStorage.setItem('bank_analyzer_transactions', JSON.stringify(existingTransactions));

          console.log(`[DEBUG] Saved to localStorage - ${data.transactions.length} transactions`);

          setUploadedData({
            filename: data.statement.file_name,
            transactions: data.transactions,
            startDate: data.statement.start_date,
            endDate: data.statement.end_date,
          });
          setSessionName(data.statement.file_name.replace(/\.pdf$/i, ''));

          const newStatement: Statement = {
            id: data.statement.id,
            bank_name: data.statement.bank_name,
            file_name: data.statement.file_name,
            uploaded_at: new Date().toISOString(),
            start_date: data.statement.start_date,
            end_date: data.statement.end_date,
            transaction_count: data.statement.transaction_count,
          };

          const totalFileTime = Date.now() - fileStartTime;
          console.log(`[CLIENT TIMING] ✅ TOTAL time for ${file.name}: ${totalFileTime}ms (Legacy parser)`);
          setStatements(prev => [...prev, newStatement]);
          console.log('Added statement to list:', newStatement);
        }
      }

      onUploadSuccess();

      // Don't fetch from server - we're managing statements locally now
      // await fetchStatements();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await processFiles(files);

    // Reset form
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading && canUpload) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone itself
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!canUpload || uploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  };

  const handleSaveSession = async () => {
    if (!user?.id) {
      setError('Missing user information');
      return;
    }

    if (statements.length === 0) {
      setError('No statements to save. Please upload at least one statement.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('[FileUpload] Fetching all transactions for session save from localStorage');

      // Get transactions directly from localStorage (client-side only)
      const transactionsKey = 'bank_analyzer_transactions';
      const transactionsStr = localStorage.getItem(transactionsKey);
      const allTransactions = transactionsStr ? JSON.parse(transactionsStr) : [];

      if (!allTransactions || allTransactions.length === 0) {
        throw new Error('No transactions found to save. Please upload a statement first.');
      }

      console.log('[FileUpload] Saving', allTransactions.length, 'transactions');

      // Get the date range from all statements
      const allStatements = statements;
      const startDates = allStatements
        .map(s => s.start_date)
        .filter(d => d !== null)
        .sort();
      const endDates = allStatements
        .map(s => s.end_date)
        .filter(d => d !== null)
        .sort();

      const sessionFilename = sessionName ||
        (allStatements.length === 1
          ? allStatements[0].file_name
          : `Combined Statements (${allStatements.length} files)`);

      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          filename: sessionFilename,
          transactions: allTransactions,
          statementStartDate: startDates[0] || null,
          statementEndDate: endDates[endDates.length - 1] || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save session');
      }

      console.log('[FileUpload] Session saved successfully:', result);

      // For demo users, save session to localStorage
      if (result.isDemo && result.session) {
        console.log('[FileUpload] Demo user - saving session to localStorage');
        const sessionsStr = localStorage.getItem('bank_analyzer_sessions');
        const sessions = sessionsStr ? JSON.parse(sessionsStr) : [];
        sessions.push(result.session);
        localStorage.setItem('bank_analyzer_sessions', JSON.stringify(sessions));
        console.log('[FileUpload] Saved session to localStorage. Total sessions:', sessions.length);
      }

      // Show success message with refresh instruction
      setSuccess(`✅ Session "${sessionFilename}" saved successfully with ${allTransactions.length} transactions! Go to Profile page and click Refresh to see it.`);

      // Clear uploaded data after successful save
      setUploadedData(null);
      setSessionName('');

      // Dispatch custom event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sessionSaved', { detail: result }));
      }

      // Clear success message after 10 seconds (longer to give time to read)
      setTimeout(() => setSuccess(null), 10000);
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
        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative border-4 border-dashed rounded-xl p-16 text-center transition-all duration-300 min-h-[300px] flex items-center justify-center ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 scale-102 shadow-xl'
              : 'border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg'
          } ${uploading || !canUpload ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <input
            type="file"
            id="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading || !canUpload}
            multiple={!isFreeUser}
          />
          <label
            htmlFor="file"
            className={`flex flex-col items-center gap-6 w-full ${uploading || !canUpload ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className={`text-7xl transition-all duration-300 ${isDragging ? 'scale-125 rotate-12' : 'scale-100'}`}>
              📄
            </div>
            <div className="space-y-3">
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {isDragging ? 'Drop PDF Here!' : 'Choose File or Drag & Drop'}
              </p>
              <p className="text-base text-gray-600 dark:text-gray-300 font-medium">
                {isDragging ? 'Release to upload' : 'Click to browse or drag your PDF file here'}
              </p>
              <div className="pt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 inline-block px-4 py-2 bg-white dark:bg-gray-700 rounded-full border border-gray-300 dark:border-gray-600">
                  {isFreeUser ? '📌 Max 1 file • Up to 10MB • PDF only' : '📌 Multiple files • Up to 10MB each • PDF only'}
                </p>
              </div>
            </div>
          </label>
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500/10 rounded-xl pointer-events-none animate-pulse border-4 border-blue-400" />
          )}
        </div>

        {/* Progress Bar */}
        {uploading && progress > 0 && (
          <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg animate-slideInDown">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {progressMessage}
              </span>
              {estimatedTime !== null && estimatedTime > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ~{Math.round(estimatedTime / 1000)}s remaining
                </span>
              )}
            </div>
            <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="h-full w-full animate-pulse opacity-50 bg-white/20"></div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {progress < 5 && "📄 Reading PDF file..."}
                {progress >= 5 && progress < 10 && "📊 Preparing data..."}
                {progress >= 10 && progress < 30 && "🤖 AI analyzing page 1..."}
                {progress >= 30 && progress < 50 && "🔍 Extracting transactions..."}
                {progress >= 50 && progress < 70 && "💰 Processing amounts..."}
                {progress >= 70 && progress < 90 && "📝 Categorizing expenses..."}
                {progress >= 90 && progress < 100 && "✨ Finalizing results..."}
                {progress >= 100 && "✅ Complete!"}
              </span>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {progress.toFixed(1)}%
              </span>
            </div>
          </div>
        )}


        {/* Statement Navigation Tabs */}
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
