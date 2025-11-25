'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface FileUploadProps {
  onUploadSuccess: () => void;
  canUpload?: boolean;
  isFreeUser?: boolean;
}

interface UploadedData {
  filename: string;
  transactions: any[];
  startDate: string | null;
  endDate: string | null;
}

export default function FileUpload({ onUploadSuccess, canUpload = true, isFreeUser = false }: FileUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadedData | null>(null);
  const [sessionName, setSessionName] = useState('');

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
        }
      }

      onUploadSuccess();

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

      // Clear uploaded data after successful save
      setUploadedData(null);
      setSessionName('');
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
