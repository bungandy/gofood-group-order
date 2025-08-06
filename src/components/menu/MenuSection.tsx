import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MenuItem, Merchant } from '@/types';
import { MenuService, type MenuCategory } from '@/services/menuService';
import { MenuItemCard } from './MenuItemCard';
import { UI_CONFIG } from '@/constants';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface MenuSectionProps {
  merchants: Merchant[];
  sessionId?: string;
  getItemQuantity: (itemId: string) => number;
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (itemId: string) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  merchants,
  sessionId,
  getItemQuantity,
  onAddToCart,
  onRemoveFromCart
}) => {
  const [expandedMerchants, setExpandedMerchants] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [merchantMenus, setMerchantMenus] = useState<Record<string, MenuCategory[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMenuData = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { menuData } = await MenuService.getMerchantData(sessionId);
        setMerchantMenus(menuData);
      } catch (error) {
        console.error('Error loading menu data:', error);
        setMerchantMenus({});
      } finally {
        setLoading(false);
      }
    };

    loadMenuData();
  }, [sessionId]);

  const toggleMerchantExpansion = (merchantId: string) => {
    setExpandedMerchants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(merchantId)) {
        newSet.delete(merchantId);
      } else {
        newSet.add(merchantId);
      }
      return newSet;
    });
  };

  const toggleCategoryExpansion = (categoryKey: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="py-8">
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
          <p className="text-center text-muted-foreground mt-4">Memuat menu...</p>
        </CardContent>
      </Card>
    );
  }

  if (merchants.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <p>Tidak ada merchant tersedia</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {merchants.map((merchant, index) => {
        const menuCategories = merchantMenus[merchant.id] || [];
        const isExpanded = expandedMerchants.has(merchant.id);
        const totalItems = menuCategories.reduce((sum, category) => sum + category.items.length, 0);
        const shouldShowExpansion = totalItems > UI_CONFIG.MERCHANT_EXPANSION_THRESHOLD;
        
        return (
          <Card key={merchant.id} className="bg-white/80 backdrop-blur-sm animate-fade-in">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-primary flex gap-2">
                  {merchants.length > 1 && (
                    <div className="mt-1 h-6 aspect-square bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                  )}
                  <div className='flex-grow text-xl'>
                  {merchant.name}
                  </div>
                </CardTitle>
                
                {/* Expand/collapse button next to merchant name */}
                {shouldShowExpansion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMerchantExpansion(merchant.id)}
                    className="ml-2 p-1 h-8 w-8 rounded-full hover:bg-primary/10"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
              
              <CardDescription>
                {menuCategories.length > 0 ? 
                  `${menuCategories.length} kategori, ${totalItems} menu tersedia` : 
                  'Menu belum tersedia'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {menuCategories.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>Menu untuk merchant ini belum tersedia.</p>
                  <p className="text-sm mt-2">Data menu akan dimuat otomatis setelah merchant menambahkan link GoFood.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {menuCategories.map((category, categoryIndex) => {
                    const categoryKey = `${merchant.id}-${categoryIndex}`;
                    const isCategoryExpanded = expandedCategories.has(categoryKey);
                    const shouldShowCategoryExpansion = category.items.length > UI_CONFIG.MAX_VISIBLE_ITEMS;
                    const visibleItems = shouldShowCategoryExpansion && !isCategoryExpanded 
                      ? category.items.slice(0, UI_CONFIG.MAX_VISIBLE_ITEMS)
                      : category.items;

                    // Don't show collapsed categories when merchant is collapsed
                    if (shouldShowExpansion && !isExpanded && categoryIndex >= 1) {
                      return null;
                    }

                    return (
                      <div key={categoryKey} className="space-y-3">
                        {/* Category Title */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{category.title}</h3>
                          {shouldShowCategoryExpansion && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCategoryExpansion(categoryKey)}
                              className="text-xs text-muted-foreground hover:text-primary"
                            >
                              {isCategoryExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3 mr-1" />
                                  Sembunyikan
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3 mr-1" />
                                  Lihat Semua ({category.items.length})
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        
                        {/* Category Items */}
                        <div className="relative">
                          <div className="grid gap-3">
                            {visibleItems.map(item => (
                              <MenuItemCard
                                key={item.id}
                                item={item}
                                quantity={getItemQuantity(item.id)}
                                onAdd={() => onAddToCart(item)}
                                onRemove={() => onRemoveFromCart(item.id)}
                              />
                            ))}
                          </div>
                          
                          {/* Gradient fade effect when category is collapsed */}
                          {shouldShowCategoryExpansion && !isCategoryExpanded && (
                            <div className="relative">
                              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Merchant Expand/Collapse Button */}
                  {shouldShowExpansion && (
                    <div className="flex justify-center mt-6 pt-4 border-t border-gray-100">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleMerchantExpansion(merchant.id)}
                        className="bg-white/80 backdrop-blur-sm hover-scale"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Tampilkan Lebih Sedikit
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Tampilkan Semua Kategori ({menuCategories.length - 1} lainnya)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}; 