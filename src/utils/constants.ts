
// Application constants for production deployment
export const APP_CONFIG = {
  APP_NAME: 'NovaAgenda',
  APP_VERSION: '1.0.0',
  COMPANY_NAME: 'Nova Medicina e Segurança do Trabalho',
  SUPPORT_EMAIL: 'suporte@novamedicina.com.br',
  
  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  
  // Date and time configuration
  TIMEZONE: 'America/Sao_Paulo',
  DATE_FORMAT: 'dd/MM/yyyy',
  DATETIME_FORMAT: 'dd/MM/yyyy HH:mm',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // Cache keys
  CACHE_KEYS: {
    USER_PROFILE: 'user_profile',
    COMPANIES: 'companies',
    EMPLOYEES: 'employees',
    APPOINTMENTS: 'appointments',
    EXAM_TYPES: 'exam_types',
    NOTIFICATIONS: 'notifications'
  } as const,
  
  // Query stale times (in milliseconds)
  STALE_TIME: {
    SHORT: 1 * 60 * 1000,    // 1 minute
    MEDIUM: 5 * 60 * 1000,   // 5 minutes
    LONG: 15 * 60 * 1000     // 15 minutes
  } as const
};

// Environment-specific configuration
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Feature flags
  FEATURES: {
    ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
    ENABLE_DEBUG_LOGS: process.env.NODE_ENV === 'development',
    ENABLE_ERROR_REPORTING: process.env.NODE_ENV === 'production'
  }
} as const;
