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
  items: { menuItem: MenuItem; quantity: number }[];
  notes?: string;
  total: number;
  timestamp: string;
}

const OrderingPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [merchantName, setMerchantName] = useState("Grup Order Session");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState<{ menuItem: MenuItem; quantity: number }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
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
  const { toast } = useToast();

  // Load session data and existing orders on component mount
  useEffect(() => {
    if (sessionId) {
      // Load session data
      const sessionData = localStorage.getItem(`session_${sessionId}`);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        const sessionMerchants = parsed.merchants || [];
        setMerchants(sessionMerchants);
        
        // Set merchant name based on number of merchants
        if (sessionMerchants.length === 1) {
          setMerchantName(sessionMerchants[0].name);
        } else if (sessionMerchants.length > 1) {
          setMerchantName(`Grup Order - ${sessionMerchants.length} Merchant`);
        }
      }
      
      // Load existing orders for this session
      const ordersData = localStorage.getItem(`orders_${sessionId}`);
      if (ordersData) {
        setOrders(JSON.parse(ordersData));
      }
    }
  }, [sessionId]);

  // Generate menu items based on merchants - in real app, this would come from API
  const getAllMenuItems = (): MenuItem[] => {
    const allItems: MenuItem[] = [];
    
    merchants.forEach((merchant, index) => {
      // Mock menu items for each merchant
      const merchantMenus = [
        { id: `${merchant.id}_1`, name: "Nasi Gudeg Komplit", price: 25000, description: "Nasi putih, gudeg, ayam, telur, tahu, tempe", merchantId: merchant.id },
        { id: `${merchant.id}_2`, name: "Nasi Pecel", price: 15000, description: "Nasi putih dengan sayuran dan bumbu pecel", merchantId: merchant.id },
        { id: `${merchant.id}_3`, name: "Soto Ayam", price: 20000, description: "Soto ayam dengan nasi putih", merchantId: merchant.id },
        { id: `${merchant.id}_4`, name: "Gado-gado", price: 18000, description: "Sayuran segar dengan bumbu kacang", merchantId: merchant.id },
        { id: `${merchant.id}_5`, name: "Es Teh Manis", price: 5000, description: "Minuman segar es teh manis", merchantId: merchant.id },
        { id: `${merchant.id}_6`, name: "Es Jeruk", price: 8000, description: "Minuman segar es jeruk peras", merchantId: merchant.id },
      ];
      allItems.push(...merchantMenus);
    });
    
    return allItems;
  };

  const menuItems = getAllMenuItems();

  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map(item => 
          item.menuItem.id === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => {
      return prev.map(item => 
        item.menuItem.id === menuItemId 
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      ).filter(item => item.quantity > 0);
    });
  };

  const cartTotal = cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);

  const submitOrder = () => {
    if (!customerName || cart.length === 0) {
      toast({
        title: "Pesanan tidak lengkap",
        description: "Silakan isi nama dan pilih minimal 1 menu",
        variant: "destructive",
      });
      return;
    }

    const newOrder: Order = {
      id: Math.random().toString(36).substring(2, 15),
      customerName,
      items: [...cart],
      notes,
      total: cartTotal,
      timestamp: new Date().toISOString(),
    };

    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    
    // Save orders to localStorage
    if (sessionId) {
      localStorage.setItem(`orders_${sessionId}`, JSON.stringify(updatedOrders));
    }
    
    setCart([]);
    setCustomerName("");
    setNotes("");
    setEditingOrder(null);

    toast({
      title: editingOrder ? "Pesanan berhasil diperbarui!" : "Pesanan berhasil ditambahkan!",
      description: `Pesanan atas nama ${customerName} telah ${editingOrder ? "diperbarui" : "disimpan"}`,
    });
  };

  const shareLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      toast({
        title: "Link disalin!",
        description: "Link sudah disalin ke clipboard",
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
    
    // Remove the order being edited from the list
    const updatedOrders = orders.filter(o => o.id !== order.id);
    setOrders(updatedOrders);
    
    if (sessionId) {
      localStorage.setItem(`orders_${sessionId}`, JSON.stringify(updatedOrders));
    }

    toast({
      title: "Pesanan dimuat untuk diedit",
      description: `Pesanan ${order.customerName} telah dimuat ke form`,
    });
  };

  const deleteOrder = (orderId: string) => {
    const orderToDelete = orders.find(o => o.id === orderId);
    const updatedOrders = orders.filter(o => o.id !== orderId);
    setOrders(updatedOrders);
    
    if (sessionId) {
      localStorage.setItem(`orders_${sessionId}`, JSON.stringify(updatedOrders));
    }

    toast({
      title: "Pesanan dihapus",
      description: `Pesanan ${orderToDelete?.customerName} telah dihapus`,
    });
  };

  const grandTotal = orders.reduce((total, order) => total + order.total, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{merchantName}</h1>
          <p className="text-muted-foreground mb-4">Pesan menu favorit Anda!</p>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button 
              onClick={shareLink}
              variant="outline" 
              className="bg-white/80 backdrop-blur-sm"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Disalin!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Bagikan Link
                </>
              )}
            </Button>
            
            <Badge variant="secondary" className="text-sm">
              <Users className="w-4 h-4 mr-1" />
              {orders.length} pesanan
            </Badge>
            
            {orders.length > 0 && (
              <Button 
                onClick={goToOverview}
                variant="outline"
                className="bg-white/80 backdrop-blur-sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Lihat Overview
              </Button>
            )}
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
            {merchants.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <p>Tidak ada merchant tersedia</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {merchants.map((merchant, index) => {
                  const merchantMenus = menuItems.filter(item => item.merchantId === merchant.id);
                  
                  return (
                    <Card key={merchant.id} className="bg-white/80 backdrop-blur-sm animate-fade-in">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-primary flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          {merchant.name}
                        </CardTitle>
                        <CardDescription>{merchantMenus.length} menu tersedia</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="relative">
                          <div className="grid gap-3">
                            {merchantMenus.slice(0, expandedMerchants.has(merchant.id) ? merchantMenus.length : 4).map((item) => {
                              const cartItem = cart.find(c => c.menuItem.id === item.id);
                              const quantity = cartItem?.quantity || 0;
                              
                              return (
                                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{item.name}</h4>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                    <p className="font-medium text-primary mt-1">
                                      Rp {item.price.toLocaleString('id-ID')}
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeFromCart(item.id)}
                                      disabled={quantity === 0}
                                      className="hover-scale"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">{quantity}</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addToCart(item)}
                                      className="hover-scale"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Gradient fade effect and expand button */}
                          {merchantMenus.length > 4 && !expandedMerchants.has(merchant.id) && (
                            <div className="relative">
                              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
                            </div>
                          )}
                          
                          {merchantMenus.length > 4 && (
                            <div className="flex justify-center mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleMerchantExpansion(merchant.id)}
                                className="bg-white/80 backdrop-blur-sm hover-scale"
                              >
                                {expandedMerchants.has(merchant.id) ? (
                                  <>
                                    <ChevronUp className="w-4 h-4 mr-1" />
                                    Tampilkan Lebih Sedikit
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4 mr-1" />
                                    Tampilkan Semua ({merchantMenus.length - 4} lainnya)
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
            )}
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
                 {/* Edit Notice */}
                 {editingOrder && (
                   <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                     <Edit2 className="h-4 w-4 text-amber-600" />
                     <AlertDescription className="text-amber-800 dark:text-amber-200 font-medium">
                       ⚠️ Anda sedang mengubah pesanan atas nama <strong>{editingOrder.customerName}</strong>
                     </AlertDescription>
                   </Alert>
                 )}
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Nama Pemesan</Label>
                  <Input
                    id="customer-name"
                    placeholder="Masukkan nama Anda"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                {cart.length > 0 && (
                  <div className="space-y-2">
                    <Label>Item yang dipilih:</Label>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.menuItem.id} className="flex justify-between text-sm">
                          <span>{item.menuItem.name} x{item.quantity}</span>
                          <span>Rp {(item.menuItem.price * item.quantity).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan (opsional)</Label>
                  <Input
                    id="notes"
                    placeholder="Contoh: level pedas, tanpa bawang, dll"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={submitOrder}
                  className="w-full"
                  disabled={!customerName || cart.length === 0}
                >
                  {editingOrder ? "Perbarui Pesanan" : "Tambah ke Pesanan Grup"}
                </Button>
              </CardContent>
            </Card>

            {/* Orders Summary */}
            {orders.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Ringkasan Pesanan Grup</CardTitle>
                  <CardDescription>{orders.length} pesanan terkumpul</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.timestamp ? new Date(order.timestamp).toLocaleString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Just now'}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editOrder(order)}
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteOrder(order.id)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.items.map(item => 
                          `${item.menuItem.name} (${item.quantity}x)`
                        ).join(', ')}
                      </div>
                      {order.notes && (
                        <div className="text-sm text-muted-foreground italic flex items-center gap-1">
                          <StickyNote className="w-3 h-3" />
                          {order.notes}
                        </div>
                      )}
                      <div className="font-medium text-primary">
                        Rp {order.total.toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total Semua Pesanan:</span>
                    <span className="text-primary">Rp {grandTotal.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary-hover"
                    size="lg"
                  >
                    Pesan ke GoFood
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderingPage;