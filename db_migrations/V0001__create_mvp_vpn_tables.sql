CREATE TABLE IF NOT EXISTS mvp_vpn_users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mvp_vpn_subscriptions (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL REFERENCES mvp_vpn_users(telegram_id),
    plan TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    vpn_key TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mvp_vpn_auth_codes (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE
);
