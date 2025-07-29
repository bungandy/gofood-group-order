import { useState, useCallback, useEffect } from 'react';
import type { Order, OrderItem } from '@/types';
import { validateRequired, validateMinLength, validateMaxLength } from '@/utils';
import { VALIDATION, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { useToast } from '@/hooks/use-toast';

// localStorage key for persisting user name
const USER_NAME_STORAGE_KEY = 'gofood-group-order-user-name';

interface UseOrderFormReturn {
  customerName: string;
  notes: string;
  editingOrder: Order | null;
  isEditing: boolean;
  setCustomerName: (name: string) => void;
  setNotes: (notes: string) => void;
  loadOrderForEdit: (order: Order, setCart: (items: OrderItem[]) => void) => void;
  resetForm: (clearCart: () => void) => void;
  validateForm: (cart: OrderItem[]) => boolean;
  getFormData: (cart: OrderItem[], cartTotal: number) => Omit<Order, 'id' | 'timestamp'>;
  initializeUserName: (existingOrders: Order[]) => void;
}

export const useOrderForm = (): UseOrderFormReturn => {
  const [customerName, setCustomerNameState] = useState('');
  const [notes, setNotes] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const isEditing = editingOrder !== null;

  // Load user name from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem(USER_NAME_STORAGE_KEY);
    if (savedName) {
      setCustomerNameState(savedName);
    }
  }, []);

  // Custom setter that also saves to localStorage
  const setCustomerName = useCallback((name: string) => {
    setCustomerNameState(name);
    if (name.trim()) {
      localStorage.setItem(USER_NAME_STORAGE_KEY, name.trim());
    }
  }, []);

  // Initialize user name from existing orders if localStorage is empty
  const initializeUserName = useCallback((existingOrders: Order[]) => {
    const savedName = localStorage.getItem(USER_NAME_STORAGE_KEY);
    
    // If no saved name and user hasn't entered a name yet, try to get from existing orders
    if (!savedName && !customerName && existingOrders.length > 0) {
      // Get the most recent order's customer name
      const mostRecentOrder = existingOrders[existingOrders.length - 1];
      if (mostRecentOrder?.customerName) {
        setCustomerName(mostRecentOrder.customerName);
      }
    }
  }, [customerName, setCustomerName]);

  const loadOrderForEdit = useCallback((order: Order, setCart: (items: OrderItem[]) => void) => {
    setEditingOrder(order);
    setCustomerName(order.customerName);
    setCart(order.items);
    setNotes(order.notes || '');

    toast({
      title: SUCCESS_MESSAGES.ORDER_LOADED_FOR_EDIT,
      description: `Pesanan ${order.customerName} telah dimuat ke form`
    });
  }, [toast, setCustomerName]);

  const resetForm = useCallback((clearCart: () => void) => {
    // Don't reset customerName - keep it for future orders and chat
    setNotes('');
    setEditingOrder(null);
    clearCart();
  }, []);

  const validateForm = useCallback((cart: OrderItem[]): boolean => {
    // Validate customer name
    if (!validateRequired(customerName)) {
      toast({
        title: ERROR_MESSAGES.INCOMPLETE_ORDER,
        description: ERROR_MESSAGES.MINIMUM_NAME_AND_MENU,
        variant: 'destructive'
      });
      return false;
    }

    if (!validateMinLength(customerName, VALIDATION.MIN_CUSTOMER_NAME_LENGTH)) {
      toast({
        title: ERROR_MESSAGES.INCOMPLETE_FORM,
        description: `Nama minimal ${VALIDATION.MIN_CUSTOMER_NAME_LENGTH} karakter`,
        variant: 'destructive'
      });
      return false;
    }

    if (!validateMaxLength(customerName, VALIDATION.MAX_CUSTOMER_NAME_LENGTH)) {
      toast({
        title: ERROR_MESSAGES.INCOMPLETE_FORM,
        description: `Nama maksimal ${VALIDATION.MAX_CUSTOMER_NAME_LENGTH} karakter`,
        variant: 'destructive'
      });
      return false;
    }

    // Validate cart
    if (cart.length === 0) {
      toast({
        title: ERROR_MESSAGES.INCOMPLETE_ORDER,
        description: ERROR_MESSAGES.MINIMUM_NAME_AND_MENU,
        variant: 'destructive'
      });
      return false;
    }

    // Validate notes length
    if (notes && !validateMaxLength(notes, VALIDATION.MAX_NOTES_LENGTH)) {
      toast({
        title: ERROR_MESSAGES.INCOMPLETE_FORM,
        description: `Catatan maksimal ${VALIDATION.MAX_NOTES_LENGTH} karakter`,
        variant: 'destructive'
      });
      return false;
    }

    return true;
  }, [customerName, notes, toast]);

  const getFormData = useCallback((cart: OrderItem[], cartTotal: number): Omit<Order, 'id' | 'timestamp'> => {
    return {
      customerName: customerName.trim(),
      items: [...cart],
      notes: notes.trim() || undefined,
      total: cartTotal
    };
  }, [customerName, notes]);

  return {
    customerName,
    notes,
    editingOrder,
    isEditing,
    setCustomerName,
    setNotes,
    loadOrderForEdit,
    resetForm,
    validateForm,
    getFormData,
    initializeUserName
  };
}; 