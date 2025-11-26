'use client';

import Link from 'next/link';

export default function HomeButton() {
  return (
    <Link
      href="/dashboard"
      className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors smooth-transition"
      title="Go to Dashboard"
      aria-label="Home"
    >
      🏠
    </Link>
  );
}
