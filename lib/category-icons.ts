export type CategoryIcon = {
  emoji: string;
  label: string;
};

export const categoryIcons: Record<string, CategoryIcon> = {
  // Spending Categories
  'Food & Beverage': {
    emoji: '🍔',
    label: 'Food',
  },
  'Groceries': {
    emoji: '🛒',
    label: 'Groceries',
  },
  'Transport': {
    emoji: '🚌',
    label: 'Transport',
  },
  'Shopping – General Retail': {
    emoji: '🛍️',
    label: 'Shopping',
  },
  'Shopping – Fashion & Apparel': {
    emoji: '👗',
    label: 'Fashion',
  },
  'Shopping – Electronics & Technology': {
    emoji: '💻',
    label: 'Electronics',
  },
  'Shopping – Luxury & High-End': {
    emoji: '💎',
    label: 'Luxury',
  },
  'Health & Medical': {
    emoji: '⚕️',
    label: 'Health',
  },
  'Beauty & Personal Care': {
    emoji: '💇',
    label: 'Beauty',
  },
  'Entertainment & Leisure': {
    emoji: '🎬',
    label: 'Entertainment',
  },
  'Travel': {
    emoji: '✈️',
    label: 'Travel',
  },
  'Bills & Utilities': {
    emoji: '💡',
    label: 'Bills',
  },
  'Subscriptions & Digital Services': {
    emoji: '📺',
    label: 'Subscriptions',
  },
  'Insurance': {
    emoji: '🛡️',
    label: 'Insurance',
  },
  'Education': {
    emoji: '📚',
    label: 'Education',
  },
  'Home & Living': {
    emoji: '🏠',
    label: 'Home',
  },
  'Sports & Fitness': {
    emoji: '💪',
    label: 'Fitness',
  },
  'Pets': {
    emoji: '🐾',
    label: 'Pets',
  },
  'Family & Kids': {
    emoji: '👶',
    label: 'Kids',
  },
  'Financial – Fees & Charges': {
    emoji: '💳',
    label: 'Fees',
  },
  'Investments': {
    emoji: '📈',
    label: 'Investments',
  },
  'Donations & Charity': {
    emoji: '🎁',
    label: 'Charity',
  },
  'Government & Taxes': {
    emoji: '🏛️',
    label: 'Government',
  },

  // Credit-Related Categories
  'Credit Card Payment': {
    emoji: '💳',
    label: 'Card Payment',
  },
  'Refund / Reversal': {
    emoji: '↩️',
    label: 'Refund',
  },
  'Bank Credits': {
    emoji: '💰',
    label: 'Credits',
  },
  'True Income': {
    emoji: '💵',
    label: 'Income',
  },
  'Unknown Incoming': {
    emoji: '❓',
    label: 'Unknown In',
  },
  'Miscellaneous / Others': {
    emoji: '📌',
    label: 'Other',
  },
};

export function getCategoryIcon(category: string): CategoryIcon {
  // Handle case-insensitive lookups and normalize category names
  const normalized = category.toLowerCase().trim();

  // Map common lowercase names and old categories to new categories
  const categoryMap: Record<string, string> = {
    // Direct matches
    'food & beverage': 'Food & Beverage',
    'groceries': 'Groceries',
    'transport': 'Transport',
    'shopping – general retail': 'Shopping – General Retail',
    'shopping – fashion & apparel': 'Shopping – Fashion & Apparel',
    'shopping – electronics & technology': 'Shopping – Electronics & Technology',
    'shopping – luxury & high-end': 'Shopping – Luxury & High-End',
    'health & medical': 'Health & Medical',
    'beauty & personal care': 'Beauty & Personal Care',
    'entertainment & leisure': 'Entertainment & Leisure',
    'travel': 'Travel',
    'bills & utilities': 'Bills & Utilities',
    'subscriptions & digital services': 'Subscriptions & Digital Services',
    'insurance': 'Insurance',
    'education': 'Education',
    'home & living': 'Home & Living',
    'sports & fitness': 'Sports & Fitness',
    'pets': 'Pets',
    'family & kids': 'Family & Kids',
    'financial – fees & charges': 'Financial – Fees & Charges',
    'investments': 'Investments',
    'donations & charity': 'Donations & Charity',
    'government & taxes': 'Government & Taxes',
    'credit card payment': 'Credit Card Payment',
    'refund / reversal': 'Refund / Reversal',
    'bank credits': 'Bank Credits',
    'true income': 'True Income',
    'unknown incoming': 'Unknown Incoming',
    'miscellaneous / others': 'Miscellaneous / Others',

    // Legacy/old category mappings for backward compatibility
    'food & dining': 'Food & Beverage',
    'dining': 'Food & Beverage',
    'food': 'Food & Beverage',
    'shopping': 'Shopping – General Retail',
    'entertainment': 'Entertainment & Leisure',
    'healthcare': 'Health & Medical',
    'salary & income': 'True Income',
    'transfers': 'Miscellaneous / Others',
    'miscellaneous': 'Miscellaneous / Others',
    'other': 'Miscellaneous / Others',
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
  return categoryIcons['Miscellaneous / Others'];
}
