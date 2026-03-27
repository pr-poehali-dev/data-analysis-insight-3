CREATE TABLE IF NOT EXISTS mvp_vpn_keys_pool (
    id SERIAL PRIMARY KEY,
    vpn_key TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    assigned_to TEXT,
    assigned_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO mvp_vpn_keys_pool (vpn_key, plan) VALUES
('https://vpnmvp.kak.si/NLQSfrBQUq/7daysmvpvpn_1', '7 дней'),
('https://vpnmvp.kak.si/NLQSfrBQUq/7daysmvpvpn_2', '7 дней'),
('https://vpnmvp.kak.si/NLQSfrBQUq/7daysmvpvpn_3', '7 дней'),
('https://vpnmvp.kak.si/NLQSfrBQUq/7daysmvpvpn_4', '7 дней'),
('https://vpnmvp.kak.si/NLQSfrBQUq/1mesmvpvpn_1', '1 месяц'),
('https://vpnmvp.kak.si/NLQSfrBQUq/1mesmvpvpn_2', '1 месяц'),
('https://vpnmvp.kak.si/NLQSfrBQUq/1mesmvpvpn_3', '1 месяц'),
('https://vpnmvp.kak.si/NLQSfrBQUq/1mesmvpvpn_4', '1 месяц'),
('https://vpnmvp.kak.si/NLQSfrBQUq/3vtsmvpvpn_1', '3 месяца'),
('https://vpnmvp.kak.si/NLQSfrBQUq/3vtsmvpvpn_2', '3 месяца'),
('https://vpnmvp.kak.si/NLQSfrBQUq/3vtsmvpvpn_3', '3 месяца'),
('https://vpnmvp.kak.si/NLQSfrBQUq/3vtsmvpvpn_4', '3 месяца')
ON CONFLICT (vpn_key) DO NOTHING;
