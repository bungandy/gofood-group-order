import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Share2, ShoppingCart, Users, Copy, CheckCircle, BarChart3, Edit2, Trash2, StickyNote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GroupChat } from "@/components/GroupChat";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
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
  const [merchantName, setMerchantName] = useState("Warteg Bahari");
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState<{ menuItem: MenuItem; quantity: number }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  // Load session data and existing orders on component mount
  useEffect(() => {
    if (sessionId) {
      // Load session data
      const sessionData = localStorage.getItem(`session_${sessionId}`);
      if (sessionData) {
        const { merchantName: name } = JSON.parse(sessionData);
        setMerchantName(name);
      }
      
      // Load existing orders for this session
      const ordersData = localStorage.getItem(`orders_${sessionId}`);
      if (ordersData) {
        setOrders(JSON.parse(ordersData));
      }
    }
  }, [sessionId]);

  // Mock menu items - in real app, this would come from props or API
  const menuItems: MenuItem[] = [
    { id: "1", name: "Nasi Gudeg Komplit", price: 25000, description: "Nasi putih, gudeg, ayam, telur, tahu, tempe" },
    { id: "2", name: "Nasi Pecel", price: 15000, description: "Nasi putih dengan sayuran dan bumbu pecel" },
    { id: "3", name: "Soto Ayam", price: 20000, description: "Soto ayam dengan nasi putih" },
    { id: "4", name: "Gado-gado", price: 18000, description: "Sayuran segar dengan bumbu kacang" },
    { id: "5", name: "Es Teh Manis", price: 5000, description: "Minuman segar es teh manis" },
    { id: "6", name: "Es Jeruk", price: 8000, description: "Minuman segar es jeruk peras" },
  ];

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
          <div className="lg:col-span-2 space-y-6">{/* Chat Section */}
            <GroupChat 
              sessionId={sessionId || ""} 
              currentUserName={customerName}
              orders={orders}
            />
            {/* Menu Section */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Menu Tersedia</CardTitle>
                <CardDescription>Pilih menu yang ingin dipesan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {menuItems.map((item) => {
                    const cartItem = cart.find(c => c.menuItem.id === item.id);
                    const quantity = cartItem?.quantity || 0;
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
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
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToCart(item)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
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
                        <div className="font-semibold">{order.customerName}</div>
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
                      <div className="text-xs text-muted-foreground mb-1">
                        {order.timestamp ? new Date(order.timestamp).toLocaleString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Just now'}
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