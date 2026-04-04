-- PICK5: enforce one row per (user, game day, market) and unique pick slots per day.
CREATE UNIQUE INDEX IF NOT EXISTS "daily_picks_user_date_market_uid" ON "daily_picks" ("userId", "pickDate", "marketId");
CREATE UNIQUE INDEX IF NOT EXISTS "daily_picks_user_date_order_uid" ON "daily_picks" ("userId", "pickDate", "pickOrder");
CREATE UNIQUE INDEX IF NOT EXISTS "daily_results_user_date_uid" ON "daily_results" ("userId", "pickDate");
