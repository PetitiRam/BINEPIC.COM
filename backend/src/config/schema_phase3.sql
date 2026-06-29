-- JEDIDA Marketplace — Phase 3 schema
-- Orders, escrow-backed payments, ads, delivery, admin<->user chat, platform settings.

CREATE TYPE order_status AS ENUM (
  'pending_payment','paid_escrow','shipped','delivered_confirmed','completed','cancelled','disputed'
);
CREATE TYPE payment_method AS ENUM ('stripe','flutterwave','dpo','coinbase','wallet');
CREATE TYPE payment_status AS ENUM ('initiated','succeeded','failed','refunded');

CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id            UUID NOT NULL REFERENCES users(id),
  shop_id             UUID NOT NULL REFERENCES shops(id),
  product_id          UUID NOT NULL REFERENCES products(id),
  quantity            INTEGER NOT NULL DEFAULT 1,
  unit_price          NUMERIC(12,2) NOT NULL,
  currency            VARCHAR(10) NOT NULL DEFAULT 'USD',
  platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 5,
  platform_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount        NUMERIC(12,2) NOT NULL,
  status              order_status NOT NULL DEFAULT 'pending_payment',
  buyer_confirmed_delivery   BOOLEAN NOT NULL DEFAULT FALSE,
  seller_confirmed_delivery  BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_confirmed         BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_personnel_id      UUID REFERENCES users(id),
  shipping_address     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_shop ON orders(shop_id);
CREATE INDEX idx_orders_delivery ON orders(delivery_personnel_id);
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method              payment_method NOT NULL,
  amount              NUMERIC(12,2) NOT NULL,
  currency            VARCHAR(10) NOT NULL,
  status              payment_status NOT NULL DEFAULT 'initiated',
  provider_reference  VARCHAR(255),
  raw_response        JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order ON payments(order_id);

-- escrow ledger: every movement into/out of the shared escrow wallet, tied to an order
CREATE TABLE escrow_ledger (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  direction           VARCHAR(10) NOT NULL CHECK (direction IN ('in','out')),
  amount              NUMERIC(12,2) NOT NULL,
  note                TEXT,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== ADS (admin-uploaded, shown in marketplace headers) =====
CREATE TABLE ads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               VARCHAR(255) NOT NULL,
  image_url           TEXT NOT NULL,
  link_url            TEXT,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== CHAT (delivery/seller/buyer <-> admin only) =====
CREATE TABLE chat_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id), -- the non-admin participant
  sender_id           UUID NOT NULL REFERENCES users(id),
  body                TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_user ON chat_messages(user_id, created_at);

-- ===== PLATFORM SETTINGS (admin-controlled, singleton row) =====
CREATE TABLE platform_settings (
  id                  INTEGER PRIMARY KEY DEFAULT 1,
  logo_url            TEXT,
  theme_primary_color VARCHAR(20) DEFAULT '#1B4332',
  theme_accent_color  VARCHAR(20) DEFAULT '#E0A93C',
  product_card_orientation VARCHAR(20) DEFAULT 'grid', -- 'grid' | 'list'
  platform_fee_percent NUMERIC(5,2) DEFAULT 5,
  upgrade_fee_amount   NUMERIC(12,2) DEFAULT 1000,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (id = 1)
);
INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON platform_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- seller subscription (simple flag already on shops.subscription_active);
-- demo/featured products flag for the Get Started landing page
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
