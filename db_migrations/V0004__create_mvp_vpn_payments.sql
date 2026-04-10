CREATE TABLE IF NOT EXISTS t_p77296718_data_analysis_insigh.mvp_vpn_payments (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    plan TEXT NOT NULL,
    payment_id TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT now()
);
