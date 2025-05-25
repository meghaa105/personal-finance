/**
 * Default categories and mappings configuration
 */

export const OTHER_CATEGORY_ID = 'other';
export const INCOME_CATEGORY_ID = 'income';

export const DEFAULT_CATEGORIES = [
  { id: 'clubbing', label: 'Clubbing & Party', icon: '🎉', budget: 5000 },
  { id: 'food_dining', label: 'Food & Dining', icon: '🍽️', budget: 5000 },
  { id: 'groceries', label: 'Groceries', icon: '🛒', budget: 5000 },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', budget: 5000 },
  { id: 'transport', label: 'Transportation', icon: '🚌', budget: 5000 },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', budget: 5000 },
  { id: 'housing', label: 'Housing', icon: '🏠', budget: 5000 },
  { id: 'utilities', label: 'Utilities', icon: '💡', budget: 5000 },
  { id: 'health', label: 'Health', icon: '🏥', budget: 5000 },
  { id: 'education', label: 'Education', icon: '🎓', budget: 5000 },
  { id: 'personal', label: 'Personal', icon: '👤', budget: 5000 },
  { id: 'travel', label: 'Travel', icon: '✈️', budget: 5000 },
  { id: 'income', label: 'Income', icon: '💰', budget: 5000 },
  { id: 'insurance', label: 'Insurance', icon: '🛡️', budget: 5000 },
  { id: 'banking_finance', label: 'Banking & Finance', icon: '🏦', budget: 5000 },
  { id: 'sports_fitness', label: 'Sports & Fitness', icon: '🏃', budget: 5000 },
  { id: 'other', label: 'Other', icon: '⛓️', budget: 5000 }
];

export const DEFAULT_MAPPINGS = {
  'clubbing': ['prism', 'social', 'air live', 'club'],
  'food_dining': ['restaurant', 'cafe', 'swiggy', 'zomato', 'dinner', 'food', 'dining', 'canteen', 'breakfast', 'lunch', 'cafe', 'coffee', 'tea', 'bakery', 'pastry', 'bikanervala'],
  'groceries': ['grocery', 'supermarket', 'dmart', 'kirana', 'instamart', 'blink commerce', 'blinkit', 'zepto'],
  'shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'tatacliq', 'shop', 'store', 'retail', 'clothing', 'apparel', 'snapdeal', 'lenskart', 'croma', 'reliance digital', 'vijay sales', 'lifestyle', 'pantaloons', 'westside', 'mall', 'bazaar'],
  'transport': ['uber', 'ola', 'rapido', 'taxi', 'auto', 'transit', 'train', 'irctc', 'railway', 'metro', 'bus', 'red bus', 'redbus', 'petrol', 'diesel', 'fuel', 'indian oil', 'hp', 'bharat petroleum', 'bpcl', 'toll', 'fastag'],
  'entertainment': ['movie', 'cinema', 'pvr', 'inox', 'bookmyshow', 'theater', 'netflix', 'hotstar', 'disney+', 'amazon prime', 'sony liv', 'zee5', 'jio cinema', 'game', 'gaming', 'concert', 'event'],
  'housing': ['rent', 'lease', 'maintenance', 'society', 'apartment', 'flat', 'property', 'home', 'housing', 'accommodation', 'builder', 'construction', 'repair', 'renovation'],
  'utilities': ['electric', 'electricity', 'bill', 'water', 'internet', 'broadband', 'jio', 'airtel', 'bsnl', 'vi', 'vodafone', 'idea', 'tata sky', 'dth', 'gas', 'lpg', 'indane', 'utility', 'pipeline'],
  'health': ['doctor', 'hospital', 'medical', 'apollo', 'fortis', 'max', 'medanta', 'medplus', 'pharmacy', 'pharmeasy', 'netmeds', 'tata 1mg', 'dental', 'vision', 'healthcare', 'clinic', 'diagnostic', 'lab', 'test', 'medicine', 'ayurvedic'],
  'education': ['tuition', 'school', 'college', 'university', 'education', 'book', 'course', 'byjus', 'unacademy', 'vedantu', 'whitehat', 'cuemath', 'coaching', 'institute', 'academy', 'library', 'learning'],
  'travel': ['travel', 'hotel', 'oyo', 'makemytrip', 'goibibo', 'booking.com', 'cleartrip', 'ixigo', 'trivago', 'airline', 'indigo', 'spicejet', 'vistara', 'air india', 'flight', 'vacation', 'trip', 'tourism', 'resort', 'package', 'goa', 'manali', 'kerala'],
  'insurance': ['insurance', 'policy', 'premium', 'lic', 'health insurance', 'vehicle insurance', 'hdfc ergo', 'bajaj allianz', 'icici lombard', 'max bupa', 'star health', 'new india', 'mutual', 'term', 'life'],
  'banking_finance': ['investment', 'mutual fund', 'stocks', 'shares', 'demat', 'zerodha', 'groww', 'upstox', 'kuvera', 'uti', 'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'sip', 'nps', 'ppf', 'fixed deposit', 'fd', 'nifty', 'sensex'],
  'sports_fitness': ['badminton', 'nvk', 'pullela', 'shuttles', 'baddy']
};