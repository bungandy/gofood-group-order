import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Users, CheckCircle, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import { LoadingPage } from "@/components/common/LoadingPage";
import { 
  useSupabaseSession, 
  useSupabaseOrders, 
  useCart, 
  useOrderForm,
  OrderForm,
  OrderSummaryByMerchant,
  MenuSection
} from "@/features";
import type { Order } from "@/types";
import { copyToClipboard } from "@/utils";
import { SUCCESS_MESSAGES, UI_CONFIG } from "@/constants";

const OrderingPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Custom hooks
  const { sessionData, loading: sessionLoading } = useSupabaseSession(sessionId);
  const { orders, createOrder, updateOrder, deleteOrder, loading: ordersLoading } = useSupabaseOrders(sessionId);
  const { 
    cart, 
    cartTotal, 
    addToCart, 
    removeFromCart, 
    clearCart, 
    getItemQuantity 
  } = useCart();
  const {
    customerName,
    notes,
    editingOrder,
    isEditing,
    setCustomerName,
    setNotes,
    loadOrderForEdit,
    resetForm,
    validateForm,
    getFormData
  } = useOrderForm();

  // Get merchants and session name from Supabase data
  const merchants = useMemo(() => sessionData?.merchants || [], [sessionData?.merchants]);
  const sessionName = useMemo(() => sessionData?.sessionName || "Grup Order Session", [sessionData?.sessionName]);

  const handleSubmitOrder = async () => {
    if (!validateForm(cart)) return;

    try {
      const orderData = getFormData(cart, cartTotal);

      if (editingOrder) {
        await updateOrder(editingOrder.id, orderData);
      } else {
        await createOrder(orderData);
      }

      resetForm(clearCart);
    } catch (error) {
      console.error('Failed to submit order:', error);
    }
  };

  const handleShareLink = async () => {
    const currentUrl = window.location.href;
    const success = await copyToClipboard(currentUrl);
    
    if (success) {
      setCopied(true);
      toast({
        title: SUCCESS_MESSAGES.LINK_COPIED,
        description: "Link sudah disalin ke clipboard"
      });
      setTimeout(() => setCopied(false), UI_CONFIG.TOAST_DURATION);
    }
  };

  const handleGoToOverview = () => {
    navigate(`/order/${sessionId}/overview`);
  };

  const handleEditOrder = (order: Order) => {
    // Convert cart items for the hook
    const setCartItems = (items: typeof order.items) => {
      clearCart();
      items.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          addToCart(item.menuItem);
        }
      });
    };
    
    loadOrderForEdit(order, setCartItems);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
    } catch (error) {
      console.error('Failed to delete order:', error);
    }
  };

  if (sessionLoading) {
    return <LoadingPage text="Memuat sesi..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{sessionName}</h1>
          <p className="text-muted-foreground mb-4 text-sm md:text-base">
            Pesan menu favorit Anda!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button 
                onClick={handleShareLink} 
                variant="outline" 
                className="bg-white/80 backdrop-blur-sm flex-1 sm:flex-initial text-sm"
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
            <MenuSection
              merchants={merchants}
              getItemQuantity={getItemQuantity}
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
            />
          </div>

          {/* Order Form & Summary */}
          <div className="space-y-6">
            <OrderForm
              customerName={customerName}
              notes={notes}
              cart={cart}
              cartTotal={cartTotal}
              merchants={merchants}
              isEditing={isEditing}
              editingOrderName={editingOrder?.customerName}
              loading={ordersLoading}
              onCustomerNameChange={setCustomerName}
              onNotesChange={setNotes}
              onSubmit={handleSubmitOrder}
            />

            <OrderSummaryByMerchant 
              orders={orders} 
              merchants={merchants} 
              onEditOrder={handleEditOrder} 
              onDeleteOrder={handleDeleteOrder} 
              compact={true} 
            />
            
            {/* Overview Button */}
            {orders.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="py-4">
                  <Button 
                    onClick={handleGoToOverview} 
                    variant="outline" 
                    className="w-full text-sm"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Lihat Overview Lengkap
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderingPage;