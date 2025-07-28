import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Edit2, Trash2, StickyNote, User, ChevronDown, ChevronUp } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  merchantId: string;
}

interface Merchant {
  id: string;
  name: string;
  link: string;
}

interface Order {
  id: string;
  customerName: string;
  items: { menuItem: MenuItem; quantity: number }[];
  notes?: string;
  total: number;
  timestamp: string;
}

interface OrderSummaryByMerchantProps {
  orders: Order[];
  merchants: Merchant[];
  onEditOrder?: (order: Order) => void;
  onDeleteOrder?: (orderId: string) => void;
  showDeliveryFee?: boolean;
  merchantDeliveryFees?: Record<string, number>;
  compact?: boolean;
}

export const OrderSummaryByMerchant = ({ 
  orders, 
  merchants, 
  onEditOrder, 
  onDeleteOrder, 
  showDeliveryFee = false,
  merchantDeliveryFees: externalDeliveryFees,
  compact = false
}: OrderSummaryByMerchantProps) => {
  const [internalDeliveryFees, setInternalDeliveryFees] = useState<Record<string, number>>({});
  const [expandedMerchants, setExpandedMerchants] = useState<Record<string, boolean>>({});
  
  // Use external delivery fees if provided, otherwise use internal state
  const merchantDeliveryFees = externalDeliveryFees || internalDeliveryFees;

  // Group orders by merchant
  const groupedOrders = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      const merchantId = item.menuItem.merchantId;
      const merchant = merchants.find(m => m.id === merchantId);
      const merchantName = merchant?.name || 'Unknown Merchant';
      
      if (!acc[merchantName]) {
        acc[merchantName] = [];
      }
      
      // Check if order already exists for this merchant
      let existingOrder = acc[merchantName].find(o => o.id === order.id);
      if (!existingOrder) {
        existingOrder = {
          ...order,
          items: []
        };
        acc[merchantName].push(existingOrder);
      }
      
      // Add item to the order
      existingOrder.items.push(item);
    });
    return acc;
  }, {} as Record<string, Order[]>);

  // Calculate subtotal for each merchant
  const merchantSubtotals = Object.entries(groupedOrders).reduce((acc, [merchantName, merchantOrders]) => {
    acc[merchantName] = merchantOrders.reduce((total, order) => {
      return total + order.items.reduce((itemTotal, item) => itemTotal + (item.menuItem.price * item.quantity), 0);
    }, 0);
    return acc;
  }, {} as Record<string, number>);

  // Calculate delivery fee per person for each merchant
  const getDeliveryFeePerPerson = (merchantName: string) => {
    const merchantTotalFee = merchantDeliveryFees[merchantName] || 0;
    const peopleCount = groupedOrders[merchantName]?.length || 0;
    return peopleCount > 0 ? merchantTotalFee / peopleCount : 0;
  };

  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
  const totalDeliveryFees = Object.values(merchantDeliveryFees).reduce((sum, fee) => sum + fee, 0);

  if (orders.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Ringkasan Pesanan Grup</CardTitle>
          <CardDescription>Belum ada pesanan terkumpul</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Belum ada pesanan masuk
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Ringkasan Pesanan Grup</CardTitle>
        <CardDescription>{orders.length} pesanan terkumpul</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedOrders).map(([merchantName, merchantOrders]) => {
          const isExpanded = expandedMerchants[merchantName];
          const hasMultipleOrders = merchantOrders.length > 2;
          
          return (
            <div key={merchantName} className="border border-primary/20 rounded-lg p-3 bg-muted/20">
              <div className="font-medium text-primary flex items-center justify-between border-b pb-1 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  {merchantName}
                </div>
                {hasMultipleOrders && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedMerchants(prev => ({ ...prev, [merchantName]: !prev[merchantName] }))}
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                )}
              </div>
              
              <div className="relative ml-4">
                <div 
                  className={`space-y-2 overflow-hidden transition-all duration-300 ${
                    !hasMultipleOrders || isExpanded ? '' : 'max-h-[200px]'
                  }`}
                >
                  {merchantOrders.map((order) => (
                    <div key={`${merchantName}_${order.id}`} className={`${compact ? 'p-2' : 'p-3'} border rounded bg-muted/20`}>
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`${compact ? 'text-sm' : 'text-sm'} font-medium`}>{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.timestamp ? new Date(order.timestamp).toLocaleString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Just now'}
                          </div>
                        </div>
                        {(onEditOrder || onDeleteOrder) && (
                          <div className="flex gap-1">
                            {onEditOrder && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const originalOrder = orders.find(o => o.id === order.id);
                                  if (originalOrder) onEditOrder(originalOrder);
                                }}
                                className="h-6 w-6 p-0 hover:bg-primary/10"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            )}
                            {onDeleteOrder && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteOrder(order.id)}
                                className="h-6 w-6 p-0 hover:bg-destructive/10 text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.menuItem.name} ({item.quantity}x)</span>
                            <span>Rp {(item.menuItem.price * item.quantity).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <div className="text-xs text-muted-foreground italic flex items-center gap-1 mt-1">
                          <StickyNote className="w-3 h-3" />
                          {order.notes}
                        </div>
                      )}
                      <div className="text-sm font-medium text-primary mt-1">
                        Subtotal: Rp {order.items.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0).toLocaleString('id-ID')}
                        {showDeliveryFee && externalDeliveryFees && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Ongkir: Rp {getDeliveryFeePerPerson(merchantName).toLocaleString('id-ID')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Gradient overlay when collapsed */}
                {hasMultipleOrders && !isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted/40 to-transparent pointer-events-none" />
                )}
              </div>
              
              {showDeliveryFee && !externalDeliveryFees && (
                <div className="space-y-2 mt-3 ml-4">
                  <Label htmlFor={`delivery-fee-${merchantName}`}>
                    Ongkos Pengiriman {merchantName} (Opsional)
                  </Label>
                  <Input
                    id={`delivery-fee-${merchantName}`}
                    type="number"
                    placeholder="Masukkan tarif ongkir (Rp)"
                    value={internalDeliveryFees[merchantName] || ''}
                    onChange={(e) => {
                      const fee = Number(e.target.value) || 0;
                      setInternalDeliveryFees(prev => ({
                        ...prev,
                        [merchantName]: fee
                      }));
                    }}
                  />
                </div>
              )}
              
              <div className="flex justify-between items-center font-medium text-primary border-t pt-2 ml-4">
                <span>Subtotal {merchantName}:</span>
                <span>Rp {(merchantSubtotals[merchantName] || 0).toLocaleString('id-ID')}</span>
              </div>
              
              {showDeliveryFee && externalDeliveryFees && (
                <div className="flex justify-between items-center text-sm text-muted-foreground mt-1 ml-4">
                  <span>Ongkir per orang: Rp {getDeliveryFeePerPerson(merchantName).toLocaleString('id-ID')} x {groupedOrders[merchantName]?.length || 0} orang</span>
                  <span>= Rp {(getDeliveryFeePerPerson(merchantName) * (groupedOrders[merchantName]?.length || 0)).toLocaleString('id-ID')}</span>
                </div>
              )}
              
              {showDeliveryFee && !externalDeliveryFees && (
                <div className="flex justify-between items-center text-sm text-primary mt-1 ml-4">
                  <span>Total + Ongkir:</span>
                  <span>Rp {((merchantSubtotals[merchantName] || 0) + (merchantDeliveryFees[merchantName] || 0)).toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          );
        })}
        
        <Separator />
        <div className="flex justify-between items-center font-bold text-lg">
          <span>Perkiraan Total Pesanan:</span>
          <span className="text-primary">Rp {(totalAmount + (showDeliveryFee ? totalDeliveryFees : 0)).toLocaleString('id-ID')}</span>
        </div>
      </CardContent>
    </Card>
  );
};