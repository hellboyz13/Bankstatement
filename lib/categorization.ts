// Transaction categorization logic
// Uses keyword-based rules to assign categories to transactions

export type TransactionCategory =
  | 'Food & Dining'
  | 'Transport'
  | 'Shopping'
  | 'Bills & Utilities'
  | 'Salary & Income'
  | 'Healthcare'
  | 'Entertainment'
  | 'Travel'
  | 'Education'
  | 'Transfers'
  | 'Miscellaneous';

interface CategoryRule {
  category: TransactionCategory;
  keywords: string[];
  isIncome?: boolean; // If true, only match positive amounts
}

// Categorization rules - easily extendable
const CATEGORY_RULES: CategoryRule[] = [
  // Income
  {
    category: 'Salary & Income',
    keywords: [
      'salary', 'wage', 'payroll', 'deposit', 'income',
      'payment received', 'transfer from', 'credit interest'
    ],
    isIncome: true,
  },

  // Food & Dining
  {
    category: 'Food & Dining',
    keywords: [
      'restaurant', 'cafe', 'coffee', 'food', 'dining',
      'mcdonald', 'kfc', 'starbucks', 'pizza', 'burger',
      'grocery', 'supermarket', 'market', 'bakery', 'bar',
      'uber eats', 'doordash', 'grubhub', 'deliveroo', 'foodpanda', 'grabfood',
      // Singapore supermarkets & food courts
      'ntuc', 'fairprice', 'cold storage', 'giant', 'sheng siong',
      'food court', 'hawker', 'kopitiam', 'toast box', 'ya kun',
      'old chang kee', 'breadtalk', 'four fingers', 'japanese sushi',
      // Singapore cafes & restaurants
      'swensen', 'astons', 'pastamania', 'subway', 'yoshinoya',
      'ramen', 'sushi', 'dim sum', 'chicken rice'
    ],
  },

  // Transport
  {
    category: 'Transport',
    keywords: [
      'uber', 'lyft', 'taxi', 'cab', 'transport',
      'gas station', 'fuel', 'petrol', 'parking',
      'metro', 'subway', 'bus', 'train', 'railway',
      'shell', 'bp', 'exxon', 'chevron',
      'car wash', 'toll', 'transit',
      // Singapore transport
      'grab', 'gojek', 'comfort', 'citycab', 'trans-cab',
      'mrt', 'lta', 'ez-link', 'simplygo', 'nets flashpay',
      'erp', 'parking.sg', 'smrt', 'sbs transit',
      'esso', 'caltex', 'sinopec', 'shell singapore'
    ],
  },

  // Shopping
  {
    category: 'Shopping',
    keywords: [
      'amazon', 'ebay', 'shop', 'store', 'retail',
      'mall', 'clothing', 'fashion', 'shoes',
      'electronics', 'best buy', 'target', 'costco',
      'home depot', 'ikea', 'furniture', 'online purchase',
      // Singapore shopping
      'lazada', 'shopee', 'qoo10', 'carousell', 'zalora',
      'uniqlo', 'h&m', 'zara', 'cotton on', 'charles & keith',
      'guardian', 'watsons', 'sephora', 'daiso',
      'courts', 'harvey norman', 'best denki', 'gain city',
      'popular', 'kinokuniya', 'toys r us',
      'ikea singapore', 'taobao', 'shein'
    ],
  },

  // Bills & Utilities
  {
    category: 'Bills & Utilities',
    keywords: [
      'electric', 'electricity', 'gas bill', 'water bill',
      'internet', 'phone bill', 'mobile', 'utility',
      'insurance', 'rent', 'mortgage', 'lease',
      'netflix', 'spotify', 'subscription', 'hulu',
      'disney+', 'apple music', 'youtube premium',
      // Singapore utilities & telco
      'sp services', 'spservices', 'pub', 'city gas',
      'singtel', 'starhub', 'm1', 'circles.life', 'gomo',
      'viewqwest', 'myrepublic', 'whizcomms',
      'aia', 'prudential', 'great eastern', 'income',
      'hdb', 'town council', 'conservancy'
    ],
  },

  // Healthcare
  {
    category: 'Healthcare',
    keywords: [
      'pharmacy', 'hospital', 'clinic', 'doctor',
      'medical', 'health', 'dental', 'dentist',
      'cvs', 'walgreens', 'prescription', 'medicine'
    ],
  },

  // Entertainment
  {
    category: 'Entertainment',
    keywords: [
      'cinema', 'movie', 'theater', 'concert',
      'spotify', 'music', 'game', 'gaming',
      'steam', 'playstation', 'xbox', 'nintendo',
      'gym', 'fitness', 'sports', 'club'
    ],
  },

  // Travel
  {
    category: 'Travel',
    keywords: [
      'hotel', 'airbnb', 'booking', 'airline',
      'flight', 'airport', 'travel', 'vacation',
      'expedia', 'hotels.com', 'hostel', 'resort'
    ],
  },

  // Education
  {
    category: 'Education',
    keywords: [
      'school', 'university', 'college', 'tuition',
      'course', 'education', 'book', 'bookstore',
      'udemy', 'coursera', 'skillshare', 'masterclass'
    ],
  },

  // Transfers
  {
    category: 'Transfers',
    keywords: [
      'transfer to', 'transfer from', 'atm withdrawal',
      'atm deposit', 'cash withdrawal', 'venmo',
      'paypal', 'zelle', 'cash app', 'bank transfer'
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

    // Check if any keyword matches
    for (const keyword of rule.keywords) {
      if (lowerDescription.includes(keyword.toLowerCase())) {
        return rule.category;
      }
    }
  }

  // Default category
  return 'Miscellaneous';
}

/**
 * Enhanced categorization with online merchant lookup
 * Uses web search to identify merchant type when keyword matching fails
 * @param description - Transaction description
 * @param amount - Transaction amount
 * @returns The assigned category (with online verification)
 */
export async function categorizeTransactionEnhanced(
  description: string,
  amount: number
): Promise<TransactionCategory> {
  // First try keyword-based categorization
  const keywordCategory = categorizeTransaction(description, amount);

  // If we get a confident match (not Miscellaneous), return it
  if (keywordCategory !== 'Miscellaneous') {
    return keywordCategory;
  }

  // Check cache first
  const cacheKey = description.toLowerCase().trim();
  if (merchantCache.has(cacheKey)) {
    return merchantCache.get(cacheKey)!;
  }

  // Extract merchant name from description
  // Remove common patterns: dates, transaction IDs, locations
  const merchantName = extractMerchantName(description);

  if (!merchantName) {
    return 'Miscellaneous';
  }

  // Look up merchant online
  try {
    const category = await lookupMerchantCategory(merchantName);
    merchantCache.set(cacheKey, category);
    return category;
  } catch (error) {
    console.error('Merchant lookup failed:', error);
    return 'Miscellaneous';
  }
}

/**
 * Extract merchant name from transaction description
 * Removes transaction IDs, reference numbers, and extra info
 */
function extractMerchantName(description: string): string {
  let clean = description;

  // Remove reference numbers
  clean = clean.replace(/Ref No\.\s*:\s*\d+/gi, '');
  clean = clean.replace(/\d{10,}/g, ''); // Remove long numbers (IDs)

  // Remove country/location info at the end
  clean = clean.replace(/\s+(SINGAPORE|SG|SGP)$/i, '');

  // Remove extra whitespace
  clean = clean.trim().replace(/\s+/g, ' ');

  // Take first part (usually merchant name)
  const parts = clean.split(/[\*\/]/);
  clean = parts[0].trim();

  return clean;
}

/**
 * Look up merchant category using web search
 * @param merchantName - Name of the merchant
 * @returns Category based on merchant type
 */
async function lookupMerchantCategory(merchantName: string): Promise<TransactionCategory> {
  // This would use WebSearch in a server-side context
  // For now, return Miscellaneous - will be implemented in API route
  return 'Miscellaneous';
}

/**
 * Get all available categories
 */
export function getAllCategories(): TransactionCategory[] {
  return [
    'Food & Dining',
    'Transport',
    'Shopping',
    'Bills & Utilities',
    'Salary & Income',
    'Healthcare',
    'Entertainment',
    'Travel',
    'Education',
    'Transfers',
    'Miscellaneous',
  ];
}

/**
 * Get category color for visualization
 */
export function getCategoryColor(category: TransactionCategory): string {
  const colors: Record<TransactionCategory, string> = {
    'Food & Dining': '#FF6B6B',
    'Transport': '#4ECDC4',
    'Shopping': '#45B7D1',
    'Bills & Utilities': '#FFA07A',
    'Salary & Income': '#95E1D3',
    'Healthcare': '#FF8C94',
    'Entertainment': '#A8E6CF',
    'Travel': '#FFD93D',
    'Education': '#6C5CE7',
    'Transfers': '#A29BFE',
    'Miscellaneous': '#95A5A6',
  };

  return colors[category];
}

/**
 * Future enhancement: LLM-based categorization
 *
 * To integrate Claude API for better categorization:
 *
 * 1. Install Anthropic SDK:
 *    npm install @anthropic-ai/sdk
 *
 * 2. Add environment variable:
 *    ANTHROPIC_API_KEY=your-key-here
 *
 * 3. Implement LLM categorization:
 *
 * import Anthropic from '@anthropic-ai/sdk';
 *
 * export async function categorizeWithLLM(
 *   description: string,
 *   amount: number
 * ): Promise<TransactionCategory> {
 *   const anthropic = new Anthropic({
 *     apiKey: process.env.ANTHROPIC_API_KEY,
 *   });
 *
 *   const message = await anthropic.messages.create({
 *     model: 'claude-3-haiku-20240307',
 *     max_tokens: 50,
 *     messages: [{
 *       role: 'user',
 *       content: `Categorize this transaction into one of these categories:
 *       ${getAllCategories().join(', ')}
 *
 *       Transaction: ${description}
 *       Amount: ${amount}
 *
 *       Reply with ONLY the category name, nothing else.`
 *     }]
 *   });
 *
 *   const category = message.content[0].text.trim();
 *   return category as TransactionCategory;
 * }
 *
 * 4. Use fallback strategy:
 *    - Try LLM categorization first
 *    - Fall back to keyword-based if LLM fails
 *    - Cache results to minimize API calls
 */
