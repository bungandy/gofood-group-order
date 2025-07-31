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
    <div className="flex flex-col sm:flex-row sm:items-center p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
      <div className="flex items-start gap-3 flex-1 min-w-0">
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
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-base leading-tight mb-1">{item.name}</h4>
          {item.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-2 line-clamp-2">
              {item.description}
            </p>
          )}
          <p className="font-medium text-primary text-base">
            Rp {formatCurrency(item.price)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-2 mt-3 sm:mt-0 sm:ml-4 flex-shrink-0">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRemove} 
          disabled={quantity === 0} 
          className="hover-scale h-8 w-8 p-0"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="w-8 text-center font-medium text-sm">{quantity}</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAdd} 
          className="hover-scale h-8 w-8 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}); 