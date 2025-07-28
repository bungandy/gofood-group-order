import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Edit2 } from 'lucide-react';
import type { OrderItem, Merchant } from '@/types';
import { formatCurrency, groupOrdersByMerchant } from '@/utils';

interface OrderFormProps {
  customerName: string;
  notes: string;
  cart: OrderItem[];
  cartTotal: number;
  merchants: Merchant[];
  isEditing: boolean;
  editingOrderName?: string;
  loading: boolean;
  onCustomerNameChange: (name: string) => void;
  onNotesChange: (notes: string) => void;
  onSubmit: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  customerName,
  notes,
  cart,
  cartTotal,
  merchants,
  isEditing,
  editingOrderName,
  loading,
  onCustomerNameChange,
  onNotesChange,
  onSubmit
}) => {
  const groupedCart = React.useMemo(() => {
    if (cart.length === 0) return {};
    
    // Create a mock order to use the grouping utility
    const mockOrder = { id: 'temp', items: cart };
    return groupOrdersByMerchant([mockOrder], merchants);
  }, [cart, merchants]);

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Pesanan Anda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Required Notice */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
            💡 <strong>Nama wajib diisi</strong> untuk menambahkan pesanan ke grup order
          </AlertDescription>
        </Alert>
        
        {/* Edit Notice */}
        {isEditing && editingOrderName && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <Edit2 className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 font-medium">
              ⚠️ Anda sedang mengubah pesanan atas nama <strong>{editingOrderName}</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Customer Name Input */}
        <div className="space-y-2">
          <Label htmlFor="customer-name">Nama Pemesan</Label>
          <Input 
            id="customer-name" 
            placeholder="Masukkan nama Anda" 
            value={customerName} 
            onChange={(e) => onCustomerNameChange(e.target.value)} 
          />
        </div>

        {/* Cart Items Display */}
        {cart.length > 0 && (
          <div className="space-y-2">
            <Label>Item yang dipilih:</Label>
            <div className="space-y-3">
              {Object.entries(groupedCart).map(([merchantName, orders]) => {
                if (!orders || orders.length === 0) return null;
                
                const order = orders[0]; // We only have one mock order
                const merchantTotal = order.items.reduce(
                  (total, item) => total + item.menuItem.price * item.quantity, 
                  0
                );
                
                return (
                  <div key={merchantName} className="border rounded-lg p-3 bg-muted/30">
                    <div className="font-medium text-sm text-primary mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      {merchantName}
                    </div>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.menuItem.name} ({item.quantity}x)</span>
                          <span>Rp {formatCurrency(item.menuItem.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm font-medium text-primary mt-2 pt-2 border-t border-primary/20">
                      <span>Subtotal:</span>
                      <span>Rp {formatCurrency(merchantTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>Rp {formatCurrency(cartTotal)}</span>
            </div>
          </div>
        )}

        {/* Notes Input */}
        <div className="space-y-2">
          <Label htmlFor="notes">Catatan (opsional)</Label>
          <Input 
            id="notes" 
            placeholder="Contoh: level pedas, tanpa bawang, dll" 
            value={notes} 
            onChange={(e) => onNotesChange(e.target.value)} 
          />
        </div>

        {/* Submit Button */}
        <Button 
          onClick={onSubmit} 
          className="w-full" 
          disabled={!customerName || cart.length === 0 || loading}
        >
          {isEditing ? "Perbarui Pesanan" : "Tambah ke Pesanan Grup"}
        </Button>
      </CardContent>
    </Card>
  );
}; 