import type { MenuItem, Merchant } from '@/types';

// Mock menu data - in a real app, this would come from an API
const MERCHANT_MENUS: Record<string, MenuItem[]> = {
  merchant_1: [
    {
      id: 'merchant_1_1',
      name: 'Nasi Gudeg Komplit',
      price: 25000,
      description: 'Nasi putih, gudeg, ayam, telur, tahu, tempe',
      merchantId: 'merchant_1'
    },
    {
      id: 'merchant_1_2',
      name: 'Gudeg Ayam',
      price: 20000,
      description: 'Gudeg dengan ayam kampung',
      merchantId: 'merchant_1'
    },
    {
      id: 'merchant_1_3',
      name: 'Gudeg Telur',
      price: 15000,
      description: 'Gudeg dengan telur puyuh',
      merchantId: 'merchant_1'
    },
    {
      id: 'merchant_1_4',
      name: 'Sambal Krecek',
      price: 8000,
      description: 'Sambal krecek khas Yogya',
      merchantId: 'merchant_1'
    },
    {
      id: 'merchant_1_5',
      name: 'Es Teh Manis',
      price: 5000,
      description: 'Minuman segar es teh manis',
      merchantId: 'merchant_1'
    },
    {
      id: 'merchant_1_6',
      name: 'Es Jeruk',
      price: 8000,
      description: 'Minuman segar es jeruk peras',
      merchantId: 'merchant_1'
    }
  ],
  merchant_2: [
    {
      id: 'merchant_2_1',
      name: 'Ayam Geprek Original',
      price: 18000,
      description: 'Ayam geprek dengan sambal level 1-5',
      merchantId: 'merchant_2'
    },
    {
      id: 'merchant_2_2',
      name: 'Ayam Geprek Keju',
      price: 22000,
      description: 'Ayam geprek dengan keju mozarella',
      merchantId: 'merchant_2'
    },
    {
      id: 'merchant_2_3',
      name: 'Ayam Geprek Jumbo',
      price: 28000,
      description: 'Ayam geprek porsi jumbo',
      merchantId: 'merchant_2'
    },
    {
      id: 'merchant_2_4',
      name: 'Nasi Putih',
      price: 5000,
      description: 'Nasi putih hangat',
      merchantId: 'merchant_2'
    },
    {
      id: 'merchant_2_5',
      name: 'Es Teh',
      price: 3000,
      description: 'Es teh manis segar',
      merchantId: 'merchant_2'
    },
    {
      id: 'merchant_2_6',
      name: 'Es Jeruk',
      price: 5000,
      description: 'Es jeruk segar',
      merchantId: 'merchant_2'
    }
  ],
  merchant_3: [
    {
      id: 'merchant_3_1',
      name: 'Bakso Solo Special',
      price: 20000,
      description: 'Bakso daging sapi dengan mie dan pangsit',
      merchantId: 'merchant_3'
    },
    {
      id: 'merchant_3_2',
      name: 'Bakso Urat',
      price: 18000,
      description: 'Bakso urat kenyal dengan kuah gurih',
      merchantId: 'merchant_3'
    },
    {
      id: 'merchant_3_3',
      name: 'Mie Ayam Bakso',
      price: 15000,
      description: 'Mie ayam dengan bakso daging',
      merchantId: 'merchant_3'
    },
    {
      id: 'merchant_3_4',
      name: 'Pangsit Goreng',
      price: 12000,
      description: 'Pangsit goreng isi ayam',
      merchantId: 'merchant_3'
    },
    {
      id: 'merchant_3_5',
      name: 'Es Campur',
      price: 8000,
      description: 'Es campur segar',
      merchantId: 'merchant_3'
    },
    {
      id: 'merchant_3_6',
      name: 'Es Kelapa Muda',
      price: 10000,
      description: 'Es kelapa muda segar',
      merchantId: 'merchant_3'
    }
  ]
};

export class MenuService {
  /**
   * Get all menu items for given merchants
   */
  static getAllMenuItems(merchants: Merchant[]): MenuItem[] {
    const allItems: MenuItem[] = [];
    merchants.forEach(merchant => {
      const merchantMenus = MERCHANT_MENUS[merchant.id] || [];
      allItems.push(...merchantMenus);
    });
    return allItems;
  }

  /**
   * Get menu items for a specific merchant
   */
  static getMenuItemsByMerchant(merchantId: string): MenuItem[] {
    return MERCHANT_MENUS[merchantId] || [];
  }

  /**
   * Find a menu item by ID
   */
  static findMenuItemById(itemId: string): MenuItem | null {
    for (const merchantMenus of Object.values(MERCHANT_MENUS)) {
      const item = merchantMenus.find(item => item.id === itemId);
      if (item) return item;
    }
    return null;
  }

  /**
   * Search menu items by name
   */
  static searchMenuItems(query: string, merchants: Merchant[]): MenuItem[] {
    const allItems = this.getAllMenuItems(merchants);
    const lowercaseQuery = query.toLowerCase();
    
    return allItems.filter(item => 
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.description?.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get menu categories for a merchant
   */
  static getMenuCategories(merchantId: string): string[] {
    const items = this.getMenuItemsByMerchant(merchantId);
    const categories = new Set<string>();
    
    items.forEach(item => {
      // Simple categorization based on item name
      if (item.name.toLowerCase().includes('es') || item.name.toLowerCase().includes('minuman')) {
        categories.add('Minuman');
      } else if (item.name.toLowerCase().includes('nasi') || item.name.toLowerCase().includes('gudeg')) {
        categories.add('Makanan Utama');
      } else if (item.name.toLowerCase().includes('sambal') || item.name.toLowerCase().includes('krecek')) {
        categories.add('Pelengkap');
      } else {
        categories.add('Lainnya');
      }
    });
    
    return Array.from(categories);
  }

  /**
   * Filter menu items by category
   */
  static filterByCategory(merchantId: string, category: string): MenuItem[] {
    const items = this.getMenuItemsByMerchant(merchantId);
    
    return items.filter(item => {
      const itemCategory = this.getCategoryForItem(item);
      return itemCategory === category;
    });
  }

  /**
   * Get category for a specific item
   */
  private static getCategoryForItem(item: MenuItem): string {
    if (item.name.toLowerCase().includes('es') || item.name.toLowerCase().includes('minuman')) {
      return 'Minuman';
    } else if (item.name.toLowerCase().includes('nasi') || item.name.toLowerCase().includes('gudeg')) {
      return 'Makanan Utama';
    } else if (item.name.toLowerCase().includes('sambal') || item.name.toLowerCase().includes('krecek')) {
      return 'Pelengkap';
    } else {
      return 'Lainnya';
    }
  }
} 