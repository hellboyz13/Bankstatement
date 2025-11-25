'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function PlansPage() {
  const { user, upgradeToPremium } = useAuth();
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  if (!user) {
    return null;
  }

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      // Simulate upgrade process
      await new Promise((resolve) => setTimeout(resolve, 500));
      upgradeToPremium();
      setUpgraded(true);
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">Plans & Pricing</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose the plan that's right for you
          </p>
        </div>

        {upgraded && (
          <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
            <p className="text-green-800 dark:text-green-200 font-semibold text-lg">
              ✓ Successfully upgraded to Premium!
            </p>
            <p className="text-green-700 dark:text-green-300 text-sm mt-2">
              You now have unlimited uploads and full access to all features.
            </p>
          </div>
        )}

        {/* Plans Comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all ${
              user.plan === 'free' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8 text-white">
              <h2 className="text-2xl font-bold">Free Plan</h2>
              <p className="text-blue-100 mt-2">Get started with basic features</p>
            </div>

            <div className="p-8">
              {/* Price */}
              <div className="mb-8">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">$0</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Forever free</p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">1 bank statement upload</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Basic transaction analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Category filtering and sorting</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">CSV export</span>
                </li>
                <li className="flex items-start gap-3 opacity-50">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Multiple statements & combined dashboards</span>
                </li>
              </ul>

              {/* CTA */}
              {user.plan === 'free' ? (
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading || upgraded}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {upgraded ? '✓ Upgraded to Premium' : upgrading ? 'Upgrading...' : 'Upgrade to Premium'}
                </button>
              ) : (
                <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-center font-medium">
                  ✓ Upgrade from here
                </div>
              )}
            </div>
          </div>

          {/* Premium Plan */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all transform scale-105 ${
              user.plan === 'premium' ? 'ring-2 ring-yellow-500' : ''
            }`}
          >
            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-8 text-white relative">
              <div className="absolute top-4 right-4 bg-white text-yellow-600 px-3 py-1 rounded-full text-xs font-bold">
                POPULAR
              </div>
              <h2 className="text-2xl font-bold">Premium Plan</h2>
              <p className="text-yellow-100 mt-2">Unlimited access and analysis</p>
            </div>

            <div className="p-8">
              {/* Price */}
              <div className="mb-8">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">$4.99</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">per month</p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Unlimited</span> statement uploads
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Advanced transaction analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Multi-statement comparison</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Combined dashboards and analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">Batch CSV export for all statements</span>
                </li>
              </ul>

              {/* CTA */}
              {user.plan === 'premium' ? (
                <div className="w-full px-4 py-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 rounded-lg text-center font-medium">
                  ✓ Current Plan
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading || upgraded}
                  className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg disabled:bg-gray-400 transition-colors font-medium"
                >
                  {upgraded ? '✓ Upgraded!' : upgrading ? 'Upgrading...' : 'Upgrade to Premium'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
