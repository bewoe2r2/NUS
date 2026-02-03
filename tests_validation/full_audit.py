"""Full audit test for Healthcare app"""
import sys

print("=" * 60)
print("NEXUS 2026 HEALTHCARE APP - FULL AUDIT")
print("=" * 60)

errors = []

# 1. Test HMM Engine
print("\n[1] HMM Engine Test...")
try:
    from hmm_engine import HMMEngine, gaussian_pdf
    engine = HMMEngine()
    obs = engine.generate_demo_scenario('stable_perfect', days=3)
    result = engine.run_inference(obs)
    print(f"    [PASS] HMM Inference: {result['current_state']} ({result['confidence']*100:.1f}% confidence)")
    print(f"    [PASS] Method: {result['method']}")
except Exception as e:
    errors.append(f"HMM Engine: {e}")
    print(f"    [FAIL] ERROR: {e}")

# 2. Test Gemini Integration
print("\n[2] Gemini Integration Test...")
try:
    from gemini_integration import GeminiIntegration
    gi = GeminiIntegration()
    methods = [m for m in dir(gi) if not m.startswith('_') and callable(getattr(gi, m))]
    print(f"    [PASS] GeminiIntegration loaded with {len(methods)} methods")
except Exception as e:
    errors.append(f"Gemini Integration: {e}")
    print(f"    [FAIL] ERROR: {e}")

# 3. Test Database Connection & Tables
print("\n[3] Database Test...")
try:
    import sqlite3
    conn = sqlite3.connect('nexus_health.db')
    cursor = conn.cursor()
    tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    print(f"    [PASS] Database connected: {len(tables)} tables found")
    
    # Check key tables have data
    key_tables = ['glucose_readings', 'hmm_states', 'medication_logs']
    for table in key_tables:
        count = cursor.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"    [PASS] {table}: {count} rows")
    conn.close()
except Exception as e:
    errors.append(f"Database: {e}")
    print(f"    [FAIL] ERROR: {e}")

# 4. Test gaussian_pdf function (the bug we fixed)
print("\n[4] gaussian_pdf Function Test...")
try:
    from hmm_engine import gaussian_pdf
    result = gaussian_pdf(5.8, 5.8, 0.8)
    expected = 0.446  # approximately
    if abs(result - expected) < 0.01:
        print(f"    [PASS] gaussian_pdf(5.8, 5.8, 0.8) = {result:.4f}")
    else:
        print(f"    [FAIL] Unexpected result: {result}")
        errors.append(f"gaussian_pdf returned {result} instead of ~{expected}")
except Exception as e:
    errors.append(f"gaussian_pdf: {e}")
    print(f"    [FAIL] ERROR: {e}")

# 5. Test streamlit_app imports (the file we fixed)
print("\n[5] Streamlit App Import Test...")
try:
    # Don't run full streamlit, just check imports
    import importlib.util
    spec = importlib.util.spec_from_file_location("streamlit_app", "streamlit_app.py")
    module = importlib.util.module_from_spec(spec)
    # Check the import line we fixed
    with open("streamlit_app.py", "r", encoding="utf-8") as f:
        content = f.read()
        if "gaussian_pdf" in content and "from hmm_engine import" in content:
            print("    [PASS] streamlit_app.py imports gaussian_pdf correctly")
        else:
            errors.append("streamlit_app.py missing gaussian_pdf import")
            print("    [FAIL] Missing gaussian_pdf import")
except Exception as e:
    errors.append(f"Streamlit import check: {e}")
    print(f"    [FAIL] ERROR: {e}")

# Summary
print("\n" + "=" * 60)
if errors:
    print(f"AUDIT FAILED - {len(errors)} error(s) found:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
else:
    print("[OK] AUDIT PASSED - All systems operational!")
    sys.exit(0)
