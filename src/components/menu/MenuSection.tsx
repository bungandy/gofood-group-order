import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MenuItem, Merchant } from '@/types';
import { MenuService } from '@/services/menuService';
import { MenuItemCard } from './MenuItemCard';
import { UI_CONFIG } from '@/constants';

interface MenuSectionProps {
  merchants: Merchant[];
  getItemQuantity: (itemId: string) => number;
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (itemId: string) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  merchants,
  getItemQuantity,
  onAddToCart,
  onRemoveFromCart
}) => {
  const [expandedMerchants, setExpandedMerchants] = useState<Set<string>>(new Set());

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
        const merchantMenus = MenuService.getMenuItemsByMerchant(merchant.id);
        const isExpanded = expandedMerchants.has(merchant.id);
        const shouldShowExpansion = merchants.length > 1 && merchantMenus.length > UI_CONFIG.MERCHANT_EXPANSION_THRESHOLD;
        const visibleItems = shouldShowExpansion && !isExpanded 
          ? merchantMenus.slice(0, UI_CONFIG.MAX_VISIBLE_ITEMS)
          : merchantMenus;

        return (
          <Card key={merchant.id} className="bg-white/80 backdrop-blur-sm animate-fade-in">
            <CardHeader className="pb-4">
              <CardTitle className="text-primary flex items-center gap-2">
                {merchants.length > 1 && (
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                )}
                {merchant.name}
              </CardTitle>
              <CardDescription>{merchantMenus.length} menu tersedia</CardDescription>
            </CardHeader>
            <CardContent>
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
                
                {/* Expand/Collapse Button */}
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
                          Tampilkan Semua ({merchantMenus.length - UI_CONFIG.MAX_VISIBLE_ITEMS} lainnya)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}; 