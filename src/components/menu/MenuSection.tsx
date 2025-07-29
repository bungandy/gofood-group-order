import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MenuItem, Merchant } from '@/types';
import { MenuService } from '@/services/menuService';
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
  const [merchantMenus, setMerchantMenus] = useState<Record<string, MenuItem[]>>({});
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
        const menuItems = merchantMenus[merchant.id] || [];
        const isExpanded = expandedMerchants.has(merchant.id);
        const shouldShowExpansion = merchants.length > 1 && menuItems.length > UI_CONFIG.MERCHANT_EXPANSION_THRESHOLD;
        const visibleItems = shouldShowExpansion && !isExpanded 
          ? menuItems.slice(0, UI_CONFIG.MAX_VISIBLE_ITEMS)
          : menuItems;

        return (
          <Card key={merchant.id} className="bg-white/80 backdrop-blur-sm animate-fade-in">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-primary flex items-center gap-2">
                  {merchants.length > 1 && (
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                  )}
                  {merchant.name}
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
                {menuItems.length > 0 ? `${menuItems.length} menu tersedia` : 'Menu belum tersedia'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {menuItems.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>Menu untuk merchant ini belum tersedia.</p>
                  <p className="text-sm mt-2">Data menu akan dimuat otomatis setelah merchant menambahkan link GoFood.</p>
                </div>
              ) : (
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
                  
                  {/* Gradient fade effect when collapsed */}
                  {shouldShowExpansion && !isExpanded && (
                    <div className="relative">
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
                    </div>
                  )}
                  
                  {/* Expand/Collapse Button - Hide on mobile when header button is available */}
                  {shouldShowExpansion && (
                    <div className="flex justify-center mt-4">
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
                            Tampilkan Semua ({menuItems.length - UI_CONFIG.MAX_VISIBLE_ITEMS} lainnya)
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