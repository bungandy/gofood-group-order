import { CURRENCY } from '@/constants';

/**
 * Format currency in Indonesian Rupiah
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString(CURRENCY.LOCALE);
};

/**
 * Format date and time for Indonesian locale
 */
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format time only for Indonesian locale
 */
export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Generate a random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Debounce function to limit rapid function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Validate GoFood URL format
 */
export const isValidGofoodUrl = (url: string): boolean => {
  try {
    const gofoodPattern = /^https:\/\/gofood\.co\.id\/[^\/]+\/restaurant\/[^\/]+-[a-f0-9-]{36}$/i;
    return gofoodPattern.test(url);
  } catch {
    return false;
  }
};

/**
 * Extract restaurant ID from GoFood URL
 */
export const extractRestaurantId = (url: string): string | null => {
  try {
    const urlPattern = /\/restaurant\/[^\/]*-([a-f0-9-]{36})$/i;
    const match = url.match(urlPattern);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting restaurant ID:', error);
    return null;
  }
};

/**
 * Calculate total from order items
 */
export const calculateOrderTotal = (items: Array<{ menuItem: { price: number }; quantity: number }>): number => {
  return items.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
};

/**
 * Group orders by merchant
 */
export const groupOrdersByMerchant = <T extends { items: Array<{ menuItem: { merchantId: string } }> }>(
  orders: T[],
  merchants: Array<{ id: string; name: string }>
): Record<string, T[]> => {
  return orders.reduce((acc, order) => {
    order.items.forEach(item => {
      const merchantId = item.menuItem.merchantId;
      const merchant = merchants.find(m => m.id === merchantId);
      const merchantName = merchant?.name || 'Unknown Merchant';
      
      if (!acc[merchantName]) {
        acc[merchantName] = [];
      }
      
      // Check if order already exists for this merchant
      let existingOrder = acc[merchantName].find(o => (o as any).id === (order as any).id);
      if (!existingOrder) {
        existingOrder = { ...order, items: [] };
        acc[merchantName].push(existingOrder);
      }
      
      // Add item to the order
      existingOrder.items.push(item);
    });
    return acc;
  }, {} as Record<string, T[]>);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Validate form fields
 */
export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validate minimum length
 */
export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

/**
 * Validate maximum length
 */
export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
}; 