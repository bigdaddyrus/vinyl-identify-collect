/**
 * Supabase Database Types
 * Multi-tenant schema (7 tables).
 *
 * For Insert types: columns with DB defaults are optional (id, created_at, etc.)
 * For Update types: all columns are optional except PKs (can't change them)
 */

// ── Row Types ──

export interface AppRow {
  id: string;
  display_name: string;
  description: string | null;
  bundle_id: string | null;
  config: Record<string, unknown>;
  ai_provider: string;
  ai_model: string;
  ai_system_prompt: string | null;
  ai_temperature: number;
  ai_max_tokens: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  auth_user_id: string;
  app_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  auth_provider: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesRow {
  id: string;
  profile_id: string;
  app_id: string;
  has_completed_onboarding: boolean;
  has_seen_paywall: boolean;
  has_seen_snap_tips: boolean;
  has_triggered_review: boolean;
  scan_count: number;
  custom_preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRow {
  id: string;
  profile_id: string;
  app_id: string;
  is_premium: boolean;
  revenuecat_customer_id: string | null;
  product_id: string | null;
  status: 'none' | 'trial' | 'active' | 'expired' | 'cancelled';
  plan_type: 'weekly' | 'monthly' | 'yearly' | null;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  store: 'app_store' | 'play_store' | null;
  created_at: string;
  updated_at: string;
}

export interface ScanRow {
  id: string;
  profile_id: string;
  app_id: string;
  client_scan_id: string | null;
  image_source: 'camera' | 'gallery' | null;
  original_image_path: string | null;
  cropped_image_path: string | null;
  ai_result: Record<string, unknown> | null;
  ai_model_used: string | null;
  ai_latency_ms: number | null;
  ai_confidence: number | null;
  status: 'pending' | 'completed' | 'failed';
  saved_to_collection: boolean;
  collection_item_id: string | null;
  client_created_at: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface CollectionItemRow {
  id: string;
  profile_id: string;
  app_id: string;
  scan_id: string | null;
  client_item_id: string | null;
  name: string;
  origin: string | null;
  year: string | null;
  estimated_value: number;
  confidence: number;
  description: string | null;
  rarity: string | null;
  condition: string | null;
  extended_details: Record<string, unknown>[] | null;
  image_path: string | null;
  thumbnail_path: string | null;
  user_notes: string | null;
  is_favorite: boolean;
  is_deleted: boolean;
  client_created_at: number | null;
  created_at: string;
  updated_at: string;
}

export interface ImageRow {
  id: string;
  profile_id: string;
  app_id: string;
  bucket_id: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number | null;
  image_type: 'scan_original' | 'scan_cropped' | 'thumbnail' | null;
  scan_id: string | null;
  collection_item_id: string | null;
  created_at: string;
}

// ── Insert Types (DB-defaulted columns are optional) ──

export interface AppInsert {
  id: string;
  display_name: string;
  description?: string | null;
  bundle_id?: string | null;
  config?: Record<string, unknown>;
  ai_provider?: string;
  ai_model?: string;
  ai_system_prompt?: string | null;
  ai_temperature?: number;
  ai_max_tokens?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileInsert {
  id?: string;
  auth_user_id: string;
  app_id: string;
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  auth_provider?: string;
  is_anonymous?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferencesInsert {
  id?: string;
  profile_id: string;
  app_id: string;
  has_completed_onboarding?: boolean;
  has_seen_paywall?: boolean;
  has_seen_snap_tips?: boolean;
  has_triggered_review?: boolean;
  scan_count?: number;
  custom_preferences?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionInsert {
  id?: string;
  profile_id: string;
  app_id: string;
  is_premium?: boolean;
  revenuecat_customer_id?: string | null;
  product_id?: string | null;
  status?: 'none' | 'trial' | 'active' | 'expired' | 'cancelled';
  plan_type?: 'weekly' | 'monthly' | 'yearly' | null;
  trial_start?: string | null;
  trial_end?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  store?: 'app_store' | 'play_store' | null;
  created_at?: string;
  updated_at?: string;
}

export interface ScanInsert {
  id?: string;
  profile_id: string;
  app_id: string;
  client_scan_id?: string | null;
  image_source?: 'camera' | 'gallery' | null;
  original_image_path?: string | null;
  cropped_image_path?: string | null;
  ai_result?: Record<string, unknown> | null;
  ai_model_used?: string | null;
  ai_latency_ms?: number | null;
  ai_confidence?: number | null;
  status?: 'pending' | 'completed' | 'failed';
  saved_to_collection?: boolean;
  collection_item_id?: string | null;
  client_created_at?: number | null;
  created_at?: string;
  completed_at?: string | null;
}

export interface CollectionItemInsert {
  id?: string;
  profile_id: string;
  app_id: string;
  scan_id?: string | null;
  client_item_id?: string | null;
  name: string;
  origin?: string | null;
  year?: string | null;
  estimated_value?: number;
  confidence?: number;
  description?: string | null;
  rarity?: string | null;
  condition?: string | null;
  extended_details?: Record<string, unknown>[] | null;
  image_path?: string | null;
  thumbnail_path?: string | null;
  user_notes?: string | null;
  is_favorite?: boolean;
  is_deleted?: boolean;
  client_created_at?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ImageInsert {
  id?: string;
  profile_id: string;
  app_id: string;
  bucket_id?: string;
  storage_path: string;
  mime_type?: string;
  file_size_bytes?: number | null;
  image_type?: 'scan_original' | 'scan_cropped' | 'thumbnail' | null;
  scan_id?: string | null;
  collection_item_id?: string | null;
  created_at?: string;
}

// ── Update Types (all optional) ──

export type AppUpdate = Partial<AppRow>;
export type ProfileUpdate = Partial<ProfileRow>;
export type UserPreferencesUpdate = Partial<UserPreferencesRow>;
export type SubscriptionUpdate = Partial<SubscriptionRow>;
export type ScanUpdate = Partial<ScanRow>;
export type CollectionItemUpdate = Partial<CollectionItemRow>;
export type ImageUpdate = Partial<ImageRow>;

// ── Relationship placeholder ──

type EmptyRelationships = { foreignKeyName: string; columns: string[]; referencedRelation: string; referencedColumns: string[] }[];

// ── Database Interface ──

export interface Database {
  public: {
    Tables: {
      apps: {
        Row: AppRow;
        Insert: AppInsert;
        Update: AppUpdate;
        Relationships: EmptyRelationships;
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: EmptyRelationships;
      };
      user_preferences: {
        Row: UserPreferencesRow;
        Insert: UserPreferencesInsert;
        Update: UserPreferencesUpdate;
        Relationships: EmptyRelationships;
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: SubscriptionInsert;
        Update: SubscriptionUpdate;
        Relationships: EmptyRelationships;
      };
      scans: {
        Row: ScanRow;
        Insert: ScanInsert;
        Update: ScanUpdate;
        Relationships: EmptyRelationships;
      };
      collection_items: {
        Row: CollectionItemRow;
        Insert: CollectionItemInsert;
        Update: CollectionItemUpdate;
        Relationships: EmptyRelationships;
      };
      images: {
        Row: ImageRow;
        Insert: ImageInsert;
        Update: ImageUpdate;
        Relationships: EmptyRelationships;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_collection_stats: {
        Args: { _profile_id: string; _app_id: string };
        Returns: CollectionStats[];
      };
      auth_profile_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ── Derived Types ──

export interface CollectionStats {
  total_items: number;
  total_value: number;
  unique_origins: number;
  best_item_id: string | null;
  best_item_name: string | null;
  best_item_value: number | null;
}

export type SubscriptionStatus = SubscriptionRow['status'];
export type ImageType = NonNullable<ImageRow['image_type']>;

export interface SyncOperation {
  id: string;
  type: 'upsert_collection_item' | 'delete_collection_item' | 'update_preferences' | 'upload_image';
  payload: Record<string, unknown>;
  created_at: number;
  retries: number;
}
