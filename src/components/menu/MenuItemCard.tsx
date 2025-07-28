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
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
      <div className="flex-1">
        <h4 className="font-medium">{item.name}</h4>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <p className="font-medium text-primary mt-1">
          Rp {formatCurrency(item.price)}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRemove} 
          disabled={quantity === 0} 
          className="hover-scale"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="w-8 text-center font-medium">{quantity}</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAdd} 
          className="hover-scale"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}); 