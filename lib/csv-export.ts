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

// Escape CSV values to handle commas, quotes, and newlines
function escapeCSVValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function generateCSV(
  transactions: Transaction[],
  statementName?: string
): string {
  if (transactions.length === 0) {
    return 'No transactions to export';
  }

  // CSV Headers
  const headers = [
    'post_date',
    'trans_date',
    'description',
    'category',
    'amount_sgd',
    'currency',
  ];

  if (statementName === 'all' || !statementName) {
    headers.unshift('statement_label');
  }

  // CSV Rows
  const rows = transactions.map((t) => {
    const row = [
      escapeCSVValue(t.date),
      escapeCSVValue(t.date),
      escapeCSVValue(t.description),
      escapeCSVValue(t.category || 'Uncategorized'),
      escapeCSVValue(t.amount.toFixed(2)),
      escapeCSVValue(t.currency || 'SGD'),
    ];

    if (statementName === 'all' || !statementName) {
      const fileNameWithoutExt = t.bank_name || 'Unknown';
      row.unshift(escapeCSVValue(fileNameWithoutExt));
    }

    return row.join(',');
  });

  // Combine headers and rows
  const csv = [headers.join(','), ...rows].join('\n');
  return csv;
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function generateFilename(
  statementName?: string,
  filtered?: boolean
): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const baseName = statementName && statementName !== 'all'
    ? `${statementName.replace(/\.pdf$/i, '')}`
    : 'statements';
  const filterSuffix = filtered ? '_filtered' : '';
  return `${baseName}${filterSuffix}_${timestamp}.csv`;
}
