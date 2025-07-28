import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Share2, ShoppingCart, Users, Copy, CheckCircle, BarChart3, Edit2, Trash2, StickyNote, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import { OrderSummaryByMerchant } from "@/components/OrderSummaryByMerchant";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useSupabaseOrders } from "@/hooks/useSupabaseOrders";
// import { GroupChat } from "@/components/GroupChat"; // Temporarily disabled for next phase

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
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
  items: {
    menuItem: MenuItem;
    quantity: number;
  }[];
  notes?: string;
  total: number;
  timestamp: string;
}
const OrderingPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState<{
    menuItem: MenuItem;
    quantity: number;
  }[]>([]);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [expandedMerchants, setExpandedMerchants] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  // Supabase hooks
  const { sessionData, loading: sessionLoading } = useSupabaseSession(sessionId);
  const { orders, createOrder, updateOrder, deleteOrder, loading: ordersLoading } = useSupabaseOrders(sessionId);
  
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

  // Get merchants and session name from Supabase data
  const merchants = sessionData?.merchants || [];
  const merchantName = sessionData?.sessionName || "Grup Order Session";

  // Generate menu items based on merchants - in real app, this would come from API
  const getAllMenuItems = (): MenuItem[] => {
    const allItems: MenuItem[] = [];
    merchants.forEach(merchant => {
      // Different menu items for each merchant
      let merchantMenus: MenuItem[] = [];
      if (merchant.id === 'merchant_1') {
        // Warung Gudeg Bu Sari
        merchantMenus = [{
          id: `${merchant.id}_1`,
          name: "Nasi Gudeg Komplit",
          price: 25000,
          description: "Nasi putih, gudeg, ayam, telur, tahu, tempe",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_2`,
          name: "Gudeg Ayam",
          price: 20000,
          description: "Gudeg dengan ayam kampung",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_3`,
          name: "Gudeg Telur",
          price: 15000,
          description: "Gudeg dengan telur puyuh",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_4`,
          name: "Sambal Krecek",
          price: 8000,
          description: "Sambal krecek khas Yogya",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_5`,
          name: "Es Teh Manis",
          price: 5000,
          description: "Minuman segar es teh manis",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_6`,
          name: "Es Jeruk",
          price: 8000,
          description: "Minuman segar es jeruk peras",
          merchantId: merchant.id
        }];
      } else if (merchant.id === 'merchant_2') {
        // Ayam Geprek Bensu
        merchantMenus = [{
          id: `${merchant.id}_1`,
          name: "Ayam Geprek Original",
          price: 18000,
          description: "Ayam geprek dengan sambal level 1-5",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_2`,
          name: "Ayam Geprek Keju",
          price: 22000,
          description: "Ayam geprek dengan keju mozarella",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_3`,
          name: "Ayam Geprek Jumbo",
          price: 28000,
          description: "Ayam geprek porsi jumbo",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_4`,
          name: "Nasi Putih",
          price: 5000,
          description: "Nasi putih hangat",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_5`,
          name: "Es Teh",
          price: 3000,
          description: "Es teh manis segar",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_6`,
          name: "Es Jeruk",
          price: 5000,
          description: "Es jeruk segar",
          merchantId: merchant.id
        }];
      } else if (merchant.id === 'merchant_3') {
        // Bakso Solo Samrat
        merchantMenus = [{
          id: `${merchant.id}_1`,
          name: "Bakso Solo Special",
          price: 20000,
          description: "Bakso daging sapi dengan mie dan pangsit",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_2`,
          name: "Bakso Urat",
          price: 18000,
          description: "Bakso urat kenyal dengan kuah gurih",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_3`,
          name: "Mie Ayam Bakso",
          price: 15000,
          description: "Mie ayam dengan bakso daging",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_4`,
          name: "Pangsit Goreng",
          price: 12000,
          description: "Pangsit goreng isi ayam",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_5`,
          name: "Es Campur",
          price: 8000,
          description: "Es campur segar",
          merchantId: merchant.id
        }, {
          id: `${merchant.id}_6`,
          name: "Es Kelapa Muda",
          price: 10000,
          description: "Es kelapa muda segar",
          merchantId: merchant.id
        }];
      }
      allItems.push(...merchantMenus);
    });
    return allItems;
  };
  const menuItems = getAllMenuItems();
  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map(item => item.menuItem.id === menuItem.id ? {
          ...item,
          quantity: item.quantity + 1
        } : item);
      }
      return [...prev, {
        menuItem,
        quantity: 1
      }];
    });
  };
  const removeFromCart = (menuItemId: string) => {
    setCart(prev => {
      return prev.map(item => item.menuItem.id === menuItemId ? {
        ...item,
        quantity: Math.max(0, item.quantity - 1)
      } : item).filter(item => item.quantity > 0);
    });
  };
  const cartTotal = cart.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
  const submitOrder = async () => {
    if (!customerName || cart.length === 0) {
      toast({
        title: "Pesanan tidak lengkap",
        description: "Silakan isi nama dan pilih minimal 1 menu",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderData = {
        customerName,
        items: [...cart],
        notes,
        total: cartTotal
      };

      if (editingOrder) {
        await updateOrder(editingOrder.id, orderData);
      } else {
        await createOrder(orderData);
      }

      // Reset form
      setCart([]);
      setCustomerName("");
      setNotes("");
      setEditingOrder(null);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to submit order:', error);
    }
  };
  const shareLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      toast({
        title: "Link disalin!",
        description: "Link sudah disalin ke clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const goToOverview = () => {
    navigate(`/order/${sessionId}/overview`);
  };
  const editOrder = (order: Order) => {
    setEditingOrder(order);
    setCustomerName(order.customerName);
    setCart(order.items);
    setNotes(order.notes || "");

    toast({
      title: "Pesanan dimuat untuk diedit",
      description: `Pesanan ${order.customerName} telah dimuat ke form`
    });
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to delete order:', error);
    }
  };
  const grandTotal = orders.reduce((total, order) => total + order.total, 0);
  return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{merchantName}</h1>
          <p className="text-muted-foreground mb-4 text-sm md:text-base">Pesan menu favorit Anda!</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button onClick={shareLink} variant="outline" className="bg-white/80 backdrop-blur-sm flex-1 sm:flex-initial text-sm">
                {copied ? <>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Disalin!
                  </> : <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Bagikan Link
                  </>}
              </Button>
              
              <Badge variant="secondary" className="text-xs sm:text-sm whitespace-nowrap">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {orders.length} pesanan
              </Badge>
            </div>
            
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chat Section - Temporarily disabled for next phase */}
            {/* 
             <GroupChat 
              sessionId={sessionId || ""} 
              currentUserName={customerName}
              orders={orders}
             />
             */}
            {/* Menu Section */}
            {merchants.length === 0 ? <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <p>Tidak ada merchant tersedia</p>
                  </div>
                </CardContent>
              </Card> : <div className="space-y-6">
                {merchants.map((merchant, index) => {
              const merchantMenus = menuItems.filter(item => item.merchantId === merchant.id);
              return <Card key={merchant.id} className="bg-white/80 backdrop-blur-sm animate-fade-in">
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
                            {merchantMenus.slice(0, 
                              merchants.length === 1 || expandedMerchants.has(merchant.id) 
                                ? merchantMenus.length 
                                : 4
                            ).map(item => {
                        const cartItem = cart.find(c => c.menuItem.id === item.id);
                        const quantity = cartItem?.quantity || 0;
                        return <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{item.name}</h4>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                    <p className="font-medium text-primary mt-1">
                                      Rp {item.price.toLocaleString('id-ID')}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => removeFromCart(item.id)} disabled={quantity === 0} className="hover-scale">
                                      <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">{quantity}</span>
                                    <Button variant="outline" size="sm" onClick={() => addToCart(item)} className="hover-scale">
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>;
                      })}
                          </div>
                          
                          {/* Gradient fade effect and expand button - only show if multiple merchants and not expanded */}
                          {merchants.length > 1 && merchantMenus.length > 4 && !expandedMerchants.has(merchant.id) && <div className="relative">
                              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
                            </div>}
                          
                          {merchants.length > 1 && merchantMenus.length > 4 && <div className="flex justify-center mt-4">
                              <Button variant="outline" size="sm" onClick={() => toggleMerchantExpansion(merchant.id)} className="bg-white/80 backdrop-blur-sm hover-scale">
                                {expandedMerchants.has(merchant.id) ? <>
                                    <ChevronUp className="w-4 h-4 mr-1" />
                                    Tampilkan Lebih Sedikit
                                  </> : <>
                                    <ChevronDown className="w-4 h-4 mr-1" />
                                    Tampilkan Semua ({merchantMenus.length - 4} lainnya)
                                  </>}
                              </Button>
                            </div>}
                        </div>
                      </CardContent>
                    </Card>;
            })}
              </div>}
          </div>

          {/* Order Form & Summary */}
          <div className="space-y-6">
            {/* Order Form */}
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
                  {editingOrder && <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                      <Edit2 className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200 font-medium">
                        ⚠️ Anda sedang mengubah pesanan atas nama <strong>{editingOrder.customerName}</strong>
                      </AlertDescription>
                    </Alert>}
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Nama Pemesan</Label>
                  <Input id="customer-name" placeholder="Masukkan nama Anda" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>

                 {cart.length > 0 && <div className="space-y-2">
                     <Label>Item yang dipilih:</Label>
                     <div className="space-y-3">
                       {(() => {
                    // Group cart items by merchant
                    const groupedCart = cart.reduce((acc, item) => {
                      const merchantId = item.menuItem.merchantId;
                      if (!acc[merchantId]) {
                        acc[merchantId] = [];
                      }
                      acc[merchantId].push(item);
                      return acc;
                    }, {} as Record<string, typeof cart>);
                    return Object.entries(groupedCart).map(([merchantId, items]) => {
                      const merchant = merchants.find(m => m.id === merchantId);
                      const merchantTotal = items.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
                      return <div key={merchantId} className="border rounded-lg p-3 bg-muted/30">
                               <div className="font-medium text-sm text-primary mb-2 flex items-center gap-2">
                                 <div className="w-2 h-2 bg-primary rounded-full"></div>
                                 {merchant?.name || 'Unknown Merchant'}
                               </div>
                               <div className="space-y-1">
                                 {items.map(item => <div key={item.menuItem.id} className="flex justify-between text-sm">
                                     <span>{item.menuItem.name} x{item.quantity}</span>
                                     <span>Rp {(item.menuItem.price * item.quantity).toLocaleString('id-ID')}</span>
                                   </div>)}
                               </div>
                               <div className="flex justify-between text-sm font-medium text-primary mt-2 pt-2 border-t border-primary/20">
                                 <span>Subtotal:</span>
                                 <span>Rp {merchantTotal.toLocaleString('id-ID')}</span>
                               </div>
                             </div>;
                    });
                  })()}
                     </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>}

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan (opsional)</Label>
                  <Input id="notes" placeholder="Contoh: level pedas, tanpa bawang, dll" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                <Button onClick={submitOrder} className="w-full" disabled={!customerName || cart.length === 0 || ordersLoading}>
                  {editingOrder ? "Perbarui Pesanan" : "Tambah ke Pesanan Grup"}
                </Button>
              </CardContent>
            </Card>

            {/* Orders Summary */}
            <OrderSummaryByMerchant orders={orders} merchants={merchants} onEditOrder={editOrder} onDeleteOrder={handleDeleteOrder} compact={true} />
            
            {/* Overview Button */}
            {orders.length > 0 && <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="py-4">
                  <Button onClick={goToOverview} variant="outline" className="w-full text-sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Lihat Overview Lengkap
                  </Button>
                </CardContent>
              </Card>}
            
          </div>
        </div>
      </div>
      <Footer />
    </div>;
};
export default OrderingPage;