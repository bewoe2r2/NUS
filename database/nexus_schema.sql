-- ==============================================================================
-- NEXUS 2026 - SQLite Schema (Refined)
-- Target: Android/iOS SQLite (Offline First)
-- Version: 1.1
-- Optimized for: HMM Inference, Privacy Compliance, Demo Robustness
-- ==============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ==============================================================================
-- 1. PATIENTS (Tier 1 - Identity & Profile)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    age INTEGER,
    conditions TEXT, -- JSON array of strings e.g. ["Type 2 Diabetes", "Hypertension"]
    medications TEXT, -- JSON array of strings e.g. ["Metformin", "Lisinopril"]
    tier TEXT DEFAULT 'BASIC',
    created_at_utc INTEGER DEFAULT (strftime('%s', 'now'))
);

-- ==============================================================================
-- 2. GLUCOSE READINGS (Tier 2 - Encrypted, 6 Months Retention)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS glucose_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    reading_value REAL NOT NULL,
    reading_timestamp_utc INTEGER NOT NULL,
    source_type TEXT CHECK(source_type IN ('MANUAL', 'OCR_GEMINI', 'VOICE_GEMINI')) NOT NULL,
    confidence_score REAL DEFAULT 1.0,
    photo_deleted_flag BOOLEAN DEFAULT 0,
    is_synced BOOLEAN DEFAULT 0, -- Valid if NO value is synced, only "event"
    retention_until INTEGER DEFAULT (strftime('%s', 'now') + 15552000), -- +6 months
    FOREIGN KEY (user_id) REFERENCES patients(user_id)
);

-- Optimization: HMM needs last 24h fast
-- Requirement: idx_glucose_recent
CREATE INDEX IF NOT EXISTS idx_glucose_recent ON glucose_readings(user_id, reading_timestamp_utc DESC); 

-- ==============================================================================
-- 2. MEDICATION LOGS (Tier 2 - Encrypted, 6 Months Retention)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS medication_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    medication_name TEXT NOT NULL,
    dosage TEXT,
    taken_timestamp_utc INTEGER NOT NULL,
    scheduled_timestamp_utc INTEGER,
    source_type TEXT DEFAULT 'TAP',
    is_synced BOOLEAN DEFAULT 0,
    retention_until INTEGER DEFAULT (strftime('%s', 'now') + 15552000),
    FOREIGN KEY (user_id) REFERENCES patients(user_id)
);

CREATE INDEX IF NOT EXISTS idx_meds_time ON medication_logs(taken_timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user ON medication_logs(user_id);

-- ==============================================================================
-- 2b. MEDICATIONS (Prescribed medications - not same as medication_logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'current_user',
    medication_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT DEFAULT 'BID',
    scheduled_times TEXT,  -- JSON array of times like ["08:00", "20:00"]
    active INTEGER DEFAULT 1,
    prescribed_date INTEGER,
    FOREIGN KEY (user_id) REFERENCES patients(user_id)
);
CREATE INDEX IF NOT EXISTS idx_medications_user ON medications(user_id);

-- ==============================================================================
-- 3. PASSIVE METRICS (Tier 2 - Aggregated, 6 Months Retention)
-- NOTE: Raw sensor data (Tier 1) is transient in RAM or temp files and NOT stored here.
-- This table stores only the hourly aggregates.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS passive_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    window_start_utc INTEGER NOT NULL,
    window_end_utc INTEGER NOT NULL,

    -- Gait / Activity
    step_count INTEGER DEFAULT 0,
    walking_speed_avg REAL,
    gait_asymmetry_score REAL,

    -- Digital Phenotyping
    screen_time_seconds INTEGER DEFAULT 0,
    typing_speed_cpm REAL,
    typing_correction_rate REAL,
    social_interactions INTEGER DEFAULT 0,

    -- Location (Privacy Preserving zones only)
    time_at_home_seconds INTEGER DEFAULT 0,
    max_distance_from_home_km REAL DEFAULT 0,

    is_synced BOOLEAN DEFAULT 0,
    retention_until INTEGER DEFAULT (strftime('%s', 'now') + 15552000),
    FOREIGN KEY (user_id) REFERENCES patients(user_id)
);

CREATE INDEX IF NOT EXISTS idx_passive_time ON passive_metrics(window_start_utc DESC);
CREATE INDEX IF NOT EXISTS idx_passive_metrics_user ON passive_metrics(user_id);

-- ==============================================================================
-- 4. VOICE CHECK-INS (Tier 2 - Transcript Only, 6 Months Retention)
-- Audio deleted immediately.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS voice_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    timestamp_utc INTEGER NOT NULL,
    transcript_text TEXT,
    sentiment_score REAL,
    topics_detected TEXT,
    audio_deleted_flag BOOLEAN DEFAULT 1,
    is_synced BOOLEAN DEFAULT 0,
    retention_until INTEGER DEFAULT (strftime('%s', 'now') + 15552000),
    FOREIGN KEY (user_id) REFERENCES patients(user_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_time ON voice_checkins(timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_voice_checkins_user ON voice_checkins(user_id);

-- ==============================================================================
-- 5. HMM STATES (Tier 2 - Derived, 6 Months Retention)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS hmm_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    timestamp_utc INTEGER NOT NULL,
    detected_state TEXT CHECK(detected_state IN ('STABLE', 'WARNING', 'CRISIS')) NOT NULL,
    confidence_score REAL NOT NULL,
    confidence_margin REAL,
    patient_tier TEXT DEFAULT 'BASIC',
    contributing_factors TEXT,
    input_vector_snapshot TEXT,
    is_synced BOOLEAN DEFAULT 0,
    retention_until INTEGER DEFAULT (strftime('%s', 'now') + 15552000),
    FOREIGN KEY (user_id) REFERENCES patients(user_id)
);

-- Optimization: HMM state history for last 7 days
-- Requirement: idx_hmm_recent
CREATE INDEX IF NOT EXISTS idx_hmm_recent ON hmm_states(user_id, timestamp_utc DESC);

-- ==============================================================================
-- 6. VOUCHER & INTERVENTIONS (Tier 3 - Indefinite Retention)
-- Allowed to sync to cloud (Anonymized).
-- ==============================================================================
-- Voucher System (Loss Aversion Gamification)
CREATE TABLE IF NOT EXISTS voucher_tracker (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    week_start_utc INTEGER NOT NULL,
    current_value REAL NOT NULL DEFAULT 5.00,
    bonus_earned REAL DEFAULT 0,
    penalties_json TEXT DEFAULT '[]',
    created_at_utc INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES patients(user_id)
);

CREATE INDEX IF NOT EXISTS idx_voucher_week ON voucher_tracker(user_id, week_start_utc);

CREATE TABLE IF NOT EXISTS voucher_redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reward_id TEXT NOT NULL,
    redemption_date_utc INTEGER NOT NULL,
    cost_points INTEGER NOT NULL,
    is_synced BOOLEAN DEFAULT 0 -- Syncs to cloud
);

CREATE TABLE IF NOT EXISTS interventions_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trigger_state_id INTEGER,
    intervention_type TEXT NOT NULL,
    timestamp_utc INTEGER NOT NULL,
    user_response TEXT,
    is_synced BOOLEAN DEFAULT 0, -- Syncs to cloud
    FOREIGN KEY(trigger_state_id) REFERENCES hmm_states(id)
);

-- Requirement: idx_sync_pending
CREATE INDEX IF NOT EXISTS idx_sync_pending ON interventions_log(is_synced) WHERE is_synced = 0;

-- ==============================================================================
-- 7. GEMINI OFFLINE CACHE (New - Fallback)
-- Stores pre-generated responses for common scenarios.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS gemini_response_cache (
    scenario_key TEXT PRIMARY KEY, -- e.g., "HIGH_GLUCOSE_MORNING"
    cached_response_text TEXT NOT NULL,
    last_updated_utc INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT 0 -- True if shipped with app
);

-- ==============================================================================
-- 8. DEMO SCENARIOS & GOD MODE (New)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS demo_scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_name TEXT UNIQUE NOT NULL, -- "CRISIS", "HEALTHY"
    description TEXT,
    data_payload_json TEXT NOT NULL -- The fake data to inject
);

-- ==============================================================================
-- 9. TRIGGERS & MAINTENANCE
-- ==============================================================================

-- Trigger: Auto-delete expired Tier 2 Data (Rolling 6 months)
-- Runs on meaningful inserts to clean old data.
-- NOTE: Also implement a scheduled daily cleanup job for inactive patients
-- whose data won't be purged by insert triggers alone.
CREATE TRIGGER IF NOT EXISTS auto_purge_glucose
AFTER INSERT ON glucose_readings
BEGIN
    DELETE FROM glucose_readings WHERE retention_until < strftime('%s', 'now');
END;

CREATE TRIGGER IF NOT EXISTS auto_purge_states
AFTER INSERT ON hmm_states
BEGIN
    DELETE FROM hmm_states WHERE retention_until < strftime('%s', 'now');
END;

CREATE TRIGGER IF NOT EXISTS auto_purge_medication_logs
AFTER INSERT ON medication_logs
BEGIN
    DELETE FROM medication_logs WHERE retention_until < strftime('%s', 'now');
END;

CREATE TRIGGER IF NOT EXISTS auto_purge_passive_metrics
AFTER INSERT ON passive_metrics
BEGIN
    DELETE FROM passive_metrics WHERE retention_until < strftime('%s', 'now');
END;

CREATE TRIGGER IF NOT EXISTS auto_purge_voice_checkins
AFTER INSERT ON voice_checkins
BEGIN
    DELETE FROM voice_checkins WHERE retention_until < strftime('%s', 'now');
END;

-- Views for HMM (Updated)
CREATE VIEW IF NOT EXISTS v_hmm_glucose_24h AS
SELECT 
    AVG(reading_value) as avg_glucose,
    COUNT(reading_value) as reading_count,
    MAX(reading_value) - MIN(reading_value) as range_glucose
FROM glucose_readings
WHERE reading_timestamp_utc >= strftime('%s', 'now') - 86400;

CREATE VIEW IF NOT EXISTS v_hmm_meds_7d AS
SELECT 
    COUNT(*) as meds_taken_count
FROM medication_logs
WHERE taken_timestamp_utc >= strftime('%s', 'now') - 604800;



-- ==============================================================================
-- 10. CGM READINGS (Premium tier only)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS cgm_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    glucose_value REAL NOT NULL,
    timestamp_utc INTEGER NOT NULL,
    device_id TEXT,
    is_synced BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES patients(user_id)
);
CREATE INDEX IF NOT EXISTS idx_cgm_recent ON cgm_readings(user_id, timestamp_utc DESC);

-- ==============================================================================
-- 11. FOOD LOGS (All tiers - carb tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS food_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    timestamp_utc INTEGER NOT NULL,
    meal_type TEXT CHECK(meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')),
    description TEXT,
    carbs_grams REAL,
    source_type TEXT DEFAULT 'MANUAL',
    is_synced BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES patients(user_id)
);
CREATE INDEX IF NOT EXISTS idx_food_time ON food_logs(user_id, timestamp_utc DESC);

-- ==============================================================================
-- 12. FITBIT ACTIVITY (Enhanced/Premium tiers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS fitbit_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    date INTEGER NOT NULL,
    steps INTEGER DEFAULT 0,
    active_minutes INTEGER DEFAULT 0,
    sedentary_minutes INTEGER DEFAULT 0,
    calories_burned INTEGER DEFAULT 0,
    is_synced BOOLEAN DEFAULT 0,
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES patients(user_id)
);
CREATE INDEX IF NOT EXISTS idx_fitbit_activity_date ON fitbit_activity(user_id, date DESC);

-- ==============================================================================
-- 13. FITBIT HEART RATE (Enhanced/Premium tiers)
-- ==============================================================================
-- HRV (Heart Rate Variability) is CRITICAL for diabetics:
-- - Predicts autonomic neuropathy onset (ARIC Study)
-- - Independent of heart rate value itself (orthogonal signal)
-- - Low HRV (<20ms RMSSD) = autonomic dysfunction
-- - Available from Fitbit Premium, Apple Watch, Garmin
-- ==============================================================================
CREATE TABLE IF NOT EXISTS fitbit_heart_rate (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    date INTEGER NOT NULL,
    resting_heart_rate INTEGER,
    average_heart_rate INTEGER,
    hrv_rmssd REAL,  -- Heart Rate Variability (RMSSD method, in milliseconds)
    hrv_sdnn REAL,   -- Alternative HRV metric (standard deviation of NN intervals)
    is_synced BOOLEAN DEFAULT 0,
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES patients(user_id)
);
CREATE INDEX IF NOT EXISTS idx_fitbit_hr_date ON fitbit_heart_rate(user_id, date DESC);

-- ==============================================================================
-- 14. FITBIT SLEEP (Enhanced/Premium tiers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS fitbit_sleep (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    date INTEGER NOT NULL,
    total_sleep_minutes INTEGER,
    sleep_score REAL,
    is_synced BOOLEAN DEFAULT 0,
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES patients(user_id)
);
CREATE INDEX IF NOT EXISTS idx_fitbit_sleep_date ON fitbit_sleep(user_id, date DESC);

-- ==============================================================================
-- 15. DAILY INSIGHTS CACHE (Cost Optimization for Gemini)
-- ==============================================================================
-- Stores daily generated insights to avoid repeated API calls
-- One insight per user per day - regenerate only on state change
CREATE TABLE IF NOT EXISTS daily_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    date INTEGER NOT NULL,  -- Date as YYYYMMDD integer for easy comparison
    insight_json TEXT NOT NULL,  -- Full Gemini response cached
    generated_at_utc INTEGER NOT NULL,
    hmm_state_at_generation TEXT,  -- State when insight was generated
    pattern_detected TEXT,  -- For analytics: what patterns were found
    trigger_reason TEXT DEFAULT 'DAILY',  -- DAILY, STATE_CHANGE, MANUAL
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES patients(user_id)
);
CREATE INDEX IF NOT EXISTS idx_daily_insights_date ON daily_insights(user_id, date DESC);

-- ==============================================================================
-- 16. STATE CHANGE ALERTS (Event-Triggered Escalation)
-- ==============================================================================
-- Tracks HMM state transitions for triggering Gemini and nurse alerts
CREATE TABLE IF NOT EXISTS state_change_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    timestamp_utc INTEGER NOT NULL,
    previous_state TEXT NOT NULL,
    new_state TEXT NOT NULL,
    confidence_score REAL,
    alert_sent BOOLEAN DEFAULT 0,  -- Was patient alerted?
    sbar_generated BOOLEAN DEFAULT 0,  -- Was SBAR auto-generated?
    nurse_notified BOOLEAN DEFAULT 0,  -- Was nurse portal flagged?
    dismissed BOOLEAN DEFAULT 0,  -- Nurse dismissed as false positive
    notes TEXT,  -- Optional nurse notes
    FOREIGN KEY (user_id) REFERENCES patients(user_id)
);
CREATE INDEX IF NOT EXISTS idx_state_alerts_time ON state_change_alerts(user_id, timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_state_alerts_pending ON state_change_alerts(nurse_notified) WHERE nurse_notified = 0;

-- ==============================================================================
-- 17. CAREGIVER CONTACTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS caregiver_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    priority TEXT DEFAULT 'primary',  -- primary / secondary
    preferred_method TEXT DEFAULT 'sms'
);

-- ==============================================================================
-- 18. AGENT MEMORY (Cross-session learning)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS agent_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT NOT NULL,
    memory_type TEXT NOT NULL,  -- episodic / semantic / preference
    key TEXT NOT NULL,
    value_json TEXT NOT NULL,
    confidence REAL DEFAULT 0.5,
    created_at INTEGER,
    updated_at INTEGER,
    source TEXT DEFAULT 'conversation',
    consolidated INTEGER DEFAULT 0,
    UNIQUE(patient_id, memory_type, key)
);
CREATE INDEX IF NOT EXISTS idx_agent_memory_patient ON agent_memory(patient_id, memory_type);

-- ==============================================================================
-- 19. Update hmm_states to include new columns
-- ==============================================================================
-- Add columns if they don't exist (SQLite doesn't support IF NOT EXISTS for ALTER)
-- These will be created fresh if table is recreated

-- ==============================================================================
-- 20. Runtime agent tables (required by agent_runtime.py)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    reminder_time TEXT,
    message TEXT,
    reminder_type TEXT DEFAULT 'general',
    repeat_type TEXT DEFAULT 'once',
    created_at INTEGER,
    status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS family_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    timestamp_utc INTEGER,
    message TEXT,
    include_metrics INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS nurse_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    timestamp_utc INTEGER,
    priority TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    sbar_json TEXT
);

CREATE TABLE IF NOT EXISTS doctor_escalations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    timestamp_utc INTEGER,
    reason TEXT,
    metrics_snapshot TEXT,
    status TEXT DEFAULT 'pending',
    sbar_json TEXT
);

CREATE TABLE IF NOT EXISTS appointment_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    timestamp_utc INTEGER,
    appointment_type TEXT,
    urgency TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS medication_video_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    timestamp_utc INTEGER,
    medication_name TEXT,
    status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS clinical_notes_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    timestamp_utc INTEGER,
    note_type TEXT,
    content TEXT
);

CREATE TABLE IF NOT EXISTS caregiver_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id INTEGER,
    caregiver_id TEXT,
    response_type TEXT,
    message TEXT,
    timestamp_utc INTEGER
);
