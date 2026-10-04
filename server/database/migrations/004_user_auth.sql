-- Unify local/offline users with server authentication.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_salt TEXT,
  ADD COLUMN IF NOT EXISTS password_algorithm TEXT,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE users SET active = TRUE WHERE active IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, active);

-- Keep the two initial accounts available for first online login.
INSERT INTO users (id, name, email, role, active)
VALUES
  ('admin_1', 'Admin User', 'admin@retailer.com', 'admin', TRUE),
  ('cashier_1', 'Cashier User', 'cashier@retailer.com', 'cashier', TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  active = TRUE;
