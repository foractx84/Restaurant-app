// Database Configuration
export const databaseConfig = {
  PORT: Number(process.env.DB_PORT),
  HOST: process.env.DB_HOST,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD,
  DB: process.env.DB_NAME,
};

// APP Configuration
export const APP_CONFIG = {
  SERVER: process.env.SERVER,
  API_VERSION: process.env.API_VERSION,
  API_BUILD: process.env.API_BUILD,
  NODE_ENV: process.env.NODE_ENV,
  API_PORT: process.env.API_PORT,
  FILE_HOSTING_URL: process.env.FILE_HOSTING_URL,
  IMAGE_HOSTING_URL: process.env.IMAGE_HOSTING_URL,
  IMAGE_LOCAL_PATH: process.env.IMAGE_LOCAL_PATH,
  IMAGE_BUCKET: process.env.IMAGE_BUCKET,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  MAX_MULTER_FILE_SIZE_LIMIT: Number(process.env.MAX_MULTER_FILE_SIZE_LIMIT),
  VIDEO_LOCAL_PATH: process.env.VIDEO_LOCAL_PATH,
  VIDEO_HOSTING_URL: process.env.VIDEO_HOSTING_URL,
};

// Google Cloud Configuration
export const GCP = {
  PROJECT_ID: process.env.GCP_PROJECT_ID,
  LOCATION: process.env.GCP_LOCATION,
};

// Authentication JWT
export const JWT = {
  SECRET_KEY: process.env.JWT_SECRET_KEY,
  ALGORITHM: process.env.JWT_ALGORITHM,
  VALIDITY_MS: Number(process.env.JWT_VALIDITY_MS),
  ADMIN_VALIDITY_MS: Number(process.env.JWT_ADMIN_VALIDITY_MS),
  PERMISSIONS: process.env.JWT_PERMISSIONS,
};

// Onboarding data
export const ONBOARDING = {
  ONBOARDING_VERIFY_EMAIL_URL: process.env.ONBOARDING_VERIFY_EMAIL_URL,
};

// Sendgrid API
export const SENDGRID_API = {
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  TAPTAB_CS_EMAIL: process.env.TAPTAB_CS_EMAIL,
};

// Stripe
export const STRIPE = {
  STRIPE_API_KEY: process.env.STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  TAP_MANAGER_URL: process.env.TAP_MANAGER_URL,
  STRIPE_CONNECT_BASE_URL: process.env.STRIPE_CONNECT_BASE_URL || process.env.TAP_MANAGER_URL,
};

export const MENU_ITEM_MEDIA = {
  MAX_MENU_ITEM_IMAGES_VALUE: Number(process.env.MAX_MENU_ITEM_IMAGES_VALUE),
  MAX_MENU_ITEM_VIDEOS_VALUE: Number(process.env.MAX_MENU_ITEM_VIDEOS_VALUE),
  MAX_MENU_ITEM_THUMBNAILS_VALUE: Number(process.env.MAX_MENU_ITEM_THUMBNAILS_VALUE),
  VIDEO_TRANSCODING_TEMPLATE: process.env.VIDEO_TRANSCODING_TEMPLATE,
};

export const EVENT_MEDIA = {
  MAX_EVENT_IMAGES: Number(process.env.MAX_EVENT_IMAGES_VALUE) || 10,
  MAX_EVENT_VIDEOS: Number(process.env.MAX_EVENT_VIDEOS_VALUE) || 1,
};

export const RESTAURANT_MEDIA = {
  MAX_RESTAURANT_GALLERY_IMAGES_VALUE: Number(process.env.MAX_RESTAURANT_GALLERY_IMAGES_VALUE),
  MAX_RESTAURANT_PROFILE_IMAGES_VALUE: Number(process.env.MAX_RESTAURANT_PROFILE_IMAGES_VALUE),
};

export const CHECKMATE = {
  CLIENT_ID: process.env.CHECKMATE_CLIENT_ID,
  HOSTNAME: process.env.CHECKMATE_HOSTNAME,
  REDIRECT_URI: process.env.CHECKMATE_REDIRECT_URI,
  SECRET: process.env.CHECKMATE_SECRET,
};

export const OTTER = {
  APPLICATION_ID: process.env.OTTER_APPLICATION_ID,
  CLIENT_SECRET: process.env.OTTER_CLIENT_SECRET,
  BASE_URL: process.env.OTTER_API_BASE_URL ?? 'https://partners.cloudkitchens.com',
  /** Redirect URI registered in the Otter Developer Portal for the authorization-code flow. */
  REDIRECT_URI: process.env.OTTER_REDIRECT_URI,
  /**
   * Scopes for client-credentials (server-to-server) calls, including menu sync (`menus.read`) and
   * menu push (`menus.upsert`, `menus.async_job.read`).
   * Organization onboarding uses {@link ORG_SCOPES} with the authorization-code grant instead.
   */
  SCOPES:
    process.env.OTTER_SCOPES ??
    'callback.error.write menus.async_job.read menus.entity_suspension menus.get_current menus.publish menus.read menus.upsert menus.upsert_hours orders.create orders.update ping storefront.store_availability',
  /**
   * Scopes requested during organization onboarding (authorization-code flow).
   * @see https://developer-guides.tryotter.com/docs/organization-integrations-onboarding-flow/
   */
  ORG_SCOPES: process.env.OTTER_ORG_SCOPES ?? 'organization.read organization.service_integration',
  WEBHOOK_SECRET: process.env.OTTER_WEBHOOK_SECRET,
  /** Manager frontend base URL; the OAuth callback redirects here to hand control back to the UI. */
  MANAGER_FRONTEND_URL: process.env.TAP_MANAGER_URL,
};
