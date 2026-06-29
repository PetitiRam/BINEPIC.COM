-- JEDIDA Marketplace — Phase 1 schema
-- Foundation: users (buyer -> seller/delivery/admin upgrade path), shops, wallets, KYC, auth tokens

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- ===== ENUM TYPES =====
CREATE TYPE user_role        AS ENUM ('buyer', 'seller', 'delivery', 'admin');
CREATE TYPE account_status   AS ENUM ('pending', 'active', 'suspended', 'rejected');
CREATE TYPE kyc_status       AS ENUM ('not_submitted', 'pending', 'approved', 'rejected');
CREATE TYPE upgrade_status   AS ENUM ('none', 'pending_payment', 'pending_approval', 'approved', 'rejected');

-- ===== USERS =====
-- Every account starts as a buyer. A user can hold an additional role
-- (seller or delivery) tracked in role_upgrades below. Admin role is
-- assigned only by an existing admin (see admin_assignments).
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) UNIQUE NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    full_name           VARCHAR(255) NOT NULL,
    phone_number        VARCHAR(32) NOT NULL,
    phone_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    location_country    VARCHAR(100),
    location_city       VARCHAR(100),
    location_lat        DECIMAL(10,6),
    location_lng        DECIMAL(10,6),
    primary_role        user_role NOT NULL DEFAULT 'buyer',
    is_admin            BOOLEAN NOT NULL DEFAULT FALSE,
    status              account_status NOT NULL DEFAULT 'active',
    kyc_status          kyc_status NOT NULL DEFAULT 'not_submitted',
    avatar_url          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(primary_role);

-- ===== ROLE UPGRADES (buyer -> seller / delivery) =====
-- Every upgrade requires the 1000 (platform currency unit) mobile money
-- verification fee, paid into the platform wallet, then admin approval.
CREATE TABLE role_upgrades (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_role      user_role NOT NULL CHECK (requested_role IN ('seller','delivery')),
    status              upgrade_status NOT NULL DEFAULT 'none',
    verification_fee_paid BOOLEAN NOT NULL DEFAULT FALSE,
    verification_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 1000,
    payment_reference   VARCHAR(255),
    reviewed_by         UUID REFERENCES users(id),
    reviewed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_role_upgrades_user ON role_upgrades(user_id);

-- ===== ADMIN ASSIGNMENTS (only an admin can promote another user to admin) =====
CREATE TABLE admin_assignments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by         UUID NOT NULL REFERENCES users(id),
    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== KYC SUBMISSIONS =====
CREATE TABLE kyc_submissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id_document_url     TEXT NOT NULL,
    selfie_url          TEXT,
    document_type       VARCHAR(50),
    status              kyc_status NOT NULL DEFAULT 'pending',
    reviewed_by         UUID REFERENCES users(id),
    reviewer_notes      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at         TIMESTAMPTZ
);

-- ===== SHOPS (created once seller upgrade is approved) =====
CREATE TABLE shops (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    slug                VARCHAR(255) UNIQUE NOT NULL,
    description         TEXT,
    logo_url            TEXT,
    banner_url          TEXT,
    share_link          TEXT,
    subscription_active BOOLEAN NOT NULL DEFAULT FALSE,
    subscription_plan   VARCHAR(50),
    subscription_expires_at TIMESTAMPTZ,
    status              account_status NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shops_owner ON shops(owner_id);

-- ===== WALLETS (buyer, seller, delivery, admin/platform, escrow) =====
CREATE TYPE wallet_type AS ENUM ('user', 'platform', 'escrow');

CREATE TABLE wallets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id            UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for platform/escrow pool wallets
    type                wallet_type NOT NULL DEFAULT 'user',
    balance             NUMERIC(14,2) NOT NULL DEFAULT 0,
    currency            VARCHAR(10) NOT NULL DEFAULT 'USD',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallets_owner ON wallets(owner_id);

-- one platform wallet and one escrow pool wallet seeded on migration
INSERT INTO wallets (owner_id, type, balance, currency)
VALUES (NULL, 'platform', 0, 'USD'), (NULL, 'escrow', 0, 'USD');

-- ===== AUTH TOKENS =====
CREATE TABLE password_reset_tokens (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash          VARCHAR(255) NOT NULL,
    expires_at          TIMESTAMPTZ NOT NULL,
    used                BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phone_otp_codes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash           VARCHAR(255) NOT NULL,
    expires_at          TIMESTAMPTZ NOT NULL,
    used                BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash          VARCHAR(255) NOT NULL,
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== TRIGGER: auto-create wallet + updated_at maintenance =====
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- a wallet is created automatically for every new user (their personal wallet)
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (owner_id, type, balance, currency)
    VALUES (NEW.id, 'user', 0, 'USD');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_user_wallet AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_wallet();
