'use client';

import { format } from 'date-fns';
import { getCategoryIcon } from '@/lib/category-icons';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string | null;
  balance: number | null;
  category: string | null;
  bank_name: string | null;
  fraud_likelihood?: number | null;
  fraud_reason?: string | null;
}

interface TransactionTableProps {
  transactions: Transaction[];
  loading?: boolean;
}

export default function TransactionTable({
  transactions,
  loading = false,
}: TransactionTableProps) {
  const formatCurrency = (amount: number, currency?: string | null) => {
    const symbol = currency === 'SGD' || !currency ? 'S$' : currency === 'USD' ? '$' : currency;
    const absAmount = Math.abs(amount);
    return `${amount < 0 ? '-' : ''}${symbol}${absAmount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getMonthKey = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  const getFraudIndicator = (likelihood?: number | null) => {
    if (!likelihood || likelihood < 0.3) {
      return { icon: '✓', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40', label: 'Safe' };
    } else if (likelihood < 0.6) {
      return { icon: '⚠', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40', label: 'Medium Risk' };
    } else {
      return { icon: '⚠', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40', label: 'High Risk' };
    }
  };

  // Group transactions by month
  const groupedTransactions: Record<string, Transaction[]> = {};
  transactions.forEach((t) => {
    const month = getMonthKey(t.date);
    if (!groupedTransactions[month]) {
      groupedTransactions[month] = [];
    }
    groupedTransactions[month].push(t);
  });

  // Sort months in descending order (most recent first)
  const months = Object.keys(groupedTransactions).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime();
  });

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-slideInUp">
        <div className="flex justify-center items-center h-64">
          <svg
            className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400"
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
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-slideInUp">
        <p className="text-gray-500 dark:text-gray-400 text-center">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-slideInUp hover-lift">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-1">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">
                Category
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                Fraud Risk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                Bank
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {months.map((month, monthIndex) => [
              // Month Header Row
              <tr key={`month-${month}`} className="bg-gray-100 dark:bg-gray-700">
                <td colSpan={7} className="px-6 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {month}
                </td>
              </tr>,
              // Transaction Rows
              ...groupedTransactions[month].map((transaction) => {
                const fraudIndicator = getFraudIndicator(transaction.fraud_likelihood);
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300 truncate">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                        <span className="text-base">{getCategoryIcon(transaction.category || 'Miscellaneous').emoji}</span>
                        {transaction.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center justify-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${fraudIndicator.bg} ${fraudIndicator.color}`}
                          title={transaction.fraud_reason || 'No fraud assessment'}
                        >
                          <span className="text-sm">{fraudIndicator.icon}</span>
                          <span className="hidden lg:inline">{fraudIndicator.label}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {transaction.bank_name || '-'}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                        transaction.amount >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                      {transaction.balance !== null
                        ? formatCurrency(transaction.balance, transaction.currency)
                        : '-'}
                    </td>
                  </tr>
                );
              }),
              // Month Separator
              monthIndex < months.length - 1 && (
                <tr key={`separator-${month}`}>
                  <td colSpan={7} className="h-1" />
                </tr>
              ),
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}
