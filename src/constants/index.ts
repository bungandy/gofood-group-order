// API Configuration
export const API_CONFIG = {
  GOFOOD_BASE_URL: 'https://api.gojekapi.com/gofood/consumer/v5/restaurants',
  DEFAULT_LOCATION: '-6.2032022,106.715', // Jakarta coordinates
  AUTH_TOKEN: 'eyJhbGciOiJkaXIiLCJjdHkiOiJKV1QiLCJlbmMiOiJBMTI4R0NNIiwidHlwIjoiSldUIiwiemlwIjoiREVGIn0..OWL0Ul4brzZjMwhc.DRe5zO4xm25iaR9hgbFnjQ9VarjKoKC0kAWoIlf6fVLDzaoqUA7sISuCyYb83DompahxEgmffOf7sQOPbeEc3c2z6ARPwFS3V6OlEvEX8MjFAX5cpzFMJ_iFN-wKWWA5a3__-HIMbtI-Lq71Ohn67ACRntZDajTgcmBSnjGAB9FoL4J6Z6-ry_nz61jq_NM-CP963b_nfb6m_dI_TdF9FBdfAshyWpiVQJcP4_u5SrBbAk9AQRwYKJLRUtWvwNEn5Nx65vNTsnE1Qfd_A3_ubhx1uSNBAc1VK44iYdN2fMY7JdI7xFz7QiZH28wfRxRLccf9igNY2yoO7OOH9oHO4BHiIJ5anFOhyGyleLoZBUI38l6aF6og0OBlgcG2qpXfaodnQ05k-_Q9FL0a4LHlf0TZMOu4wAGclx-kNIMZ6C6pzWTObp2lS2ENXaEpq3rW9ZxusIng3vRiNuKVrXVlxN-tglb8552W7WFFoNRy0y_Mxo8LwJUEWqFnvGm-dsA0S7SnNfut1g29jmkgW2EmKWfKr1i7-nB-vxlgkljeA_z4XQjNd0jrQHRbwd0LQT735FdCxdI8_qPA1VRcKNvx48sKlL9S3L2iBU3cPNjtyqhBOl8DTMMl2jejgcAaaEso-5QjRQePVwnaBugZoc6mQ-pFScc9BNVcVCm0bj7UcxgIuUUxH9rLAEtgR8NrU93Yc1NO7ih0vTB_cqlCjqQFOTrfuiCckhu1OGRLT184oEui950b0dV22t_ou341himF_GbxbyWA1ZYV3h6uzFSyQQFfUDS_EIar1_5596fHIHM9IRpIrjMQWh5_JTloPgdPwFMcSVgobwvNQbuhddYuGO5R8LQS2R76VnuQPiyZ4ZxucFjUPqd9Tzmw3pHOP4qUyQGcHNFVN2tcQhdOSKNWymIsXRg3-X5mzorrt6pQxOR7Xoa1q_Zzxh5uMmk5mkaPMmE.POHpRDKClBxvJ42dE6fmpg'
} as const;

// UI Constants
export const UI_CONFIG = {
  TOAST_DURATION: 2000,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  MAX_VISIBLE_ITEMS: 4,
  MERCHANT_EXPANSION_THRESHOLD: 4
} as const;

// Route paths
export const ROUTES = {
  HOME: '/',
  ORDER: '/order/:sessionId',
  OVERVIEW: '/order/:sessionId/overview',
  NOT_FOUND: '*'
} as const;

// Validation rules
export const VALIDATION = {
  MIN_MERCHANTS: 1,
  MAX_MERCHANTS: 10,
  MIN_ORDER_QUANTITY: 1,
  MAX_ORDER_QUANTITY: 99,
  MIN_CUSTOMER_NAME_LENGTH: 2,
  MAX_CUSTOMER_NAME_LENGTH: 50,
  MAX_NOTES_LENGTH: 200
} as const;

// Currency formatting
export const CURRENCY = {
  LOCALE: 'id-ID',
  CURRENCY_CODE: 'IDR'
} as const;

// Mock data for development
export const MOCK_MERCHANTS = [
  {
    id: 'merchant_1',
    name: 'Warung Gudeg Bu Sari',
    link: 'https://gofood.co.id/warung-gudeg'
  },
  {
    id: 'merchant_2', 
    name: 'Ayam Geprek Bensu',
    link: 'https://gofood.co.id/ayam-geprek'
  },
  {
    id: 'merchant_3',
    name: 'Bakso Solo Samrat',
    link: 'https://gofood.co.id/bakso-solo'
  }
] as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_GOFOOD_URL: 'URL GoFood tidak valid',
  FAILED_TO_FETCH_MERCHANT: 'Gagal mengambil data merchant dari GoFood API',
  GOFOOD_API_ERROR: 'GoFood API mengalami masalah. Kemungkinan token expired atau ada perubahan API.',
  GOFOOD_TOKEN_EXPIRED: 'Token akses GoFood sudah expired. Silakan hubungi developer untuk memperbarui token.',
  INCOMPLETE_FORM: 'Form tidak lengkap',
  FAILED_TO_CREATE_SESSION: 'Gagal membuat sesi',
  FAILED_TO_LOAD_SESSION: 'Gagal memuat sesi',
  FAILED_TO_SAVE_ORDER: 'Gagal menyimpan pesanan',
  FAILED_TO_UPDATE_ORDER: 'Gagal memperbarui pesanan',
  FAILED_TO_DELETE_ORDER: 'Gagal menghapus pesanan',
  FAILED_TO_SEND_MESSAGE: 'Gagal mengirim pesan',
  INCOMPLETE_ORDER: 'Pesanan tidak lengkap',
  MINIMUM_ONE_MERCHANT: 'Silakan isi minimal satu merchant dengan nama dan link GoFood',
  MINIMUM_NAME_AND_MENU: 'Silakan isi nama dan pilih minimal 1 menu'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  SESSION_CREATED: 'Sesi berhasil dibuat!',
  ORDER_ADDED: 'Pesanan berhasil ditambahkan!',
  ORDER_UPDATED: 'Pesanan berhasil diperbarui!',
  ORDER_DELETED: 'Pesanan dihapus',
  LINK_COPIED: 'Link disalin!',
  MESSAGE_SENT: 'Pesan terkirim',
  ORDER_LOADED_FOR_EDIT: 'Pesanan dimuat untuk diedit'
} as const; 