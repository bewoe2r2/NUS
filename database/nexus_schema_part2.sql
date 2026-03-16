
-- DEPRECATED: This file is superseded by nexus_schema.sql which contains
-- all tables with the latest column definitions. Kept for reference only.
-- ==============================================================================
-- 7. EXTERNAL DEVICE DATA (Tier 2 & 3)
-- ==============================================================================

-- CGM READINGS (Premium tier only)
CREATE TABLE IF NOT EXISTS cgm_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'current_user',
    glucose_value REAL NOT NULL,
    timestamp_utc INTEGER NOT NULL,
    device_id TEXT,
    is_synced BOOLEAN DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_cgm_recent ON cgm_readings(user_id, timestamp_utc DESC);

-- FOOD LOGS (All tiers - carb tracking)
CREATE TABLE IF NOT EXISTS food_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'current_user',
    timestamp_utc INTEGER NOT NULL,
    meal_type TEXT CHECK(meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')),
    description TEXT,
    carbs_grams REAL,
    source_type TEXT DEFAULT 'MANUAL',
    is_synced BOOLEAN DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_food_time ON food_logs(user_id, timestamp_utc DESC);

-- FITBIT ACTIVITY (Enhanced/Premium tiers)
CREATE TABLE IF NOT EXISTS fitbit_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'current_user',
    date INTEGER NOT NULL,
    steps INTEGER DEFAULT 0,
    active_minutes INTEGER DEFAULT 0,
    sedentary_minutes INTEGER DEFAULT 0,
    calories_burned INTEGER DEFAULT 0,
    is_synced BOOLEAN DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_fitbit_activity_date ON fitbit_activity(user_id, date DESC);

-- FITBIT HEART RATE (Enhanced/Premium tiers)
CREATE TABLE IF NOT EXISTS fitbit_heart_rate (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'current_user',
    date INTEGER NOT NULL,
    resting_heart_rate INTEGER,
    average_heart_rate INTEGER,
    is_synced BOOLEAN DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_fitbit_hr_date ON fitbit_heart_rate(user_id, date DESC);

-- FITBIT SLEEP (Enhanced/Premium tiers)
CREATE TABLE IF NOT EXISTS fitbit_sleep (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'current_user',
    date INTEGER NOT NULL,
    total_sleep_minutes INTEGER,
    sleep_score REAL,
    is_synced BOOLEAN DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_fitbit_sleep_date ON fitbit_sleep(user_id, date DESC);
