-- Veranda PMS (Solstice Bay Resort & Villas) — Supabase PostgreSQL Schema
-- Multi-tenant per-browser sandbox isolation via sandbox_id UUID

CREATE TABLE IF NOT EXISTS sandboxes (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  anchor_date_local DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Manila')::date
);

CREATE TABLE IF NOT EXISTS users (
  sandbox_id UUID NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL, -- @defect VH-14: plaintext storage mirror compatibility
  role VARCHAR(16) NOT NULL CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ NULL,
  low_allotment_alerts BOOLEAN NOT NULL DEFAULT true,
  theme_preference VARCHAR(16) NOT NULL DEFAULT 'dark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sandbox_id, id)
);

CREATE TABLE IF NOT EXISTS rooms_packages (
  sandbox_id UUID NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  rate NUMERIC(12, 2) NOT NULL,
  available_units NUMERIC(10, 2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  description TEXT NOT NULL DEFAULT '',
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sandbox_id, id)
);

CREATE TABLE IF NOT EXISTS allotment_adjustments (
  sandbox_id UUID NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  room_package_id TEXT NOT NULL,
  adjustment_type VARCHAR(16) NOT NULL CHECK (adjustment_type IN ('add', 'remove')),
  quantity NUMERIC(10, 2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  performed_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sandbox_id, id)
);

CREATE TABLE IF NOT EXISTS guests (
  sandbox_id UUID NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  address VARCHAR(255) NOT NULL,
  loyalty_tier VARCHAR(32) NOT NULL DEFAULT 'Standard',
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sandbox_id, id)
);

CREATE TABLE IF NOT EXISTS reservations (
  sandbox_id UUID NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  reservation_number VARCHAR(32) NOT NULL,
  guest_id TEXT NULL,
  status VARCHAR(32) NOT NULL,
  discount_percent NUMERIC(6, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) NOT NULL,
  tax_amount NUMERIC(12, 2) NOT NULL,
  service_fee NUMERIC(12, 2) NOT NULL DEFAULT 250.00,
  grand_total NUMERIC(12, 2) NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  placed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sandbox_id, id)
);

CREATE TABLE IF NOT EXISTS reservation_items (
  sandbox_id UUID NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  reservation_id TEXT NOT NULL,
  room_package_id TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit_rate_snapshot NUMERIC(12, 2) NOT NULL,
  PRIMARY KEY (sandbox_id, id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  sandbox_id UUID NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  user_id TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sandbox_id, token)
);

-- JSON state snapshot table for atomic hybrid sync & reset
CREATE TABLE IF NOT EXISTS sandbox_snapshots (
  sandbox_id UUID PRIMARY KEY REFERENCES sandboxes(id) ON DELETE CASCADE,
  state_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RPC for per-browser sandbox reset without affecting other contestants
CREATE OR REPLACE FUNCTION reset_veranda_sandbox(
  p_sandbox_id UUID,
  p_state_json JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
DECLARE
  v_local_date DATE := (now() AT TIME ZONE 'Asia/Manila')::date;
BEGIN
  INSERT INTO sandboxes (id, created_at, last_reset_at, anchor_date_local)
  VALUES (p_sandbox_id, now(), now(), v_local_date)
  ON CONFLICT (id) DO UPDATE
  SET last_reset_at = now(),
      anchor_date_local = v_local_date;

  DELETE FROM reservation_items WHERE sandbox_id = p_sandbox_id;
  DELETE FROM reservations WHERE sandbox_id = p_sandbox_id;
  DELETE FROM allotment_adjustments WHERE sandbox_id = p_sandbox_id;
  DELETE FROM password_reset_tokens WHERE sandbox_id = p_sandbox_id;
  DELETE FROM rooms_packages WHERE sandbox_id = p_sandbox_id;
  DELETE FROM guests WHERE sandbox_id = p_sandbox_id;
  DELETE FROM users WHERE sandbox_id = p_sandbox_id;

  IF p_state_json IS NOT NULL THEN
    INSERT INTO sandbox_snapshots (sandbox_id, state_json, updated_at)
    VALUES (p_sandbox_id, p_state_json, now())
    ON CONFLICT (sandbox_id) DO UPDATE
    SET state_json = EXCLUDED.state_json,
        updated_at = now();
  END IF;

  RETURN COALESCE(p_state_json, '{}'::jsonb);
END;
$$;

-- Multi-tenant isolation: deny direct anon/authenticated PostgREST access.
-- All authorized sandbox reads/writes run through Next.js server handlers using service_role.
ALTER TABLE sandboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE allotment_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_snapshots ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON FUNCTION reset_veranda_sandbox(UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_veranda_sandbox(UUID, JSONB) TO service_role;
