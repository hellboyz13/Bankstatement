// Transaction categorization logic - Global categories (no country-specific brands)
// Uses keyword-based rules to assign categories to transactions

export type TransactionCategory =
  | 'Food & Beverage'
  | 'Groceries'
  | 'Transport'
  | 'Shopping - General Retail'
  | 'Shopping - Fashion & Apparel'
  | 'Shopping - Electronics & Technology'
  | 'Shopping - Luxury & High-End'
  | 'Health & Medical'
  | 'Beauty & Personal Care'
  | 'Entertainment & Leisure'
  | 'Travel'
  | 'Bills & Utilities'
  | 'Subscriptions & Digital Services'
  | 'Insurance'
  | 'Education'
  | 'Home & Living'
  | 'Sports & Fitness'
  | 'Pets'
  | 'Family & Kids'
  | 'Financial - Fees & Charges'
  | 'Investments'
  | 'Donations & Charity'
  | 'Government & Taxes'
  | 'Credit Card Payment'
  | 'Refund / Reversal'
  | 'Bank Credits'
  | 'True Income'
  | 'Unknown Incoming'
  | 'Miscellaneous';

interface CategoryRule {
  category: TransactionCategory;
  keywords: string[];
  isIncome?: boolean; // If true, only match positive amounts
  isExpense?: boolean; // If true, only match negative amounts
}

// Categorization rules - easily extendable
const CATEGORY_RULES: CategoryRule[] = [
  // True Income
  {
    category: 'True Income',
    keywords: [
      'salary', 'wage', 'payroll', 'employer', 'payment received',
      'payout', 'commission', 'bonus', 'incentive'
    ],
    isIncome: true,
  },

  // Bank Credits
  {
    category: 'Bank Credits',
    keywords: [
      'cashback', 'rewards', 'reward points', 'promotional credit',
      'interest credit', 'bonus credit', 'promo', 'rebate'
    ],
    isIncome: true,
  },

  // Refund / Reversal
  {
    category: 'Refund / Reversal',
    keywords: [
      'refund', 'reversal', 'cancellation', 'dispute', 'chargeback',
      'void', 'return', 'reimbursement'
    ],
    isIncome: true,
  },

  // Credit Card Payment
  {
    category: 'Credit Card Payment',
    keywords: [
      'card payment', 'credit card', 'ccrd', 'cc payment',
      'transfer to card', 'pay credit card'
    ],
    isExpense: true,
  },

  // Food & Beverage
  {
    category: 'Food & Beverage',
    keywords: [
      'restaurant', 'cafe', 'coffee', 'dining', 'food court',
      'mcdonald', 'kfc', 'starbucks', 'pizza', 'burger',
      'fast food', 'bar', 'pub', 'bakery', 'bistro',
      'diner', 'eatery', 'buffet', 'steakhouse', 'sushi',
      'ramen', 'noodle', 'chicken rice', 'hawker', 'kopitiam'
    ],
  },

  // Groceries
  {
    category: 'Groceries',
    keywords: [
      'supermarket', 'hypermarket', 'grocery', 'market', 'mart',
      'fresh market', 'produce', 'vegetables', 'fruits'
    ],
  },

  // Transport
  {
    category: 'Transport',
    keywords: [
      'uber', 'lyft', 'grab', 'gojek', 'taxi', 'cab',
      'bus', 'train', 'metro', 'mrt', 'lrt', 'subway',
      'transit', 'transport', 'ride', 'fuel', 'petrol',
      'gas station', 'shell', 'bp', 'esso', 'caltex',
      'parking', 'toll', 'erp', 'ez-link', 'car rental'
    ],
  },

  // Shopping - General Retail
  {
    category: 'Shopping - General Retail',
    keywords: [
      'department store', 'variety store', 'retail',
      'convenience store', '7-eleven', 'general store'
    ],
  },

  // Shopping - Fashion & Apparel
  {
    category: 'Shopping - Fashion & Apparel',
    keywords: [
      'clothing', 'apparel', 'fashion', 'shoes', 'footwear',
      'bags', 'accessories', 'jewelry', 'watches',
      'uniqlo', 'h&m', 'zara', 'nike', 'adidas'
    ],
  },

  // Shopping - Electronics & Technology
  {
    category: 'Shopping - Electronics & Technology',
    keywords: [
      'electronics', 'computer', 'laptop', 'phone', 'mobile',
      'tablet', 'appliance', 'tech', 'gadget', 'apple',
      'samsung', 'sony', 'best buy', 'best denki'
    ],
  },

  // Shopping - Luxury & High-End
  {
    category: 'Shopping - Luxury & High-End',
    keywords: [
      'luxury', 'designer', 'boutique', 'louis vuitton',
      'gucci', 'prada', 'chanel', 'rolex', 'cartier',
      'high-end', 'premium brand'
    ],
  },

  // Health & Medical
  {
    category: 'Health & Medical',
    keywords: [
      'hospital', 'clinic', 'doctor', 'medical', 'pharmacy',
      'medicine', 'prescription', 'health', 'dental', 'dentist',
      'optician', 'optical', 'healthcare', 'lab test'
    ],
  },

  // Beauty & Personal Care
  {
    category: 'Beauty & Personal Care',
    keywords: [
      'salon', 'hair', 'nail', 'spa', 'massage', 'facial',
      'beauty', 'cosmetics', 'skincare', 'makeup', 'barber',
      'manicure', 'pedicure', 'treatment'
    ],
  },

  // Entertainment & Leisure
  {
    category: 'Entertainment & Leisure',
    keywords: [
      'cinema', 'movie', 'theater', 'concert', 'show',
      'music', 'game', 'gaming', 'entertainment',
      'amusement', 'theme park', 'ticket', 'event',
      'nightlife', 'club', 'karaoke', 'bowling'
    ],
  },

  // Travel
  {
    category: 'Travel',
    keywords: [
      'hotel', 'airbnb', 'hostel', 'resort', 'accommodation',
      'flight', 'airline', 'airport', 'travel', 'vacation',
      'tour', 'booking', 'expedia', 'agoda', 'tourist'
    ],
  },

  // Bills & Utilities
  {
    category: 'Bills & Utilities',
    keywords: [
      'electric', 'electricity', 'water', 'gas bill', 'utility',
      'internet', 'broadband', 'wifi', 'phone bill', 'mobile plan',
      'cable', 'tv subscription'
    ],
  },

  // Subscriptions & Digital Services
  {
    category: 'Subscriptions & Digital Services',
    keywords: [
      'netflix', 'spotify', 'subscription', 'hulu', 'disney',
      'apple music', 'youtube premium', 'cloud storage',
      'software', 'saas', 'online service', 'app subscription',
      'amazon prime', 'membership'
    ],
  },

  // Insurance
  {
    category: 'Insurance',
    keywords: [
      'insurance', 'premium', 'policy', 'coverage',
      'health insurance', 'life insurance', 'motor insurance',
      'travel insurance', 'home insurance'
    ],
  },

  // Education
  {
    category: 'Education',
    keywords: [
      'school', 'university', 'college', 'tuition', 'course',
      'education', 'learning', 'training', 'class',
      'udemy', 'coursera', 'skillshare', 'book', 'textbook'
    ],
  },

  // Home & Living
  {
    category: 'Home & Living',
    keywords: [
      'furniture', 'ikea', 'home decor', 'appliance',
      'home improvement', 'hardware', 'garden', 'plant',
      'renovation', 'interior', 'bedding', 'kitchenware'
    ],
  },

  // Sports & Fitness
  {
    category: 'Sports & Fitness',
    keywords: [
      'gym', 'fitness', 'sports', 'exercise', 'workout',
      'yoga', 'pilates', 'athletic', 'running', 'cycling',
      'swimming', 'training', 'sport equipment'
    ],
  },

  // Pets
  {
    category: 'Pets',
    keywords: [
      'pet', 'veterinary', 'vet', 'animal', 'dog', 'cat',
      'pet food', 'pet shop', 'grooming', 'pet care'
    ],
  },

  // Family & Kids
  {
    category: 'Family & Kids',
    keywords: [
      'baby', 'kids', 'children', 'toy', 'childcare',
      'daycare', 'nursery', 'diaper', 'infant', 'toddler',
      'school supplies', 'stationery'
    ],
  },

  // Financial - Fees & Charges
  {
    category: 'Financial - Fees & Charges',
    keywords: [
      'bank fee', 'atm fee', 'late charge', 'annual fee',
      'service charge', 'processing fee', 'admin fee',
      'currency exchange', 'foreign transaction', 'penalty'
    ],
  },

  // Investments
  {
    category: 'Investments',
    keywords: [
      'brokerage', 'stock', 'investment', 'crypto', 'bitcoin',
      'trading', 'portfolio', 'securities', 'fund', 'etf',
      'dividend', 'capital'
    ],
  },

  // Donations & Charity
  {
    category: 'Donations & Charity',
    keywords: [
      'donation', 'charity', 'non-profit', 'ngo', 'fundraiser',
      'temple', 'church', 'mosque', 'religious', 'tithe',
      'contribute', 'give'
    ],
  },

  // Government & Taxes
  {
    category: 'Government & Taxes',
    keywords: [
      'tax', 'iras', 'government', 'fine', 'penalty',
      'license', 'permit', 'registration', 'customs',
      'duty', 'levy'
    ],
  },
];

// Cache for merchant lookups to avoid repeated API calls
const merchantCache = new Map<string, TransactionCategory>();

/**
 * Categorizes a transaction based on its description and amount
 * @param description - Transaction description
 * @param amount - Transaction amount (negative for expenses, positive for income)
 * @returns The assigned category
 */
export function categorizeTransaction(
  description: string,
  amount: number
): TransactionCategory {
  const lowerDescription = description.toLowerCase();
  const isPositive = amount > 0;

  // Check each rule
  for (const rule of CATEGORY_RULES) {
    // If rule specifies income only, check amount
    if (rule.isIncome && !isPositive) {
      continue;
    }

    // If rule specifies expense only, check amount
    if (rule.isExpense && isPositive) {
      continue;
    }

    // Check if any keyword matches
    for (const keyword of rule.keywords) {
      if (lowerDescription.includes(keyword.toLowerCase())) {
        return rule.category;
      }
    }
  }

  // For positive amounts with no match, categorize as Unknown Incoming
  if (isPositive) {
    return 'Unknown Incoming';
  }

  // Default category for expenses
  return 'Miscellaneous';
}

/**
 * Get all available categories
 */
export function getAllCategories(): TransactionCategory[] {
  return [
    'Food & Beverage',
    'Groceries',
    'Transport',
    'Shopping - General Retail',
    'Shopping - Fashion & Apparel',
    'Shopping - Electronics & Technology',
    'Shopping - Luxury & High-End',
    'Health & Medical',
    'Beauty & Personal Care',
    'Entertainment & Leisure',
    'Travel',
    'Bills & Utilities',
    'Subscriptions & Digital Services',
    'Insurance',
    'Education',
    'Home & Living',
    'Sports & Fitness',
    'Pets',
    'Family & Kids',
    'Financial - Fees & Charges',
    'Investments',
    'Donations & Charity',
    'Government & Taxes',
    'Credit Card Payment',
    'Refund / Reversal',
    'Bank Credits',
    'True Income',
    'Unknown Incoming',
    'Miscellaneous',
  ];
}

/**
 * Get category color for visualization
 */
export function getCategoryColor(category: TransactionCategory | string): string {
  const colors: Record<string, string> = {
    'Food & Beverage': '#FF6B6B',
    'Groceries': '#FF8C94',
    'Transport': '#4ECDC4',
    'Shopping - General Retail': '#45B7D1',
    'Shopping - Fashion & Apparel': '#A29BFE',
    'Shopping - Electronics & Technology': '#74B9FF',
    'Shopping - Luxury & High-End': '#FD79A8',
    'Health & Medical': '#FF8C94',
    'Beauty & Personal Care': '#FDCB6E',
    'Entertainment & Leisure': '#A8E6CF',
    'Travel': '#FFD93D',
    'Bills & Utilities': '#FFA07A',
    'Subscriptions & Digital Services': '#DFE6E9',
    'Insurance': '#6C5CE7',
    'Education': '#0984E3',
    'Home & Living': '#00B894',
    'Sports & Fitness': '#00CEC9',
    'Pets': '#FFEAA7',
    'Family & Kids': '#FAB1A0',
    'Financial - Fees & Charges': '#636E72',
    'Investments': '#2D3436',
    'Donations & Charity': '#55EFC4',
    'Government & Taxes': '#B2BEC3',
    'Credit Card Payment': '#95A5A6',
    'Refund / Reversal': '#55EFC4',
    'Bank Credits': '#74B9FF',
    'True Income': '#00B894',
    'Unknown Incoming': '#DFE6E9',
    'Miscellaneous': '#95A5A6',
    // Lowercase mappings for AI-parsed categories
    'dining': '#FF6B6B',
    'food': '#FF6B6B',
    'transport': '#4ECDC4',
    'shopping': '#45B7D1',
    'entertainment': '#A8E6CF',
    'groceries': '#FF8C94',
    'other': '#95A5A6',
  };

  return colors[category] || colors['Miscellaneous'];
}
