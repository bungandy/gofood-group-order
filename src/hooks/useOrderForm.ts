import { useState, useCallback } from 'react';
import type { Order, OrderItem } from '@/types';
import { validateRequired, validateMinLength, validateMaxLength } from '@/utils';
import { VALIDATION, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { useToast } from '@/hooks/use-toast';

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
}

export const useOrderForm = (): UseOrderFormReturn => {
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const isEditing = editingOrder !== null;

  const loadOrderForEdit = useCallback((order: Order, setCart: (items: OrderItem[]) => void) => {
    setEditingOrder(order);
    setCustomerName(order.customerName);
    setCart(order.items);
    setNotes(order.notes || '');

    toast({
      title: SUCCESS_MESSAGES.ORDER_LOADED_FOR_EDIT,
      description: `Pesanan ${order.customerName} telah dimuat ke form`
    });
  }, [toast]);

  const resetForm = useCallback((clearCart: () => void) => {
    setCustomerName('');
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
    getFormData
  };
}; 