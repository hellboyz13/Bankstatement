'use client';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { getCategoryColor } from '@/lib/categorization';

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

interface AnalyticsChartsProps {
  data: AnalyticsData | null;
  loading?: boolean;
}

export default function AnalyticsCharts({
  data,
  loading = false,
}: AnalyticsChartsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-pulse"
          >
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Prepare category data for pie chart
  const categoryData = Object.entries(data.byCategory).map(
    ([category, amount]) => ({
      name: category,
      value: Math.round(amount * 100) / 100,
      color: getCategoryColor(category as any),
    })
  );


  const formatCurrency = (value: number) => `$${value.toFixed(0)}`;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-slideInUp hover-lift smooth-transition">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            ${data.summary.totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-slideInUp hover-lift smooth-transition" style={{animationDelay: '0.1s'}}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            ${data.summary.totalExpenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-slideInUp hover-lift smooth-transition" style={{animationDelay: '0.2s'}}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Savings</p>
          <p
            className={`text-2xl font-bold ${
              data.summary.netSavings >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            ${data.summary.netSavings.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-slideInUp hover-lift smooth-transition" style={{animationDelay: '0.3s'}}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transactions</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {data.summary.transactionCount}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-slideInUp hover-lift smooth-transition">
          <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">Spending by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    color: '#111827',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: '#111827', fontWeight: 'bold', marginBottom: '4px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center">No category data available</p>
          )}
        </div>

        {/* Category Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-slideInUp hover-lift smooth-transition" style={{animationDelay: '0.1s'}}>
          <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">Expenses by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    color: '#111827',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: '#111827', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Bar dataKey="value" fill="#4F46E5">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center">No category data available</p>
          )}
        </div>

      </div>
    </div>
  );
}
