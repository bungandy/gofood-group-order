// Core application types

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  merchantId: string;
  image?: string;
  category?: string;
}

export interface Merchant {
  id: string;
  name: string;
  link: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  notes?: string;
  total: number;
  timestamp: string;
}

export interface SessionData {
  sessionId: string;
  sessionName: string;
  merchants: Merchant[];
}

// GoFood API types - Based on actual API response structure
export interface GofoodMenuItem {
  id: string;
  shopping_item_id: number;
  restaurant_id: string;
  name: string;
  price: number;
  description: string;
  active: boolean;
  is_liked: boolean;
  image?: string;
  weight: number;
  time_zone: string;
  variant_category_ids?: string[];
  variant_categories?: GofoodVariantCategory[];
  operational_hours?: any;
}

export interface GofoodVariantCategory {
  id: string;
  name: string;
  rules: {
    selection: {
      type: string;
      required: boolean;
      min_quantity: number;
      max_quantity: number;
      text: string;
    };
  };
  variants: GofoodVariant[];
}

export interface GofoodVariant {
  id: string;
  name: string;
  price: number;
  in_stock: boolean;
}

export interface GofoodCard {
  card_id: string;
  card_template: string;
  card_type: number;
  card_priority: number;
  navigation?: {
    title: string;
  };
  content: {
    title: string;
    is_searchable?: boolean;
    is_active?: boolean;
    is_likable?: boolean;
    restaurant?: {
      id: string;
      name: string;
      brand?: {
        id: string;
        name: string;
      };
      active: boolean;
      address: string;
      location: string;
      partner: boolean;
      pickup_enabled: boolean;
      merchant_acceptance?: {
        enabled: boolean;
        auto_accept: boolean;
      };
      open_status?: {
        code: string;
      };
    };
    items?: GofoodMenuItem[];
  };
}

export interface GofoodMerchantData {
  success: boolean;
  data: {
    page: {
      title: string;
      share: {
        url: string;
        restaurant: {
          id: string;
          name: string;
          active: boolean;
          image: string;
          cuisines: string;
          partner: boolean;
          pickup_enabled: boolean;
        };
      };
      restaurant_detail: {
        id: string;
        name: string;
        brand?: {
          id: string;
          name: string;
        };
        short_link: string;
        active: boolean;
        cuisines: string;
        address: string;
        location: string;
        partner: boolean;
        multi_operational_hours: any[];
        is_bookmarked: boolean;
      };
    };
    cards: GofoodCard[];
  };
}

// Hook return types
export interface UseOrdersReturn {
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'timestamp'>) => Promise<void>;
  updateOrder: (id: string, orderData: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  isConnected?: boolean;
  refreshConnection?: () => void;
  refetch: () => void;
}

// Form types
export interface OrderFormData {
  customerName: string;
  notes?: string;
  items: OrderItem[];
  total: number;
} 