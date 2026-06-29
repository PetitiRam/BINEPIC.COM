-- JEDIDA Marketplace — Phase 4 schema
-- PETITI (AI engineer/security/ops) + TAUSI (AI product manager) + fraud
-- detection + professional order/delivery tracking + a bounded mechanism
-- for PETITI to manage platform pages/theme/components safely.

-- ===== PETITI: logs, alerts, actions, fraud, system health =====
CREATE TYPE ai_log_level AS ENUM ('info','warning','error','critical');
CREATE TYPE ai_actor AS ENUM ('petiti','tausi');

CREATE TABLE ai_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor       ai_actor NOT NULL,
  level       ai_log_level NOT NULL DEFAULT 'info',
  category    VARCHAR(60) NOT NULL,        -- 'security','platform','marketplace','monitoring','product','ads'
  message     TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_logs_actor_time ON ai_logs(actor, created_at DESC);

CREATE TYPE ai_alert_severity AS ENUM ('low','medium','high','critical');
CREATE TYPE ai_alert_status AS ENUM ('open','acknowledged','resolved','dismissed');

CREATE TABLE ai_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor       ai_actor NOT NULL DEFAULT 'petiti',
  severity    ai_alert_severity NOT NULL DEFAULT 'medium',
  status      ai_alert_status NOT NULL DEFAULT 'open',
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  related_user_id UUID REFERENCES users(id),
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_ai_alerts_status ON ai_alerts(status, severity);

-- every autonomous/admin-triggered action PETITI or TAUSI actually performs
-- (page created, CSS changed, logo updated, product approved by AI, etc.)
CREATE TYPE ai_action_status AS ENUM ('proposed','approved','executed','rejected','failed');

CREATE TABLE ai_actions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor       ai_actor NOT NULL,
  action_type VARCHAR(80) NOT NULL,   -- 'create_page','update_theme','update_logo','create_component','approve_product', ...
  payload     JSONB NOT NULL DEFAULT '{}',
  status      ai_action_status NOT NULL DEFAULT 'proposed',
  result      JSONB DEFAULT '{}',
  requested_by UUID REFERENCES users(id), -- NULL = autonomous
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ
);
CREATE INDEX idx_ai_actions_status ON ai_actions(status);

CREATE TYPE fraud_category AS ENUM (
  'fake_account','bot_registration','suspicious_login','brute_force','multi_account_abuse',
  'scam_listing','duplicate_listing','spam_product','seller_abuse',
  'wallet_abuse','withdrawal_abuse','suspicious_transaction'
);
CREATE TYPE fraud_status AS ENUM ('open','investigating','confirmed','dismissed');

CREATE TABLE fraud_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    fraud_category NOT NULL,
  risk_score  INTEGER NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  status      fraud_status NOT NULL DEFAULT 'open',
  subject_user_id UUID REFERENCES users(id),
  subject_product_id UUID REFERENCES products(id),
  subject_order_id UUID REFERENCES orders(id),
  details     TEXT,
  evidence    JSONB DEFAULT '{}',
  detected_by ai_actor NOT NULL DEFAULT 'petiti',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX idx_fraud_status ON fraud_reports(status, risk_score DESC);

CREATE TABLE system_health (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component   VARCHAR(60) NOT NULL,  -- 'database','api','payments','escrow','auth'
  status      VARCHAR(20) NOT NULL DEFAULT 'healthy', -- healthy | degraded | down
  latency_ms  INTEGER,
  details     TEXT,
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_system_health_component_time ON system_health(component, checked_at DESC);

-- login attempts feed PETITI's brute-force / suspicious-login detection
CREATE TABLE login_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255),
  user_id     UUID REFERENCES users(id),
  success     BOOLEAN NOT NULL,
  ip_address  VARCHAR(64),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_login_attempts_email_time ON login_attempts(email, created_at DESC);

-- ===== Bounded PETITI platform-management capability =====
-- PETITI may create/manage simple CONTENT pages and propose theme/logo/CSS
-- changes through these tables only — never arbitrary filesystem writes.
-- The frontend renders platform_pages dynamically; admin can roll back any
-- entry instantly by deactivating it (no deploy needed, no risk of breaking
-- the hand-built routes/pages).
CREATE TABLE platform_pages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(120) UNIQUE NOT NULL,
  title       VARCHAR(255) NOT NULL,
  content_md  TEXT NOT NULL DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  ai_actor,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_platform_pages_updated_at BEFORE UPDATE ON platform_pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- a versioned, instantly-revertible CSS override layer PETITI can write to
-- (separate from the hand-authored theme.css — never overwritten directly)
CREATE TABLE theme_overrides (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  custom_css  TEXT NOT NULL DEFAULT '',
  logo_url    TEXT,
  updated_by  ai_actor,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (id = 1)
);
INSERT INTO theme_overrides (id) VALUES (1) ON CONFLICT DO NOTHING;

-- a registry of small reusable UI "components" (JSON-described, rendered by
-- a generic frontend component) that PETITI can add without touching code
CREATE TABLE component_registry (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(120) NOT NULL,
  type        VARCHAR(60) NOT NULL,  -- 'banner','callout','stat_card','announcement'
  config      JSONB NOT NULL DEFAULT '{}',
  placement   VARCHAR(60) NOT NULL DEFAULT 'marketplace_header', -- where the frontend mounts it
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by  ai_actor,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== TAUSI: product intelligence, ads, rankings, recommendations =====
CREATE TABLE product_scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quality_score    INTEGER NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  demand_score     INTEGER NOT NULL DEFAULT 0 CHECK (demand_score BETWEEN 0 AND 100),
  trust_score      INTEGER NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  overall_score    INTEGER NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
  notes       TEXT,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_product_scores_product ON product_scores(product_id);

CREATE TABLE product_rankings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category    product_category NOT NULL,
  rank        INTEGER NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_rankings_category ON product_rankings(category, rank);

CREATE TYPE campaign_status AS ENUM ('draft','pending_review','active','paused','ended','rejected');

CREATE TABLE ad_campaigns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID REFERENCES shops(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id),
  title       VARCHAR(255) NOT NULL,
  image_url   TEXT,
  budget      NUMERIC(12,2) NOT NULL DEFAULT 0,
  spent       NUMERIC(12,2) NOT NULL DEFAULT 0,
  status      campaign_status NOT NULL DEFAULT 'draft',
  target_category product_category,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
  performance JSONB DEFAULT '{}', -- {impressions, clicks, conversions}
  performance_score INTEGER NOT NULL DEFAULT 0 CHECK (performance_score BETWEEN 0 AND 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_ad_campaigns_updated_at BEFORE UPDATE ON ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE recommendation_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  product_id  UUID REFERENCES products(id),
  reason      VARCHAR(120),  -- 'trending_in_category','similar_purchase','high_quality_score'
  shown_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  clicked     BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_recommendation_logs_user ON recommendation_logs(user_id, shown_at DESC);

-- ===== Order tracking / delivery =====
CREATE TYPE delivery_status AS ENUM (
  'pending','confirmed','processing','packed','assigned_to_driver',
  'out_for_delivery','delivered','failed_delivery','returned'
);

CREATE TABLE drivers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(60),
  license_plate VARCHAR(60),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  rating      NUMERIC(3,2) DEFAULT 5.0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_drivers_user ON drivers(user_id);

CREATE TABLE deliveries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id   UUID REFERENCES drivers(id),
  status      delivery_status NOT NULL DEFAULT 'pending',
  pickup_address  TEXT,
  dropoff_address TEXT,
  estimated_at    TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_deliveries_order ON deliveries(order_id);
CREATE TRIGGER trg_deliveries_updated_at BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE tracking_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  status      delivery_status NOT NULL,
  note        TEXT,
  location    VARCHAR(255),
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tracking_events_delivery ON tracking_events(delivery_id, created_at);
