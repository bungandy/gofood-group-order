import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import type { MenuItem } from '@/types';
import { formatCurrency } from '@/utils';

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = React.memo(({
  item,
  quantity,
  onAdd,
  onRemove
}) => {
  return (
    <div className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200 hover:shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Menu Item Image */}
        {item.image ? (
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image if failed to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🍽️</span>
          </div>
        )}
        
        {/* Menu Item Details */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <h4 className="font-medium text-sm sm:text-base truncate pr-2">{item.name}</h4>
          {item.description && (
            <p className="text-xs sm:text-sm text-muted-foreground overflow-hidden pr-2" style={{ 
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical' 
            }}>{item.description}</p>
          )}
          <p className="font-medium text-primary mt-1 text-sm sm:text-base truncate pr-2">
            Rp {formatCurrency(item.price)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRemove} 
          disabled={quantity === 0} 
          className="hover-scale h-8 w-8 p-0"
        >
          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
        <span className="w-6 sm:w-8 text-center font-medium text-sm">{quantity}</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAdd} 
          className="hover-scale h-8 w-8 p-0"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>
    </div>
  );
}); 