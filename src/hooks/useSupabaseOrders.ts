import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Order, OrderItem, UseOrdersReturn } from '@/types';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { generateId } from '@/utils';

export const useSupabaseOrders = (sessionId?: string): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (sessionId) {
      loadOrders(sessionId);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const loadOrders = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

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
  };

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

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrder,
    deleteOrder,
    refetch: () => sessionId && loadOrders(sessionId)
  };
};