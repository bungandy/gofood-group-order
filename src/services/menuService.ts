import type { MenuItem, Merchant, GofoodMerchantData, GofoodMenuItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Add new interface for grouped menu items
export interface MenuCategory {
  title: string;
  items: MenuItem[];
}

export class MenuService {
  /**
   * Get merchant data from Supabase including menu items grouped by categories
   */
  static async getMerchantData(sessionId: string): Promise<{ merchants: Merchant[], menuData: Record<string, MenuCategory[]> }> {
    try {
      const { data: merchants, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;

      const merchantsData: Merchant[] = [];
      const menuData: Record<string, MenuCategory[]> = {};

      merchants?.forEach(merchant => {
        // Get merchant name from merchant_data if available, fallback to merchants.name
        let merchantName = merchant.name; // fallback
        if (merchant.merchant_data) {
          const gofoodData = merchant.merchant_data as GofoodMerchantData;
          if (gofoodData.success && gofoodData.data?.page?.restaurant_detail?.name) {
            merchantName = gofoodData.data.page.restaurant_detail.name;
          }
        }

        // Add merchant info
        merchantsData.push({
          id: merchant.merchant_id,
          name: merchantName,
          link: merchant.link
        });

        // Process menu data if available
        if (merchant.merchant_data) {
          const gofoodData = merchant.merchant_data as GofoodMerchantData;
          const menuCategories = this.convertGofoodDataToMenuCategories(gofoodData, merchant.merchant_id);
          menuData[merchant.merchant_id] = menuCategories;
        } else {
          // Fallback to empty array if no merchant data
          menuData[merchant.merchant_id] = [];
        }
      });

      return { merchants: merchantsData, menuData };
    } catch (error) {
      console.error('Error fetching merchant data from Supabase:', error);
      // Return empty data on error
      return { merchants: [], menuData: {} };
    }
  }

  /**
   * Convert GoFood API data to grouped MenuCategory format
   * Groups menu items by navigation.title from data.cards structure
   */
  private static convertGofoodDataToMenuCategories(gofoodData: GofoodMerchantData, merchantId: string): MenuCategory[] {
    const menuCategories: MenuCategory[] = [];

    // Check if the response has the expected structure
    if (!gofoodData.success || !gofoodData.data || !gofoodData.data.cards) {
      console.warn('Invalid GoFood API response structure');
      return menuCategories;
    }

    // Iterate through all cards to find menu item lists
    gofoodData.data.cards.forEach(card => {
      // Only process cards that contain menu items
      if (card.card_template === 'GOFOOD_MENU_ITEM_LIST_V1' && card.content.items) {
        // Use navigation.title for category grouping, fallback to content.title
        const categoryTitle = card.navigation?.title || card.content.title || 'Menu';
        
        const menuItems: MenuItem[] = [];
        card.content.items.forEach(item => {
          // Convert GoFood item to our MenuItem format
          const menuItem = this.convertGofoodItemToMenuItem(item, merchantId, categoryTitle);
          menuItems.push(menuItem);
        });

        // Add category with its items
        if (menuItems.length > 0) {
          menuCategories.push({
            title: categoryTitle,
            items: menuItems
          });
        }
      }
    });

    console.log(`Converted ${menuCategories.length} menu categories for merchant ${merchantId}`);
    return menuCategories;
  }

  /**
   * Convert a single GoFood menu item to MenuItem format
   */
  private static convertGofoodItemToMenuItem(gofoodItem: GofoodMenuItem, merchantId: string, category?: string): MenuItem {
    return {
      id: `${merchantId}_${gofoodItem.id}`,
      name: gofoodItem.name,
      price: gofoodItem.price,
      description: gofoodItem.description,
      merchantId: merchantId,
      image: gofoodItem.image,
      category: category
    };
  }

  /**
   * Get all menu items for given merchants (updated to work with grouped categories)
   */
  static async getAllMenuItems(sessionId: string): Promise<MenuItem[]> {
    const { menuData } = await this.getMerchantData(sessionId);
    const allItems: MenuItem[] = [];
    
    Object.values(menuData).forEach(merchantCategories => {
      merchantCategories.forEach(category => {
        allItems.push(...category.items);
      });
    });
    
    return allItems;
  }

  /**
   * Get menu items for a specific merchant (updated to work with grouped categories)
   */
  static async getMenuItemsByMerchant(sessionId: string, merchantId: string): Promise<MenuItem[]> {
    const { menuData } = await this.getMerchantData(sessionId);
    const merchantCategories = menuData[merchantId] || [];
    const allItems: MenuItem[] = [];
    
    merchantCategories.forEach(category => {
      allItems.push(...category.items);
    });
    
    return allItems;
  }

  /**
   * Find a menu item by ID (updated to work with Supabase data)
   */
  static async findMenuItemById(sessionId: string, itemId: string): Promise<MenuItem | null> {
    const { menuData } = await this.getMerchantData(sessionId);
    
    for (const merchantMenus of Object.values(menuData)) {
      for (const category of merchantMenus) {
        const item = category.items.find(item => item.id === itemId);
        if (item) return item;
      }
    }
    return null;
  }

  /**
   * Search menu items by name (updated to work with Supabase data)
   */
  static async searchMenuItems(sessionId: string, query: string): Promise<MenuItem[]> {
    const allItems = await this.getAllMenuItems(sessionId);
    const lowercaseQuery = query.toLowerCase();
    
    return allItems.filter(item => 
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.description?.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get menu categories for a merchant (updated to return navigation titles)
   */
  static async getMenuCategories(sessionId: string, merchantId: string): Promise<string[]> {
    const { menuData } = await this.getMerchantData(sessionId);
    const merchantCategories = menuData[merchantId] || [];
    
    return merchantCategories.map(category => category.title);
  }

  /**
   * Get grouped menu categories for a merchant
   */
  static async getGroupedMenuCategories(sessionId: string, merchantId: string): Promise<MenuCategory[]> {
    const { menuData } = await this.getMerchantData(sessionId);
    return menuData[merchantId] || [];
  }

  /**
   * Filter menu items by category (updated to work with Supabase data)
   */
  static async filterByCategory(sessionId: string, merchantId: string, category: string): Promise<MenuItem[]> {
    const items = await this.getMenuItemsByMerchant(sessionId, merchantId);
    
    return items.filter(item => {
      // Use the category from GoFood API if available, otherwise use simple categorization
      if (item.category) {
        return item.category === category;
      } else {
        const itemCategory = this.getCategoryForItem(item);
        return itemCategory === category;
      }
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

  // Legacy methods for backward compatibility - these now return empty data since we use Supabase
  /**
   * @deprecated Use getMerchantData instead
   */
  static getAllMenuItems_Legacy(merchants: Merchant[]): MenuItem[] {
    console.warn('getAllMenuItems_Legacy is deprecated. Use getAllMenuItems with sessionId instead.');
    return [];
  }

  /**
   * @deprecated Use getMenuItemsByMerchant instead
   */
  static getMenuItemsByMerchant_Legacy(merchantId: string): MenuItem[] {
    console.warn('getMenuItemsByMerchant_Legacy is deprecated. Use getMenuItemsByMerchant with sessionId instead.');
    return [];
  }
} 