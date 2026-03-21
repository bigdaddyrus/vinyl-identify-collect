-- ============================================================================
-- Vision-AI Identifier Platform — Initial Schema
-- Multi-tenant via app_id, anonymous-first auth
-- ============================================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. apps — App Registry
-- ============================================================================
CREATE TABLE apps (
  id            TEXT PRIMARY KEY,                  -- 'stampsnap', 'coinsnap', etc.
  display_name  TEXT NOT NULL,
  description   TEXT,
  bundle_id     TEXT,
  config        JSONB DEFAULT '{}'::jsonb,         -- Full appConfig blob
  ai_provider   TEXT DEFAULT 'gemini',
  ai_model      TEXT DEFAULT 'gemini-2.5-flash',
  ai_system_prompt TEXT,
  ai_temperature REAL DEFAULT 0.3,
  ai_max_tokens  INT DEFAULT 2048,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. profiles — Users (scoped per app)
-- ============================================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id        TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  display_name  TEXT,
  email         TEXT,
  avatar_url    TEXT,
  auth_provider TEXT DEFAULT 'anonymous',
  is_anonymous  BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (auth_user_id, app_id)
);

CREATE INDEX idx_profiles_auth_user_id ON profiles(auth_user_id);

-- ============================================================================
-- 3. user_preferences — App State (per user per app)
-- ============================================================================
CREATE TABLE user_preferences (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  app_id                    TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  has_completed_onboarding  BOOLEAN DEFAULT false,
  has_seen_paywall          BOOLEAN DEFAULT false,
  has_seen_snap_tips        BOOLEAN DEFAULT false,
  has_triggered_review      BOOLEAN DEFAULT false,
  scan_count                INT DEFAULT 0,
  custom_preferences        JSONB DEFAULT '{}'::jsonb,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now(),
  UNIQUE (profile_id, app_id)
);

-- ============================================================================
-- 4. subscriptions — RevenueCat Integration Point
-- ============================================================================
CREATE TABLE subscriptions (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  app_id                    TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  is_premium                BOOLEAN DEFAULT false,
  revenuecat_customer_id    TEXT,
  product_id                TEXT,
  status                    TEXT DEFAULT 'none'
                              CHECK (status IN ('none','trial','active','expired','cancelled')),
  plan_type                 TEXT CHECK (plan_type IN ('weekly','monthly','yearly')),
  trial_start               TIMESTAMPTZ,
  trial_end                 TIMESTAMPTZ,
  current_period_start      TIMESTAMPTZ,
  current_period_end        TIMESTAMPTZ,
  store                     TEXT CHECK (store IN ('app_store','play_store')),
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now(),
  UNIQUE (profile_id, app_id)
);

CREATE INDEX idx_subscriptions_revenuecat ON subscriptions(revenuecat_customer_id);

-- ============================================================================
-- 5. scans — Every Scan Attempt (analytics)
-- ============================================================================
CREATE TABLE scans (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  app_id              TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  client_scan_id      TEXT,
  image_source        TEXT CHECK (image_source IN ('camera','gallery')),
  original_image_path TEXT,
  cropped_image_path  TEXT,
  ai_result           JSONB,
  ai_model_used       TEXT,
  ai_latency_ms       INT,
  ai_confidence       REAL,
  status              TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending','completed','failed')),
  saved_to_collection BOOLEAN DEFAULT false,
  collection_item_id  UUID,
  client_created_at   BIGINT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_scans_profile_app ON scans(profile_id, app_id);

-- ============================================================================
-- 6. collection_items — User's Curated Portfolio
-- ============================================================================
CREATE TABLE collection_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  app_id            TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  scan_id           UUID REFERENCES scans(id) ON DELETE SET NULL,
  client_item_id    TEXT,
  name              TEXT NOT NULL,
  origin            TEXT,
  year              TEXT,
  estimated_value   NUMERIC(15,2) DEFAULT 0,
  confidence        REAL DEFAULT 0,
  description       TEXT,
  rarity            TEXT,
  condition         TEXT,
  extended_details  JSONB,
  image_path        TEXT,
  thumbnail_path    TEXT,
  user_notes        TEXT,
  is_favorite       BOOLEAN DEFAULT false,
  is_deleted        BOOLEAN DEFAULT false,
  client_created_at BIGINT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_collection_items_profile_app
  ON collection_items(profile_id, app_id) WHERE NOT is_deleted;
CREATE INDEX idx_collection_items_value
  ON collection_items(app_id, estimated_value DESC);
CREATE INDEX idx_collection_items_fts
  ON collection_items USING gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'')));
CREATE INDEX idx_collection_items_details
  ON collection_items USING gin(extended_details jsonb_path_ops);

-- Add FK from scans → collection_items (deferred because of ordering)
ALTER TABLE scans
  ADD CONSTRAINT fk_scans_collection_item
  FOREIGN KEY (collection_item_id) REFERENCES collection_items(id) ON DELETE SET NULL;

-- ============================================================================
-- 7. images — Storage Metadata
-- ============================================================================
CREATE TABLE images (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  app_id              TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  bucket_id           TEXT DEFAULT 'scan-images',
  storage_path        TEXT NOT NULL,
  mime_type           TEXT DEFAULT 'image/jpeg',
  file_size_bytes     BIGINT,
  image_type          TEXT CHECK (image_type IN ('scan_original','scan_cropped','thumbnail')),
  scan_id             UUID REFERENCES scans(id) ON DELETE SET NULL,
  collection_item_id  UUID REFERENCES collection_items(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_apps
  BEFORE UPDATE ON apps FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_user_preferences
  BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_collection_items
  BEFORE UPDATE ON collection_items FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auto-create profile when a new auth user signs up (reads app_id from metadata)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _app_id TEXT;
BEGIN
  _app_id := NEW.raw_user_meta_data->>'app_id';
  IF _app_id IS NOT NULL AND EXISTS (SELECT 1 FROM apps WHERE id = _app_id) THEN
    INSERT INTO profiles (auth_user_id, app_id, is_anonymous, auth_provider)
    VALUES (
      NEW.id,
      _app_id,
      NEW.is_anonymous,
      CASE WHEN NEW.is_anonymous THEN 'anonymous' ELSE coalesce(NEW.raw_app_meta_data->>'provider', 'email') END
    )
    ON CONFLICT (auth_user_id, app_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-create user_preferences + subscriptions when a profile is created
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (profile_id, app_id)
  VALUES (NEW.id, NEW.app_id)
  ON CONFLICT (profile_id, app_id) DO NOTHING;

  INSERT INTO subscriptions (profile_id, app_id)
  VALUES (NEW.id, NEW.app_id)
  ON CONFLICT (profile_id, app_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile();

-- Collection stats function (for portfolio header)
CREATE OR REPLACE FUNCTION get_collection_stats(_profile_id UUID, _app_id TEXT)
RETURNS TABLE (
  total_items   BIGINT,
  total_value   NUMERIC,
  unique_origins BIGINT,
  best_item_id  UUID,
  best_item_name TEXT,
  best_item_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH items AS (
    SELECT * FROM collection_items
    WHERE profile_id = _profile_id
      AND app_id = _app_id
      AND NOT is_deleted
  ),
  best AS (
    SELECT id, name, estimated_value
    FROM items
    ORDER BY estimated_value DESC
    LIMIT 1
  )
  SELECT
    (SELECT count(*) FROM items)::BIGINT AS total_items,
    (SELECT coalesce(sum(estimated_value), 0) FROM items) AS total_value,
    (SELECT count(DISTINCT origin) FROM items)::BIGINT AS unique_origins,
    (SELECT id FROM best) AS best_item_id,
    (SELECT name FROM best) AS best_item_name,
    (SELECT estimated_value FROM best) AS best_item_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Row-Level Security (RLS)
-- ============================================================================

-- Helper: get profile IDs owned by the current auth user
CREATE OR REPLACE FUNCTION auth_profile_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- apps: publicly readable, only service_role can modify
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Apps are publicly readable"
  ON apps FOR SELECT USING (true);
CREATE POLICY "Only service_role can modify apps"
  ON apps FOR ALL USING (auth.role() = 'service_role');

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profiles"
  ON profiles FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "Users can update own profiles"
  ON profiles FOR UPDATE USING (auth_user_id = auth.uid());

-- user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL USING (profile_id IN (SELECT auth_profile_ids()));

-- subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT USING (profile_id IN (SELECT auth_profile_ids()));
CREATE POLICY "Only service_role can modify subscriptions"
  ON subscriptions FOR INSERT USING (auth.role() = 'service_role');
CREATE POLICY "Only service_role can update subscriptions"
  ON subscriptions FOR UPDATE USING (auth.role() = 'service_role');

-- scans
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own scans"
  ON scans FOR ALL USING (profile_id IN (SELECT auth_profile_ids()));

-- collection_items
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own collection items"
  ON collection_items FOR ALL USING (profile_id IN (SELECT auth_profile_ids()));

-- images
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own images"
  ON images FOR ALL USING (profile_id IN (SELECT auth_profile_ids()));

-- ============================================================================
-- Storage Bucket
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scan-images',
  'scan-images',
  false,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access paths containing their own profile_id
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'scan-images'
    AND (storage.foldername(name))[2]::uuid IN (SELECT auth_profile_ids())
  );

CREATE POLICY "Users can view own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'scan-images'
    AND (storage.foldername(name))[2]::uuid IN (SELECT auth_profile_ids())
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'scan-images'
    AND (storage.foldername(name))[2]::uuid IN (SELECT auth_profile_ids())
  );

-- ============================================================================
-- Seed: Register the StampSnap app
-- ============================================================================
INSERT INTO apps (id, display_name, description, bundle_id, ai_provider, ai_model, ai_system_prompt, ai_temperature, ai_max_tokens)
VALUES (
  'stampsnap',
  'StampSnap',
  'AI-powered stamp identification and valuation',
  'com.visionidentifier.app',
  'gemini',
  'gemini-2.5-flash',
  'You are an expert philatelist and stamp appraiser.',
  0.3,
  4096
)
ON CONFLICT (id) DO NOTHING;
