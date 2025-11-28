export type CategoryIcon = {
  emoji: string;
  label: string;
};

export const categoryIcons: Record<string, CategoryIcon> = {
  'Food & Dining': {
    emoji: '🍔',
    label: 'Food',
  },
  'Transport': {
    emoji: '🚌',
    label: 'Transport',
  },
  'Shopping': {
    emoji: '🛍️',
    label: 'Shopping',
  },
  'Entertainment': {
    emoji: '🎬',
    label: 'Entertainment',
  },
  'Bills & Utilities': {
    emoji: '💡',
    label: 'Bills',
  },
  'Health & Medical': {
    emoji: '⚕️',
    label: 'Health',
  },
  'Travel & Accommodation': {
    emoji: '✈️',
    label: 'Travel',
  },
  'Education': {
    emoji: '📚',
    label: 'Education',
  },
  'Fitness & Wellness': {
    emoji: '💪',
    label: 'Fitness',
  },
  'Groceries': {
    emoji: '🛒',
    label: 'Groceries',
  },
  'Insurance': {
    emoji: '🛡️',
    label: 'Insurance',
  },
  'Subscriptions': {
    emoji: '📺',
    label: 'Subscriptions',
  },
  'Gifts & Donations': {
    emoji: '🎁',
    label: 'Gifts',
  },
  'Personal Care': {
    emoji: '💇',
    label: 'Personal Care',
  },
  'Dining & Restaurants': {
    emoji: '🍽️',
    label: 'Dining',
  },
  'Coffee & Tea': {
    emoji: '☕',
    label: 'Coffee',
  },
  'Fast Food': {
    emoji: '🍟',
    label: 'Fast Food',
  },
  'Rent & Mortgage': {
    emoji: '🏠',
    label: 'Rent',
  },
  'Utilities': {
    emoji: '💧',
    label: 'Utilities',
  },
  'Internet & Phone': {
    emoji: '📱',
    label: 'Internet',
  },
  'Miscellaneous': {
    emoji: '📌',
    label: 'Other',
  },
};

export function getCategoryIcon(category: string): CategoryIcon {
  // Handle case-insensitive lookups and normalize category names
  const normalized = category.toLowerCase().trim();

  // Map common lowercase names to proper category keys
  const categoryMap: Record<string, string> = {
    'dining': 'Food & Dining',
    'food': 'Food & Dining',
    'food & dining': 'Food & Dining',
    'transport': 'Transport',
    'shopping': 'Shopping',
    'entertainment': 'Entertainment',
    'groceries': 'Groceries',
    'other': 'Miscellaneous',
    'miscellaneous': 'Miscellaneous',
  };

  // Try mapped category first
  const mappedCategory = categoryMap[normalized];
  if (mappedCategory && categoryIcons[mappedCategory]) {
    return categoryIcons[mappedCategory];
  }

  // Try exact match
  if (categoryIcons[category]) {
    return categoryIcons[category];
  }

  // Default to miscellaneous
  return categoryIcons['Miscellaneous'];
}
