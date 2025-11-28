// Transaction categorization logic
// Uses keyword-based rules to assign globally-applicable categories

export type TransactionCategory =
  // Spending Categories
  | 'Food & Beverage'
  | 'Groceries'
  | 'Transport'
  | 'Shopping – General Retail'
  | 'Shopping – Fashion & Apparel'
  | 'Shopping – Electronics & Technology'
  | 'Shopping – Luxury & High-End'
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
  | 'Financial – Fees & Charges'
  | 'Investments'
  | 'Donations & Charity'
  | 'Government & Taxes'
  // Credit-related Categories
  | 'Credit Card Payment'
  | 'Refund / Reversal'
  | 'Bank Credits'
  | 'True Income'
  | 'Unknown Incoming'
  | 'Miscellaneous / Others';

interface CategoryRule {
  category: TransactionCategory;
  keywords: string[];
  isIncome?: boolean; // If true, only match positive amounts
  excludeKeywords?: string[]; // Exclude if these keywords are present
}

// Global categorization rules - NO country-specific brands or local merchants
const CATEGORY_RULES: CategoryRule[] = [
  // CREDIT-RELATED CATEGORIES (check these first)
  {
    category: 'Credit Card Payment',
    keywords: [
      'card payment', 'credit card payment', 'cc payment', 'payment to card',
      'card balance payment', 'autopay', 'auto payment', 'minimum payment',
      'full payment', 'statement payment'
    ],
  },
  {
    category: 'Refund / Reversal',
    keywords: [
      'refund', 'reversal', 'cancelled', 'cancellation', 'dispute resolved',
      'chargeback', 'void', 'return', 'credit adjustment'
    ],
  },
  {
    category: 'Bank Credits',
    keywords: [
      'cashback', 'cash back', 'reward', 'bonus', 'promotional credit',
      'interest credit', 'rebate', 'points redemption', 'miles redemption'
    ],
    isIncome: true,
  },
  {
    category: 'True Income',
    keywords: [
      'salary', 'wage', 'payroll', 'employer', 'business income',
      'freelance payment', 'commission', 'dividend', 'rental income',
      'payout', 'p2p transfer in', 'person to person'
    ],
    isIncome: true,
  },

  // FOOD & BEVERAGE
  {
    category: 'Food & Beverage',
    keywords: [
      'restaurant', 'cafe', 'coffee shop', 'bar', 'pub', 'bistro',
      'bakery', 'fast food', 'food delivery', 'catering', 'diner',
      'eatery', 'dining', 'food court', 'canteen', 'cafeteria'
    ],
  },

  // GROCERIES
  {
    category: 'Groceries',
    keywords: [
      'supermarket', 'grocery', 'hypermarket', 'fresh market',
      'produce', 'organic market', 'farmers market', 'food store'
    ],
  },

  // TRANSPORT
  {
    category: 'Transport',
    keywords: [
      'taxi', 'cab', 'ride share', 'ride-share', 'car hire',
      'fuel', 'petrol', 'gas station', 'petrol station', 'diesel',
      'toll', 'parking', 'car park', 'vehicle service', 'car service',
      'car rental', 'auto repair', 'mechanic', 'tire', 'tyre',
      'public transport', 'metro', 'subway', 'bus', 'train', 'railway',
      'transit', 'transport card', 'transport pass'
    ],
  },

  // SHOPPING - GENERAL RETAIL
  {
    category: 'Shopping – General Retail',
    keywords: [
      'department store', 'variety store', 'convenience store',
      'general store', 'retail shop', 'discount store', 'wholesale'
    ],
  },

  // SHOPPING - FASHION & APPAREL
  {
    category: 'Shopping – Fashion & Apparel',
    keywords: [
      'clothing', 'fashion', 'apparel', 'shoes', 'footwear',
      'bags', 'handbag', 'accessories', 'jewelry', 'jewellery',
      'boutique', 'tailor', 'alteration'
    ],
    excludeKeywords: ['luxury', 'designer', 'high-end', 'premium brand'],
  },

  // SHOPPING - ELECTRONICS
  {
    category: 'Shopping – Electronics & Technology',
    keywords: [
      'electronics', 'computer', 'laptop', 'mobile phone', 'smartphone',
      'tablet', 'gadget', 'appliance', 'tech store', 'camera',
      'audio', 'headphones', 'smart device', 'wearable'
    ],
  },

  // SHOPPING - LUXURY
  {
    category: 'Shopping – Luxury & High-End',
    keywords: [
      'luxury', 'designer', 'high-end', 'premium brand', 'haute couture',
      'fine jewelry', 'watches', 'luxury boutique', 'exclusive'
    ],
  },

  // HEALTH & MEDICAL
  {
    category: 'Health & Medical',
    keywords: [
      'hospital', 'clinic', 'doctor', 'medical', 'pharmacy',
      'medicine', 'prescription', 'dental', 'dentist', 'orthodontist',
      'optical', 'optician', 'eye care', 'health screening',
      'lab test', 'medical imaging', 'specialist', 'consultation'
    ],
  },

  // BEAUTY & PERSONAL CARE
  {
    category: 'Beauty & Personal Care',
    keywords: [
      'hair salon', 'barber', 'nail salon', 'spa', 'massage',
      'cosmetics', 'skincare', 'beauty', 'facial', 'manicure',
      'pedicure', 'beauty treatment', 'wellness center'
    ],
  },

  // ENTERTAINMENT & LEISURE
  {
    category: 'Entertainment & Leisure',
    keywords: [
      'cinema', 'movie', 'theater', 'theatre', 'concert', 'show',
      'event', 'festival', 'nightclub', 'karaoke', 'gaming',
      'game', 'arcade', 'bowling', 'billiards', 'recreation',
      'theme park', 'amusement park', 'museum', 'gallery',
      'streaming', 'media subscription'
    ],
  },

  // TRAVEL
  {
    category: 'Travel',
    keywords: [
      'airline', 'flight', 'airport', 'hotel', 'accommodation',
      'hostel', 'resort', 'travel agency', 'tour', 'tourism',
      'booking', 'reservation', 'travel insurance', 'attraction',
      'car rental abroad', 'overseas'
    ],
  },

  // BILLS & UTILITIES
  {
    category: 'Bills & Utilities',
    keywords: [
      'electricity', 'electric bill', 'power bill', 'water bill',
      'gas bill', 'utility', 'internet bill', 'broadband',
      'cable tv', 'tv subscription', 'phone bill', 'mobile plan',
      'telecom', 'home services'
    ],
  },

  // SUBSCRIPTIONS & DIGITAL SERVICES
  {
    category: 'Subscriptions & Digital Services',
    keywords: [
      'subscription', 'streaming service', 'cloud storage',
      'software subscription', 'app subscription', 'online service',
      'digital service', 'membership', 'premium account', 'saas'
    ],
  },

  // INSURANCE
  {
    category: 'Insurance',
    keywords: [
      'insurance', 'life insurance', 'health insurance', 'medical insurance',
      'travel insurance', 'car insurance', 'motor insurance', 'home insurance',
      'property insurance', 'premium payment', 'policy payment'
    ],
  },

  // EDUCATION
  {
    category: 'Education',
    keywords: [
      'school', 'university', 'college', 'tuition', 'course',
      'education', 'training', 'workshop', 'seminar', 'certification',
      'online course', 'e-learning', 'educational material',
      'textbook', 'school fees'
    ],
  },

  // HOME & LIVING
  {
    category: 'Home & Living',
    keywords: [
      'furniture', 'home decor', 'interior', 'appliances',
      'home improvement', 'hardware store', 'garden', 'plant',
      'home goods', 'household items', 'kitchenware', 'bedding',
      'home renovation', 'repair', 'maintenance'
    ],
  },

  // SPORTS & FITNESS
  {
    category: 'Sports & Fitness',
    keywords: [
      'gym', 'fitness', 'sports', 'athletic', 'workout',
      'exercise', 'yoga', 'pilates', 'martial arts', 'dance',
      'sports equipment', 'outdoor gear', 'sporting goods',
      'fitness class', 'personal trainer'
    ],
  },

  // PETS
  {
    category: 'Pets',
    keywords: [
      'pet', 'veterinary', 'vet', 'pet shop', 'pet store',
      'pet food', 'pet supplies', 'pet grooming', 'animal clinic',
      'pet care', 'pet hospital'
    ],
  },

  // FAMILY & KIDS
  {
    category: 'Family & Kids',
    keywords: [
      'baby', 'infant', 'children', 'kids', 'toy store', 'toys',
      'childcare', 'daycare', 'nursery', 'baby products',
      'baby supplies', 'children clothing', 'kids store'
    ],
  },

  // FINANCIAL FEES & CHARGES
  {
    category: 'Financial – Fees & Charges',
    keywords: [
      'bank fee', 'service fee', 'transaction fee', 'atm fee',
      'maintenance fee', 'annual fee', 'late fee', 'overdraft fee',
      'foreign exchange', 'currency exchange', 'processing fee',
      'admin fee', 'card fee'
    ],
  },

  // INVESTMENTS
  {
    category: 'Investments',
    keywords: [
      'brokerage', 'stock', 'shares', 'investment', 'crypto',
      'cryptocurrency', 'exchange', 'trading', 'mutual fund',
      'etf', 'bonds', 'securities', 'portfolio'
    ],
  },

  // DONATIONS & CHARITY
  {
    category: 'Donations & Charity',
    keywords: [
      'donation', 'charity', 'non-profit', 'ngo', 'fundraising',
      'contribution', 'religious donation', 'church', 'temple',
      'mosque', 'charitable', 'cause'
    ],
  },

  // GOVERNMENT & TAXES
  {
    category: 'Government & Taxes',
    keywords: [
      'tax', 'income tax', 'property tax', 'government fee',
      'license', 'permit', 'fine', 'penalty', 'court fee',
      'registration', 'government service', 'public service fee'
    ],
  },
];

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

  // Check each rule in order (credit-related categories are first)
  for (const rule of CATEGORY_RULES) {
    // If rule specifies income only, check amount
    if (rule.isIncome && !isPositive) {
      continue;
    }

    // Check if any exclude keyword matches
    if (rule.excludeKeywords) {
      const hasExcluded = rule.excludeKeywords.some(keyword =>
        lowerDescription.includes(keyword.toLowerCase())
      );
      if (hasExcluded) {
        continue;
      }
    }

    // Check if any keyword matches
    for (const keyword of rule.keywords) {
      if (lowerDescription.includes(keyword.toLowerCase())) {
        return rule.category;
      }
    }
  }

  // For positive amounts that didn't match any income category
  if (isPositive) {
    return 'Unknown Incoming';
  }

  // Default category for negative amounts
  return 'Miscellaneous / Others';
}

/**
 * Get all available categories
 */
export function getAllCategories(): TransactionCategory[] {
  return [
    'Food & Beverage',
    'Groceries',
    'Transport',
    'Shopping – General Retail',
    'Shopping – Fashion & Apparel',
    'Shopping – Electronics & Technology',
    'Shopping – Luxury & High-End',
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
    'Financial – Fees & Charges',
    'Investments',
    'Donations & Charity',
    'Government & Taxes',
    'Credit Card Payment',
    'Refund / Reversal',
    'Bank Credits',
    'True Income',
    'Unknown Incoming',
    'Miscellaneous / Others',
  ];
}

/**
 * Get category color for visualization
 */
export function getCategoryColor(category: TransactionCategory | string): string {
  const colors: Record<string, string> = {
    // Spending categories
    'Food & Beverage': '#FF6B6B',
    'Groceries': '#FF8787',
    'Transport': '#4ECDC4',
    'Shopping – General Retail': '#45B7D1',
    'Shopping – Fashion & Apparel': '#96CEB4',
    'Shopping – Electronics & Technology': '#5DADE2',
    'Shopping – Luxury & High-End': '#AF7AC5',
    'Health & Medical': '#FF8C94',
    'Beauty & Personal Care': '#FFB6C1',
    'Entertainment & Leisure': '#A8E6CF',
    'Travel': '#FFD93D',
    'Bills & Utilities': '#FFA07A',
    'Subscriptions & Digital Services': '#DDA0DD',
    'Insurance': '#F4A460',
    'Education': '#6C5CE7',
    'Home & Living': '#98D8C8',
    'Sports & Fitness': '#74B9FF',
    'Pets': '#FDCB6E',
    'Family & Kids': '#FFA8A8',
    'Financial – Fees & Charges': '#95A5A6',
    'Investments': '#6C5B7B',
    'Donations & Charity': '#A8DADC',
    'Government & Taxes': '#778899',
    // Credit-related categories
    'Credit Card Payment': '#95E1D3',
    'Refund / Reversal': '#81C784',
    'Bank Credits': '#66BB6A',
    'True Income': '#4CAF50',
    'Unknown Incoming': '#AED581',
    'Miscellaneous / Others': '#95A5A6',
    // Lowercase/alternative mappings for backward compatibility
    'food & dining': '#FF6B6B',
    'dining': '#FF6B6B',
    'food': '#FF6B6B',
    'transport': '#4ECDC4',
    'shopping': '#45B7D1',
    'entertainment': '#A8E6CF',
    'groceries': '#FF8787',
    'other': '#95A5A6',
    'miscellaneous': '#95A5A6',
  };

  return colors[category] || colors['Miscellaneous / Others'];
}
