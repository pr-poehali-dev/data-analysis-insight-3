ALTER TABLE mvp_vpn_users ADD COLUMN IF NOT EXISTS username_login TEXT UNIQUE;
ALTER TABLE mvp_vpn_users ADD COLUMN IF NOT EXISTS password_hash TEXT;
