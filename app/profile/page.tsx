'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

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
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6">Account Information</h2>

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
