import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Order, OrderItem, UseOrdersReturn } from '@/types';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { generateId } from '@/utils';

export const useSupabaseOrders = (sessionId?: string, currentUserName?: string): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const loadOrders = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Loading orders for session: ${id}`);

      // Get orders with their items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      // Transform data to match interface
      const transformedOrders: Order[] = ordersData.map(order => ({
        id: order.order_id,
        customerName: order.customer_name,
        notes: order.notes,
        total: order.total,
        timestamp: order.created_at,
        items: order.order_items.map((item: any) => ({
          menuItem: {
            id: item.menu_item_id,
            name: item.menu_item_name,
            price: item.menu_item_price,
            description: item.menu_item_description,
            merchantId: item.merchant_id
          },
          quantity: item.quantity
        }))
      }));

      console.log(`Loaded ${transformedOrders.length} orders`);
      setOrders(transformedOrders);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.message);
      toast({
        title: ERROR_MESSAGES.FAILED_TO_LOAD_SESSION,
        description: 'Terjadi kesalahan saat memuat data pesanan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Memoize the order handlers to prevent subscription recreation
  const handleNewOrder = useCallback((payload: any) => {
    console.log('Real-time new order received:', payload);
    
    const newOrder = payload.new;
    
    // Show notification if this order was created by someone else
    if (currentUserName && newOrder.customer_name !== currentUserName) {
      toast({
        title: '🍽️ Pesanan Baru!',
        description: `${newOrder.customer_name} telah menambahkan pesanan (Rp ${newOrder.total.toLocaleString('id-ID')})`,
        duration: 5000,
      });
    }
    
    // Reload orders to get complete data with items
    if (sessionId) {
      loadOrders(sessionId);
    }
  }, [currentUserName, sessionId, toast, loadOrders]);

  const handleUpdatedOrder = useCallback((payload: any) => {
    console.log('Real-time order update received:', payload);
    
    const updatedOrder = payload.new;
    
    // Show notification if this order was updated by someone else
    if (currentUserName && updatedOrder.customer_name !== currentUserName) {
      toast({
        title: '📝 Pesanan Diperbarui',
        description: `${updatedOrder.customer_name} telah memperbarui pesanannya`,
        duration: 4000,
      });
    }
    
    // Reload orders to get complete updated data
    if (sessionId) {
      loadOrders(sessionId);
    }
  }, [currentUserName, sessionId, toast]);

  const handleDeletedOrder = useCallback((payload: any) => {
    console.log('Real-time order deletion received:', payload);
    
    const deletedOrder = payload.old;
    
    // Show notification if this order was deleted by someone else
    if (currentUserName && deletedOrder.customer_name !== currentUserName) {
      toast({
        title: '🗑️ Pesanan Dihapus',
        description: `Pesanan ${deletedOrder.customer_name} telah dihapus`,
        duration: 4000,
        variant: 'destructive',
      });
    }
    
    // Update local state immediately
    setOrders(prev => prev.filter(order => order.id !== deletedOrder.order_id));
  }, [currentUserName, toast]);

  const setupOrdersSubscription = useCallback(() => {
    if (!sessionId) return;

    // Clean up existing subscription
    if (channelRef.current) {
      console.log('Cleaning up existing orders subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    console.log(`Setting up orders subscription for session: ${sessionId}`);

    // Set up real-time subscription for orders
    const channel = supabase
      .channel(`orders_${sessionId}_${Date.now()}`) // Add timestamp to ensure unique channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `session_id=eq.${sessionId}`
        },
        handleNewOrder
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `session_id=eq.${sessionId}`
        },
        handleUpdatedOrder
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
          filter: `session_id=eq.${sessionId}`
        },
        handleDeletedOrder
      )
      .subscribe((status) => {
        console.log('Orders subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
          reconnectAttempts.current = 0;
          console.log('Orders subscription active');
          
          toast({
            title: 'Realtime Pesanan Aktif',
            description: 'Anda akan mendapat notifikasi untuk pesanan baru',
            duration: 3000,
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          setIsConnected(false);
          console.error('Orders subscription error/closed:', status);
          
          // Retry connection with exponential backoff
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const retryDelay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 30000);
            
            console.log(`Retrying orders connection in ${retryDelay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
            
            retryTimeoutRef.current = setTimeout(() => {
              console.log('Retrying orders connection...');
              setupOrdersSubscription();
            }, retryDelay);
          } else {
            console.error('Max orders reconnection attempts reached');
            toast({
              title: 'Koneksi realtime pesanan gagal',
              description: 'Silakan refresh halaman untuk menyambung kembali',
              variant: 'destructive',
            });
          }
        }
      });

    channelRef.current = channel;
  }, [sessionId, handleNewOrder, handleUpdatedOrder, handleDeletedOrder, toast]);

  // Force refresh subscription
  const refreshConnection = useCallback(() => {
    console.log('Manually refreshing orders connection...');
    reconnectAttempts.current = 0;
    setupOrdersSubscription();
  }, [setupOrdersSubscription]);



  const createOrder = async (orderData: Omit<Order, 'id' | 'timestamp'>) => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      const orderId = generateId();

      // Create order
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          order_id: orderId,
          session_id: sessionId,
          customer_name: orderData.customerName,
          notes: orderData.notes,
          total: orderData.total
        });

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: orderId,
        menu_item_id: item.menuItem.id,
        menu_item_name: item.menuItem.name,
        menu_item_price: item.menuItem.price,
        menu_item_description: item.menuItem.description,
        merchant_id: item.menuItem.merchantId,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Reload orders
      await loadOrders(sessionId);

      toast({
        title: SUCCESS_MESSAGES.ORDER_ADDED,
        description: `Pesanan atas nama ${orderData.customerName} telah disimpan`,
      });
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message);
      toast({
        title: 'Gagal menyimpan pesanan',
        description: 'Terjadi kesalahan saat menyimpan pesanan',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (orderId: string, orderData: Omit<Order, 'id' | 'timestamp'>) => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      // Update order
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          customer_name: orderData.customerName,
          notes: orderData.notes,
          total: orderData.total
        })
        .eq('order_id', orderId);

      if (orderError) throw orderError;

      // Delete existing order items
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (deleteError) throw deleteError;

      // Create new order items
      const orderItems = orderData.items.map(item => ({
        order_id: orderId,
        menu_item_id: item.menuItem.id,
        menu_item_name: item.menuItem.name,
        menu_item_price: item.menuItem.price,
        menu_item_description: item.menuItem.description,
        merchant_id: item.menuItem.merchantId,
        quantity: item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Reload orders
      await loadOrders(sessionId);

      toast({
        title: 'Pesanan berhasil diperbarui!',
        description: `Pesanan atas nama ${orderData.customerName} telah diperbarui`,
      });
    } catch (err: any) {
      console.error('Error updating order:', err);
      setError(err.message);
      toast({
        title: 'Gagal memperbarui pesanan',
        description: 'Terjadi kesalahan saat memperbarui pesanan',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);

      const orderToDelete = orders.find(o => o.id === orderId);

      // Delete order (items will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('order_id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(orders.filter(o => o.id !== orderId));

      toast({
        title: 'Pesanan dihapus',
        description: `Pesanan ${orderToDelete?.customerName} telah dihapus`,
      });
    } catch (err: any) {
      console.error('Error deleting order:', err);
      setError(err.message);
      toast({
        title: 'Gagal menghapus pesanan',
        description: 'Terjadi kesalahan saat menghapus pesanan',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadOrders(sessionId);
      setupOrdersSubscription();
    } else {
      setLoading(false);
    }

    return () => {
      console.log('Cleaning up orders subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [sessionId, setupOrdersSubscription]);

  return {
    orders,
    loading,
    error,
    isConnected,
    createOrder,
    updateOrder,
    deleteOrder,
    refreshConnection,
    refetch: () => sessionId && loadOrders(sessionId)
  };
};