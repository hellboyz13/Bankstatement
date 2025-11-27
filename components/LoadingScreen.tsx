'use client';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-6">
          {/* Animated circles */}
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <div
              className="circle w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: '0ms', animationDuration: '600ms' }}
            />
            <div
              className="circle w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: '100ms', animationDuration: '600ms' }}
            />
            <div
              className="circle w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: '200ms', animationDuration: '600ms' }}
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Loading Session
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Retrieving your saved transactions...
        </p>
      </div>
    </div>
  );
}
