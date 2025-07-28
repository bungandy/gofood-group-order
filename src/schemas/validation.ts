import { z } from 'zod';
import { VALIDATION } from '@/constants';

// Order form validation schema
export const orderFormSchema = z.object({
  customerName: z
    .string()
    .min(VALIDATION.MIN_CUSTOMER_NAME_LENGTH, `Nama minimal ${VALIDATION.MIN_CUSTOMER_NAME_LENGTH} karakter`)
    .max(VALIDATION.MAX_CUSTOMER_NAME_LENGTH, `Nama maksimal ${VALIDATION.MAX_CUSTOMER_NAME_LENGTH} karakter`)
    .trim(),
  notes: z
    .string()
    .max(VALIDATION.MAX_NOTES_LENGTH, `Catatan maksimal ${VALIDATION.MAX_NOTES_LENGTH} karakter`)
    .optional(),
  items: z
    .array(z.object({
      menuItem: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number().positive(),
        description: z.string().optional(),
        merchantId: z.string()
      }),
      quantity: z
        .number()
        .min(VALIDATION.MIN_ORDER_QUANTITY)
        .max(VALIDATION.MAX_ORDER_QUANTITY)
    }))
    .min(1, 'Minimal pilih 1 menu')
});

// Session creation validation schema
export const sessionFormSchema = z.object({
  merchants: z
    .array(z.object({
      name: z.string().min(1, 'Nama merchant wajib diisi').trim(),
      link: z.string().url('Link GoFood tidak valid').trim()
    }))
    .min(VALIDATION.MIN_MERCHANTS, `Minimal ${VALIDATION.MIN_MERCHANTS} merchant`)
    .max(VALIDATION.MAX_MERCHANTS, `Maksimal ${VALIDATION.MAX_MERCHANTS} merchant`)
    .refine(
      merchants => merchants.filter(m => m.name && m.link).length > 0,
      'Minimal satu merchant harus diisi lengkap'
    )
});

// GoFood URL validation schema
export const gofoodUrlSchema = z
  .string()
  .url('URL tidak valid')
  .regex(
    /^https:\/\/gofood\.co\.id\/[^\/]+\/restaurant\/[^\/]+-[a-f0-9-]{36}$/i,
    'Format URL GoFood tidak valid'
  );

// Chat message validation schema
export const chatMessageSchema = z.object({
  senderName: z.string().min(1, 'Nama pengirim wajib diisi').trim(),
  message: z.string().min(1, 'Pesan tidak boleh kosong').max(500, 'Pesan maksimal 500 karakter').trim(),
  mentions: z.array(z.string()).optional()
});

// Menu item validation schema
export const menuItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nama menu wajib diisi'),
  price: z.number().positive('Harga harus lebih dari 0'),
  description: z.string().optional(),
  merchantId: z.string(),
  image: z.string().url().optional()
});

// Merchant validation schema
export const merchantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nama merchant wajib diisi'),
  link: gofoodUrlSchema
});

// Order validation schema
export const orderSchema = z.object({
  id: z.string(),
  customerName: z.string().min(VALIDATION.MIN_CUSTOMER_NAME_LENGTH),
  items: z.array(z.object({
    menuItem: menuItemSchema,
    quantity: z.number().min(VALIDATION.MIN_ORDER_QUANTITY).max(VALIDATION.MAX_ORDER_QUANTITY)
  })).min(1),
  notes: z.string().max(VALIDATION.MAX_NOTES_LENGTH).optional(),
  total: z.number().min(0),
  timestamp: z.string()
});

// Session data validation schema
export const sessionDataSchema = z.object({
  sessionId: z.string(),
  sessionName: z.string().min(1, 'Nama sesi wajib diisi'),
  merchants: z.array(merchantSchema)
});

// Type exports
export type OrderFormData = z.infer<typeof orderFormSchema>;
export type SessionFormData = z.infer<typeof sessionFormSchema>;
export type ChatMessageData = z.infer<typeof chatMessageSchema>;
export type MenuItemData = z.infer<typeof menuItemSchema>;
export type MerchantData = z.infer<typeof merchantSchema>;
export type OrderData = z.infer<typeof orderSchema>;
export type SessionDataType = z.infer<typeof sessionDataSchema>; 