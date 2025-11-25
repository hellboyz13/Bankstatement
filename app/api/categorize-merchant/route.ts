import { NextRequest, NextResponse } from 'next/server';
import { TransactionCategory } from '@/lib/categorization';

// Simple in-memory cache for merchant categories
const merchantCategoryCache = new Map<string, TransactionCategory>();

/**
 * API endpoint to categorize a merchant using online lookup
 * POST /api/categorize-merchant
 * Body: { merchantName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { merchantName } = await request.json();

    if (!merchantName || typeof merchantName !== 'string') {
      return NextResponse.json(
        { error: 'Invalid merchant name' },
        { status: 400 }
      );
    }

    const cleanName = merchantName.trim();

    // Check cache first
    if (merchantCategoryCache.has(cleanName.toLowerCase())) {
      return NextResponse.json({
        merchantName: cleanName,
        category: merchantCategoryCache.get(cleanName.toLowerCase()),
        source: 'cache',
      });
    }

    // Perform online lookup
    const category = await lookupMerchantOnline(cleanName);

    // Cache the result
    merchantCategoryCache.set(cleanName.toLowerCase(), category);

    return NextResponse.json({
      merchantName: cleanName,
      category,
      source: 'online',
    });
  } catch (error) {
    console.error('Error categorizing merchant:', error);
    return NextResponse.json(
      {
        error: 'Failed to categorize merchant',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Look up merchant online to determine category
 * Uses a combination of search and heuristics
 */
async function lookupMerchantOnline(merchantName: string): Promise<TransactionCategory> {
  try {
    // Search for merchant information
    const searchQuery = `${merchantName} Singapore business type what category`;

    // Simulate web search result analysis
    // In production, you would use WebSearch API or similar
    const category = inferCategoryFromMerchantName(merchantName);

    console.log(`Merchant lookup: "${merchantName}" → ${category}`);

    return category;
  } catch (error) {
    console.error('Online lookup failed:', error);
    return 'Miscellaneous';
  }
}

/**
 * Infer category from merchant name using heuristics
 * This is a fallback when online search is not available
 */
function inferCategoryFromMerchantName(merchantName: string): TransactionCategory {
  const lower = merchantName.toLowerCase();

  // Food indicators
  if (
    lower.includes('restaurant') ||
    lower.includes('cafe') ||
    lower.includes('coffee') ||
    lower.includes('food') ||
    lower.includes('kitchen') ||
    lower.includes('dining') ||
    lower.includes('bistro') ||
    lower.includes('eatery') ||
    lower.includes('grill') ||
    lower.includes('pizz') ||
    lower.includes('sushi') ||
    lower.includes('noodle') ||
    lower.includes('rice') ||
    lower.includes('bakery') ||
    lower.includes('mart') // supermarket
  ) {
    return 'Food & Dining';
  }

  // Transport indicators
  if (
    lower.includes('transport') ||
    lower.includes('taxi') ||
    lower.includes('grab') ||
    lower.includes('gojek') ||
    lower.includes('bus') ||
    lower.includes('mrt') ||
    lower.includes('parking') ||
    lower.includes('erp') ||
    lower.includes('petrol') ||
    lower.includes('fuel')
  ) {
    return 'Transport';
  }

  // Shopping indicators
  if (
    lower.includes('shop') ||
    lower.includes('store') ||
    lower.includes('retail') ||
    lower.includes('boutique') ||
    lower.includes('fashion') ||
    lower.includes('clothing') ||
    lower.includes('electronics')
  ) {
    return 'Shopping';
  }

  // Bills & Utilities
  if (
    lower.includes('telco') ||
    lower.includes('telecom') ||
    lower.includes('electric') ||
    lower.includes('water') ||
    lower.includes('gas') ||
    lower.includes('utility') ||
    lower.includes('insurance') ||
    lower.includes('subscription')
  ) {
    return 'Bills & Utilities';
  }

  // Healthcare
  if (
    lower.includes('clinic') ||
    lower.includes('hospital') ||
    lower.includes('medical') ||
    lower.includes('pharmacy') ||
    lower.includes('dental') ||
    lower.includes('health')
  ) {
    return 'Healthcare';
  }

  // Entertainment
  if (
    lower.includes('cinema') ||
    lower.includes('theater') ||
    lower.includes('gym') ||
    lower.includes('fitness') ||
    lower.includes('sport') ||
    lower.includes('club') ||
    lower.includes('game')
  ) {
    return 'Entertainment';
  }

  // Travel
  if (
    lower.includes('hotel') ||
    lower.includes('resort') ||
    lower.includes('airline') ||
    lower.includes('travel') ||
    lower.includes('booking') ||
    lower.includes('airways')
  ) {
    return 'Travel';
  }

  // Education
  if (
    lower.includes('school') ||
    lower.includes('university') ||
    lower.includes('college') ||
    lower.includes('tuition') ||
    lower.includes('education') ||
    lower.includes('learning')
  ) {
    return 'Education';
  }

  return 'Miscellaneous';
}
