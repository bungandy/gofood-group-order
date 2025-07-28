import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Download, 
  MessageSquare,
  Clock,
  CheckCircle,
  User
} from "lucide-react";
import { OrderSummaryByMerchant } from "@/components/OrderSummaryByMerchant";
import { useToast } from "@/hooks/use-toast";

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

const OrderOverview = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [merchantName, setMerchantName] = useState("Warteg Bahari");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sessionCreated, setSessionCreated] = useState<string>("");
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [merchantDeliveryFees, setMerchantDeliveryFees] = useState<Record<string, number>>({});
  const { toast } = useToast();

  // Load session data and orders
  useEffect(() => {
    if (sessionId) {
      // Load session info
      const sessionData = localStorage.getItem(`session_${sessionId}`);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        const sessionMerchants = parsed.merchants || [];
        setMerchants(sessionMerchants);
        
        if (sessionMerchants.length === 1) {
          setMerchantName(sessionMerchants[0].name);
        } else if (sessionMerchants.length > 1) {
          setMerchantName(`Grup Order - ${sessionMerchants.length} Merchant`);
        }
        
        setSessionCreated(parsed.createdAt);
      } else {
        // Mock merchants for development
        const mockMerchants = [
          { id: 'merchant_1', name: 'Warung Gudeg Bu Sari', link: 'https://gofood.co.id/warung-gudeg' },
          { id: 'merchant_2', name: 'Ayam Geprek Bensu', link: 'https://gofood.co.id/ayam-geprek' },
          { id: 'merchant_3', name: 'Bakso Solo Samrat', link: 'https://gofood.co.id/bakso-solo' }
        ];
        setMerchants(mockMerchants);
        setMerchantName(`Grup Order - ${mockMerchants.length} Merchant`);
      }

      // Load orders for this session
      const ordersData = localStorage.getItem(`orders_${sessionId}`);
      if (ordersData) {
        setOrders(JSON.parse(ordersData));
      }
    }
  }, [sessionId]);

  // Calculate summary statistics
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
  const totalItems = orders.reduce((sum, order) => 
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  // Group items by merchant and menu item
  const groupedItemsByMerchant = orders.reduce((acc, order) => {
    order.items.forEach(({ menuItem, quantity }) => {
      const merchantId = menuItem.merchantId;
      const merchant = merchants.find(m => m.id === merchantId);
      const merchantName = merchant?.name || 'Unknown Merchant';
      
      if (!acc[merchantName]) {
        acc[merchantName] = {};
      }
      
      if (acc[merchantName][menuItem.id]) {
        acc[merchantName][menuItem.id].quantity += quantity;
        acc[merchantName][menuItem.id].customers.push({
          name: order.customerName,
          quantity,
          notes: order.notes
        });
      } else {
        acc[merchantName][menuItem.id] = {
          menuItem,
          quantity,
          customers: [{
            name: order.customerName,
            quantity,
            notes: order.notes
          }]
        };
      }
    });
    return acc;
  }, {} as Record<string, Record<string, {
    menuItem: MenuItem;
    quantity: number;
    customers: { name: string; quantity: number; notes?: string }[];
  }>>);

  // Calculate subtotal for each merchant
  const merchantSubtotals = Object.entries(groupedItemsByMerchant).reduce((acc, [merchantName, items]) => {
    acc[merchantName] = Object.values(items).reduce((total, { menuItem, quantity }) => {
      return total + (menuItem.price * quantity);
    }, 0);
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate total delivery fees
  const totalDeliveryFees = Object.values(merchantDeliveryFees).reduce((sum, fee) => sum + fee, 0);

  // Original grouped items for backward compatibility
  const groupedItems = orders.reduce((acc, order) => {
    order.items.forEach(({ menuItem, quantity }) => {
      if (acc[menuItem.id]) {
        acc[menuItem.id].quantity += quantity;
        acc[menuItem.id].customers.push({
          name: order.customerName,
          quantity,
          notes: order.notes
        });
      } else {
        acc[menuItem.id] = {
          menuItem,
          quantity,
          customers: [{
            name: order.customerName,
            quantity,
            notes: order.notes
          }]
        };
      }
    });
    return acc;
  }, {} as Record<string, {
    menuItem: MenuItem;
    quantity: number;
    customers: { name: string; quantity: number; notes?: string }[];
  }>);

  const exportOrderSummary = () => {
    const summary = Object.values(groupedItems)
      .map(({ menuItem, quantity, customers }) => {
        const customerList = customers
          .map(c => `${c.name} (${c.quantity}x)${c.notes ? ` - ${c.notes}` : ''}`)
          .join(', ');
        return `${menuItem.name}: ${quantity}x - Rp ${(menuItem.price * quantity).toLocaleString('id-ID')}\nPemesan: ${customerList}`;
      })
      .join('\n\n');

    const fullSummary = `
RINGKASAN PESANAN GRUP
Merchant: ${merchantName}
Total Pesanan: ${totalOrders}
Total Item: ${totalItems}
Total Harga: Rp ${totalAmount.toLocaleString('id-ID')}

DETAIL PESANAN:
${summary}

PESANAN INDIVIDUAL:
${orders.map(order => `
${order.customerName}:
${order.items.map(item => `- ${item.menuItem.name} ${item.quantity}x`).join('\n')}
${order.notes ? `Catatan: ${order.notes}` : ''}
Total: Rp ${order.total.toLocaleString('id-ID')}
`).join('\n')}
    `.trim();

    // Copy to clipboard
    navigator.clipboard.writeText(fullSummary).then(() => {
      toast({
        title: "Ringkasan disalin!",
        description: "Ringkasan pesanan sudah disalin ke clipboard",
      });
    });
  };

  const goBackToOrdering = () => {
    navigate(`/order/${sessionId}`);
  };

  const finalizeOrder = () => {
    toast({
      title: "Pesanan siap dikirim!",
      description: "Silakan copy ringkasan dan pesan ke GoFood",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={goBackToOrdering}
              className="bg-white/80 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{merchantName}</h1>
              <p className="text-muted-foreground">Overview Pesanan Grup</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={exportOrderSummary}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={finalizeOrder}
              className="bg-gradient-to-r from-primary to-primary-hover"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalisasi
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                pesanan terkumpul
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Item</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{totalItems}</div>
              <p className="text-xs text-muted-foreground">
                item dipesan
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Harga</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                Rp {totalAmount.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground">
                total pembayaran
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waktu Dibuat</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {sessionCreated ? new Date(sessionCreated).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '--:--'}
              </div>
              <p className="text-xs text-muted-foreground">
                {sessionCreated ? new Date(sessionCreated).toLocaleDateString('id-ID') : 'Unknown'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Grouped Items for GoFood Order */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Ringkasan untuk GoFood
              </CardTitle>
              <CardDescription>
                Item yang perlu dipesan ke merchant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedItemsByMerchant).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Belum ada pesanan masuk
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedItemsByMerchant).map(([merchantName, items]) => (
                    <div key={merchantName} className="border rounded-lg p-4 bg-muted/20">
                      <div className="font-semibold text-primary flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {merchantName}
                      </div>
                      
                      <div className="space-y-3 ml-4">
                        {Object.values(items).map(({ menuItem, quantity, customers }) => (
                          <div key={menuItem.id} className="p-3 border rounded-lg bg-white/50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium">{menuItem.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {quantity}x @ Rp {menuItem.price.toLocaleString('id-ID')}
                                </p>
                              </div>
                              <Badge variant="secondary">
                                Rp {(menuItem.price * quantity).toLocaleString('id-ID')}
                              </Badge>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              <strong>Pemesan:</strong>
                              <div className="mt-1 space-y-1">
                                {customers.map((customer, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {customer.name} ({customer.quantity}x)
                                    </span>
                                    {customer.notes && (
                                      <span className="italic">"{customer.notes}"</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                         
                         <div className="space-y-2">
                           <Label htmlFor={`delivery-fee-${merchantName}`}>
                             Ongkos Pengiriman {merchantName} (Opsional)
                           </Label>
                           <Input
                             id={`delivery-fee-${merchantName}`}
                             type="number"
                             placeholder="Masukkan tarif ongkir (Rp)"
                             value={merchantDeliveryFees[merchantName] || ''}
                             onChange={(e) => {
                               const fee = Number(e.target.value) || 0;
                               setMerchantDeliveryFees(prev => ({
                                 ...prev,
                                 [merchantName]: fee
                               }));
                             }}
                           />
                         </div>
                         
                         <div className="flex justify-between items-center font-medium text-primary border-t pt-2">
                           <span>Subtotal + Ongkir {merchantName}:</span>
                           <span>Rp {((merchantSubtotals[merchantName] || 0) + (merchantDeliveryFees[merchantName] || 0)).toLocaleString('id-ID')}</span>
                         </div>
                       </div>
                     </div>
                   ))}
                   
                   <Separator />
                   
                   <div className="flex justify-between items-center font-bold text-lg">
                     <span>Total Keseluruhan:</span>
                     <span className="text-primary">
                       Rp {(totalAmount + totalDeliveryFees).toLocaleString('id-ID')}
                     </span>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>

           <OrderSummaryByMerchant
             orders={orders}
             merchants={merchants}
             showDeliveryFee={true}
           />
        </div>
      </div>
    </div>
  );
};

export default OrderOverview;