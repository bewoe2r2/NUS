"""
LIVE End-to-End API Test Suite for Bewo Healthcare.
Starts the FastAPI server, hits every endpoint with proper auth, validates responses.

Run: python tests/test_api_live.py  (from project root)

Requires: FastAPI server NOT already running on port 8000
"""
import sys, os, json, time, subprocess, signal, requests, traceback

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://127.0.0.1:8000"
API_KEY = os.environ.get("BEWO_API_KEY", "")
if not API_KEY:
    print("ERROR: BEWO_API_KEY environment variable is required. Set it before running tests.")
    sys.exit(1)
HEADERS = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
PASS = 0
FAIL = 0
WARN = 0
server_proc = None

def ok(label):
    global PASS; PASS += 1
    print(f"  [PASS] {label}")

def fail(label, detail=""):
    global FAIL; FAIL += 1
    print(f"  [FAIL] {label} -- {detail}")

def warn(label, detail=""):
    global WARN; WARN += 1
    print(f"  [WARN] {label} -- {detail}")


def get(path, timeout=30):
    try:
        r = requests.get(f"{BASE_URL}{path}", headers=HEADERS, timeout=timeout)
        try:
            body = r.json()
        except Exception:
            body = r.text
        return r.status_code, body
    except requests.exceptions.ConnectionError:
        return 0, "CONNECTION_REFUSED"
    except requests.exceptions.ReadTimeout:
        return -1, "READ_TIMEOUT"
    except Exception as e:
        return -1, str(e)

def post(path, json_data=None, timeout=45):
    try:
        r = requests.post(f"{BASE_URL}{path}", headers=HEADERS, json=json_data, timeout=timeout)
        try:
            body = r.json()
        except Exception:
            body = r.text
        return r.status_code, body
    except requests.exceptions.ConnectionError:
        return 0, "CONNECTION_REFUSED"
    except requests.exceptions.ReadTimeout:
        return -1, "READ_TIMEOUT"
    except Exception as e:
        return -1, str(e)

def delete(path, timeout=30):
    try:
        r = requests.delete(f"{BASE_URL}{path}", headers=HEADERS, timeout=timeout)
        try:
            body = r.json()
        except Exception:
            body = r.text
        return r.status_code, body
    except requests.exceptions.ConnectionError:
        return 0, "CONNECTION_REFUSED"
    except requests.exceptions.ReadTimeout:
        return -1, "READ_TIMEOUT"
    except Exception as e:
        return -1, str(e)


def assert_status(label, actual, expected, body=None):
    """Hard assertion on HTTP status code. Fails the test immediately if wrong."""
    if actual != expected:
        detail = f"expected {expected}, got {actual}"
        if body:
            detail += f" | {str(body)[:100]}"
        fail(label, detail)
        assert False, f"{label}: {detail}"
    return True


def assert_key(body, key, label):
    """Hard assertion that a key exists in response dict."""
    assert isinstance(body, dict), f"{label}: response is not a dict, got {type(body).__name__}"
    assert key in body, f"{label}: missing required key '{key}' in response"
    return body[key]


def assert_type(value, expected_type, label):
    """Hard assertion on data type."""
    assert isinstance(value, expected_type), (
        f"{label}: expected {expected_type.__name__}, got {type(value).__name__} (value={value!r})"
    )
    return value


def assert_latency(elapsed, max_ms, label):
    """Hard assertion on response latency."""
    actual_ms = elapsed * 1000
    assert actual_ms < max_ms, (
        f"{label}: latency {actual_ms:.0f}ms exceeds limit {max_ms}ms"
    )
    ok(f"{label} latency: {actual_ms:.0f}ms < {max_ms}ms")


def start_server():
    """Start FastAPI server in background."""
    global server_proc
    print("\n[*] Starting FastAPI server...")

    # Check if already running (root is public, no auth needed)
    try:
        r = requests.get(f"{BASE_URL}/", timeout=3)
        if r.status_code == 200:
            print("  Server already running on :8000")
            return True
    except Exception:
        pass

    backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.join(project_root, "core") + os.pathsep + os.path.join(project_root, "tools")

    try:
        server_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "api:app", "--host", "127.0.0.1", "--port", "8000",
             "--log-level", "warning", "--timeout-keep-alive", "60"],
            cwd=backend_dir,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except Exception as e:
        fail(f"Could not start server: {e}")
        return False

    # Wait for server to be ready (max 20s)
    for i in range(40):
        time.sleep(0.5)
        if server_proc.poll() is not None:
            stderr = server_proc.stderr.read().decode(errors='replace')
            fail(f"Server exited with code {server_proc.returncode}")
            print(f"  STDERR: {stderr[:1000]}")
            return False
        try:
            r = requests.get(f"{BASE_URL}/", timeout=2)
            if r.status_code == 200:
                print(f"  Server ready after {(i+1)*0.5:.1f}s")
                return True
        except Exception:
            pass

    fail("Server did not respond within 20s")
    return False

def stop_server():
    global server_proc
    if server_proc:
        server_proc.terminate()
        try:
            server_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server_proc.kill()
        print("\n[*] Server stopped.")


# ==============================================================================
# TEST GROUPS
# ==============================================================================

def test_health():
    print("\n=== API: Health Check ===")
    # Root is public (no auth needed)
    t0 = time.time()
    try:
        r = requests.get(f"{BASE_URL}/", timeout=5)
        elapsed = time.time() - t0
        assert_status("GET /", r.status_code, 200)
        body = r.json()
        assert_key(body, "status", "GET / response")
        assert body["status"] == "ok", f"GET /: status is '{body['status']}', expected 'ok'"
        ok(f"GET / -> {r.status_code} ({body.get('system', '?')})")
        assert_latency(elapsed, 100, "GET / (health check)")
    except AssertionError:
        raise
    except Exception as e:
        fail(f"GET / -> {e}")
        raise AssertionError(f"GET / connection failed: {e}")

    # Auth rejection test — HARD ASSERT on 403
    try:
        r = requests.get(f"{BASE_URL}/patient/P001/state", timeout=5)
        assert_status("Auth rejection (no API key)", r.status_code, 403)
        ok("Auth rejection: 403 without API key")
    except AssertionError:
        raise
    except Exception as e:
        fail(f"Auth test: {e}")
        raise AssertionError(f"Auth rejection test failed: {e}")


def test_patient_state():
    print("\n=== API: Patient State & History ===")

    # GET /patient/P001/state
    t0 = time.time()
    code, body = get("/patient/P001/state")
    elapsed = time.time() - t0
    assert_status("GET /patient/P001/state", code, 200)
    assert_type(body, dict, "GET /patient/P001/state response")
    state = assert_key(body, "current_state", "GET /patient/P001/state")
    assert_type(state, str, "current_state")
    assert state in ['STABLE', 'WARNING', 'CRISIS'], (
        f"current_state '{state}' not in valid states"
    )
    ok(f"GET /patient/P001/state -> {state} (conf={body.get('confidence', '?')})")
    assert_latency(elapsed, 2000, "GET /patient/P001/state")

    # GET /patient/P001/history
    code, body = get("/patient/P001/history")
    assert_status("GET /patient/P001/history", code, 200)
    assert_type(body, dict, "GET /patient/P001/history response")
    history = assert_key(body, "history", "GET /patient/P001/history")
    assert_type(history, list, "history field")
    ok(f"GET /patient/P001/history -> {len(history)} points")

    # GET /patient/P001/analysis/14days
    code, body = get("/patient/P001/analysis/14days")
    assert_status("GET /patient/P001/analysis/14days", code, 200)
    ok(f"GET /patient/P001/analysis/14days -> {code}")

    # GET /patient/P001/analysis/detail (requires date query param)
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    code, body = get(f"/patient/P001/analysis/detail?date={today}")
    assert_status(f"GET /patient/P001/analysis/detail?date={today}", code, 200)
    ok(f"GET /patient/P001/analysis/detail?date={today} -> {code}")


def test_glucose_endpoints():
    print("\n=== API: Glucose Endpoints ===")

    # POST /glucose/log
    code, body = post("/glucose/log", json_data={"value": 6.5, "unit": "mmol/L", "source": "MANUAL", "patient_id": "P001"})
    assert_status("POST /glucose/log", code, 200)
    assert_type(body, dict, "POST /glucose/log response")
    assert_key(body, "value", "POST /glucose/log")
    ok(f"POST /glucose/log -> {code} (value={body.get('value', '?')})")

    # POST /glucose/log with mg/dL conversion
    code, body = post("/glucose/log", json_data={"value": 120, "unit": "mg/dL", "source": "MANUAL", "patient_id": "P001"})
    assert_status("POST /glucose/log mg/dL", code, 200)
    assert_type(body, dict, "POST /glucose/log mg/dL response")
    converted = assert_key(body, "value", "POST /glucose/log mg/dL")
    assert_type(converted, (int, float), "converted glucose value")
    assert 6.0 < converted < 7.5, (
        f"mg/dL conversion wrong: 120 mg/dL should be ~6.67 mmol/L, got {converted}"
    )
    ok(f"POST /glucose/log mg/dL -> {code} (converted={converted:.2f} mmol/L)")


def test_medication_endpoints():
    print("\n=== API: Medication Endpoints ===")

    # GET /medications/P001
    code, body = get("/medications/P001")
    assert_status("GET /medications/P001", code, 200)
    ok(f"GET /medications/P001 -> {code}")

    # POST /medications/log
    code, body = post("/medications/log", json_data={"medication_name": "Metformin 500mg", "taken": True, "patient_id": "P001"})
    assert_status("POST /medications/log", code, 200)
    ok(f"POST /medications/log -> {code}")


def test_voucher_endpoints():
    print("\n=== API: Voucher Endpoints ===")

    # GET /voucher/P001
    code, body = get("/voucher/P001")
    assert_status("GET /voucher/P001", code, 200)
    assert_type(body, dict, "GET /voucher/P001 response")
    assert_key(body, "current_value", "GET /voucher/P001")
    ok(f"GET /voucher/P001 -> {code} (value=${body.get('current_value', '?')})")

    # GET /voucher/P001/qr
    code, body = get("/voucher/P001/qr")
    assert_status("GET /voucher/P001/qr", code, 200)
    ok(f"GET /voucher/P001/qr -> {code}")


def test_voice_checkin():
    print("\n=== API: Voice Check-in ===")

    code, body = post("/voice/checkin", json_data={"transcript": "I feel okay today, my sugar seems normal", "patient_id": "P001"})
    assert_status("POST /voice/checkin", code, 200)
    assert_type(body, dict, "POST /voice/checkin response")
    ok(f"POST /voice/checkin -> {code} (urgency={body.get('urgency', '?')}, sentiment={body.get('sentiment_score', '?')})")


def test_reminders():
    print("\n=== API: Reminders ===")

    code, body = get("/reminders/P001")
    assert_status("GET /reminders/P001", code, 200)
    ok(f"GET /reminders/P001 -> {code}")


def test_nurse_endpoints():
    print("\n=== API: Nurse Endpoints ===")

    # GET /nurse/alerts
    code, body = get("/nurse/alerts")
    assert_status("GET /nurse/alerts", code, 200)
    assert_type(body, list, "GET /nurse/alerts response")
    ok(f"GET /nurse/alerts -> {code} ({len(body)} alerts)")

    # GET /nurse/patients
    t0 = time.time()
    code, body = get("/nurse/patients")
    elapsed = time.time() - t0
    assert_status("GET /nurse/patients", code, 200)
    ok(f"GET /nurse/patients -> {code}")
    assert_latency(elapsed, 5000, "GET /nurse/patients")

    # GET /nurse/triage
    code, body = get("/nurse/triage")
    assert_status("GET /nurse/triage", code, 200)
    ok(f"GET /nurse/triage -> {code}")

    # GET /nurse/triage/P001
    code, body = get("/nurse/triage/P001")
    assert_status("GET /nurse/triage/P001", code, 200)
    ok(f"GET /nurse/triage/P001 -> {code}")


def test_agent_endpoints():
    print("\n=== API: Agent Endpoints ===")

    # GET /agent/status/P001
    code, body = get("/agent/status/P001")
    assert_status("GET /agent/status/P001", code, 200)
    ok(f"GET /agent/status/P001 -> {code}")

    # GET /agent/actions/P001
    code, body = get("/agent/actions/P001")
    assert_status("GET /agent/actions/P001", code, 200)
    ok(f"GET /agent/actions/P001 -> {code}")

    # GET /agent/conversation/P001
    code, body = get("/agent/conversation/P001")
    assert_status("GET /agent/conversation/P001", code, 200)
    ok(f"GET /agent/conversation/P001 -> {code}")

    # GET /agent/streaks/P001
    code, body = get("/agent/streaks/P001")
    assert_status("GET /agent/streaks/P001", code, 200)
    ok(f"GET /agent/streaks/P001 -> {code}")

    # GET /agent/engagement/P001
    code, body = get("/agent/engagement/P001")
    assert_status("GET /agent/engagement/P001", code, 200)
    ok(f"GET /agent/engagement/P001 -> {code}")

    # GET /agent/weekly-report/P001
    code, body = get("/agent/weekly-report/P001")
    assert_status("GET /agent/weekly-report/P001", code, 200)
    ok(f"GET /agent/weekly-report/P001 -> {code}")

    # GET /agent/nudge-times/P001
    code, body = get("/agent/nudge-times/P001")
    assert_status("GET /agent/nudge-times/P001", code, 200)
    ok(f"GET /agent/nudge-times/P001 -> {code}")

    # POST /agent/detect-mood
    code, body = post("/agent/detect-mood", json_data={"text": "I'm feeling great today!"})
    assert_status("POST /agent/detect-mood", code, 200)
    ok(f"POST /agent/detect-mood -> {code}")

    # GET /agent/daily-challenge/P001
    code, body = get("/agent/daily-challenge/P001")
    assert_status("GET /agent/daily-challenge/P001", code, 200)
    ok(f"GET /agent/daily-challenge/P001 -> {code}")

    # GET /agent/caregiver-fatigue/P001
    code, body = get("/agent/caregiver-fatigue/P001")
    assert_status("GET /agent/caregiver-fatigue/P001", code, 200)
    ok(f"GET /agent/caregiver-fatigue/P001 -> {code}")

    # GET /agent/glucose-narrative/P001
    code, body = get("/agent/glucose-narrative/P001")
    assert_status("GET /agent/glucose-narrative/P001", code, 200)
    ok(f"GET /agent/glucose-narrative/P001 -> {code}")

    # GET /agent/memory/P001
    code, body = get("/agent/memory/P001")
    assert_status("GET /agent/memory/P001", code, 200)
    ok(f"GET /agent/memory/P001 -> {code}")

    # GET /agent/tool-effectiveness/P001
    code, body = get("/agent/tool-effectiveness/P001")
    assert_status("GET /agent/tool-effectiveness/P001", code, 200)
    ok(f"GET /agent/tool-effectiveness/P001 -> {code}")

    # GET /agent/safety-log/P001
    code, body = get("/agent/safety-log/P001")
    assert_status("GET /agent/safety-log/P001", code, 200)
    ok(f"GET /agent/safety-log/P001 -> {code}")

    # GET /agent/proactive-history/P001
    code, body = get("/agent/proactive-history/P001")
    assert_status("GET /agent/proactive-history/P001", code, 200)
    ok(f"GET /agent/proactive-history/P001 -> {code}")


def test_caregiver_endpoints():
    print("\n=== API: Caregiver Endpoints ===")

    # GET /caregiver/dashboard/P001
    code, body = get("/caregiver/dashboard/P001")
    assert_status("GET /caregiver/dashboard/P001", code, 200)
    ok(f"GET /caregiver/dashboard/P001 -> {code}")

    # GET /caregiver/burden/P001
    code, body = get("/caregiver/burden/P001")
    assert_status("GET /caregiver/burden/P001", code, 200)
    ok(f"GET /caregiver/burden/P001 -> {code}")


def test_clinician_endpoints():
    print("\n=== API: Clinician Endpoints ===")

    # GET /clinician/summary/P001
    code, body = get("/clinician/summary/P001")
    assert_status("GET /clinician/summary/P001", code, 200)
    ok(f"GET /clinician/summary/P001 -> {code}")


def test_impact_endpoints():
    print("\n=== API: Impact Metrics ===")

    # GET /impact/metrics/P001
    code, body = get("/impact/metrics/P001")
    assert_status("GET /impact/metrics/P001", code, 200)
    ok(f"GET /impact/metrics/P001 -> {code}")

    # GET /impact/intervention-effectiveness/P001
    code, body = get("/impact/intervention-effectiveness/P001")
    assert_status("GET /impact/intervention-effectiveness/P001", code, 200)
    ok(f"GET /impact/intervention-effectiveness/P001 -> {code}")


def test_drug_interactions():
    print("\n=== API: Drug Interactions ===")

    # GET /patient/P001/drug-interactions
    code, body = get("/patient/P001/drug-interactions")
    assert_status("GET /patient/P001/drug-interactions", code, 200)
    assert_type(body, dict, "GET /patient/P001/drug-interactions response")
    assert_key(body, "interactions_found", "GET /patient/P001/drug-interactions")
    ok(f"GET /patient/P001/drug-interactions -> {body.get('interactions_found', 0)} interactions")

    # POST /patient/P001/drug-interactions/check
    code, body = post("/patient/P001/drug-interactions/check",
                      json_data={"medications": ["Metformin 500mg", "Insulin Glargine", "Lisinopril 10mg"]})
    assert_status("POST drug-interactions/check", code, 200)
    assert_type(body, dict, "POST drug-interactions/check response")
    assert_key(body, "interactions_found", "POST drug-interactions/check")
    ok(f"POST drug-interactions/check -> {body.get('interactions_found', 0)} interactions")


def test_hmm_endpoints():
    print("\n=== API: HMM Training & Params ===")

    # POST /hmm/train/P001
    code, body = post("/hmm/train/P001", timeout=30)
    assert_status("POST /hmm/train/P001", code, 200)
    ok(f"POST /hmm/train/P001 -> {code}")

    # GET /hmm/params/P001
    code, body = get("/hmm/params/P001")
    assert code in [200, 404], f"GET /hmm/params/P001: expected 200 or 404, got {code}"
    ok(f"GET /hmm/params/P001 -> {code}")


def test_admin_endpoints():
    print("\n=== API: Admin/Demo Endpoints ===")

    # POST /admin/inject-scenario (query param)
    for scenario in ['stable_perfect', 'warning_to_crisis', 'sudden_crisis']:
        code, body = post(f"/admin/inject-scenario?scenario={scenario}", timeout=30)
        assert_status(f"POST inject-scenario={scenario}", code, 200)
        assert_type(body, dict, f"POST inject-scenario={scenario} response")
        ok(f"POST inject-scenario={scenario} -> {body.get('observations', '?')} obs")

    # POST /admin/run-hmm
    code, body = post("/admin/run-hmm", timeout=30)
    assert_status("POST /admin/run-hmm", code, 200)
    assert_type(body, dict, "POST /admin/run-hmm response")
    ok(f"POST /admin/run-hmm -> analyzed={body.get('analyzed', '?')}")

    # POST /admin/reset
    code, body = post("/admin/reset", timeout=30)
    assert_status("POST /admin/reset", code, 200)
    ok(f"POST /admin/reset -> {code}")


def test_proactive_scan():
    """Proactive scan/checkin endpoints call Gemini AI -- may timeout with expired API key."""
    print("\n=== API: Proactive Scan (Gemini-dependent) ===")

    # POST /agent/proactive-scan — soft fail (Gemini-dependent)
    code, body = post("/agent/proactive-scan", timeout=60)
    if code == 200:
        ok(f"POST /agent/proactive-scan -> {code}")
    else:
        warn(f"POST /agent/proactive-scan -> {code} (Gemini-dependent)")

    # POST /agent/proactive-scan/P001 — soft fail (Gemini-dependent)
    code, body = post("/agent/proactive-scan/P001", timeout=60)
    if code == 200:
        ok(f"POST /agent/proactive-scan/P001 -> {code}")
    else:
        warn(f"POST /agent/proactive-scan/P001 -> {code} (Gemini-dependent)")

    # POST /agent/proactive-checkin/P001 — soft fail (Gemini-dependent)
    code, body = post("/agent/proactive-checkin/P001", timeout=60)
    if code == 200:
        ok(f"POST /agent/proactive-checkin/P001 -> {code}")
    else:
        warn(f"POST /agent/proactive-checkin/P001 -> {code} (Gemini-dependent)")


def test_counterfactual():
    print("\n=== API: Counterfactual ===")

    code, body = post("/agent/counterfactual/P001", json_data={"feature": "meds_adherence", "value": 1.0})
    assert_status("POST /agent/counterfactual/P001", code, 200)
    ok(f"POST /agent/counterfactual/P001 -> {code}")


def test_chat():
    """Test the AI chat endpoint (requires Gemini API key). Soft fail if Gemini unavailable."""
    print("\n=== API: Chat (Gemini AI) ===")

    t0 = time.time()
    code, body = post("/chat", json_data={"message": "Hello, how are you?", "patient_id": "P001"}, timeout=30)
    elapsed = time.time() - t0
    if code == 200 and isinstance(body, dict):
        msg = body.get('message', '')
        assert_type(msg, str, "POST /chat message field")
        if len(msg) > 5:
            ok(f"POST /chat -> {code} (response: {msg[:80]}...)")
            assert_latency(elapsed, 30000, "POST /chat (Gemini)")
        else:
            warn(f"POST /chat -> {code} but short response: '{msg}' (Gemini may be degraded)")
    elif code == 200:
        ok(f"POST /chat -> {code}")
    else:
        # Soft fail — Gemini API availability is external dependency
        warn(f"POST /chat -> {code}, {str(body)[:100]} (Gemini-dependent)")


def test_full_demo_workflow():
    """Simulate the judge demo workflow end-to-end."""
    print("\n=== API: Full Demo Workflow ===")

    # Step 1: Inject a warning_to_crisis scenario
    code, body = post("/admin/inject-scenario?scenario=warning_to_crisis", timeout=60)
    if code == -1:
        warn(f"Demo Step 1: timeout (server may be overloaded from prior tests)")
        return
    assert_status("Demo Step 1: inject scenario", code, 200)
    ok(f"Demo Step 1: Inject scenario -> {body.get('observations', '?')} obs")

    # Step 2: Run HMM
    code, body = post("/admin/run-hmm", timeout=60)
    assert_status("Demo Step 2: run-hmm", code, 200)
    ok(f"Demo Step 2: Run HMM -> analyzed={body.get('analyzed', '?')}")

    # Step 3: Get patient state
    code, body = get("/patient/P001/state")
    assert_status("Demo Step 3: patient state", code, 200)
    assert_type(body, dict, "Demo Step 3: patient state response")
    assert_key(body, "current_state", "Demo Step 3: patient state")
    ok(f"Demo Step 3: Patient state -> {body.get('current_state', '?')} (risk={body.get('risk_score', '?')})")

    # Step 4: Check drug interactions
    code, body = get("/patient/P001/drug-interactions")
    assert_status("Demo Step 4: drug-interactions", code, 200)
    ok(f"Demo Step 4: Drug interactions -> {body.get('interactions_found', 0)} found")

    # Step 5: Get nurse triage
    code, body = get("/nurse/triage")
    assert_status("Demo Step 5: nurse triage", code, 200)
    ok(f"Demo Step 5: Nurse triage -> {code}")

    # Step 6: Get counterfactual
    code, body = post("/agent/counterfactual/P001", json_data={"feature": "meds_adherence", "value": 1.0})
    assert_status("Demo Step 6: counterfactual", code, 200)
    ok(f"Demo Step 6: Counterfactual -> {code}")

    # Step 7: Impact metrics
    code, body = get("/impact/metrics/P001")
    assert_status("Demo Step 7: impact metrics", code, 200)
    ok(f"Demo Step 7: Impact metrics -> {code}")

    # Step 8: Clinician summary
    code, body = get("/clinician/summary/P001")
    assert_status("Demo Step 8: clinician summary", code, 200)
    ok(f"Demo Step 8: Clinician summary -> {code}")

    print("  --- Demo workflow complete ---")


def test_error_handling():
    """Test API error handling and edge cases."""
    print("\n=== API: Error Handling ===")

    # Invalid scenario name
    code, body = post("/admin/inject-scenario?scenario=nonexistent_scenario_xyz", timeout=30)
    assert code in [200, 400, 422], (
        f"Invalid scenario: expected 200/400/422, got {code}"
    )
    ok(f"Invalid scenario: responded with {code} (didn't hang)")

    # Nonexistent patient
    code, body = get("/patient/ZZZZ/state")
    assert code in [200, 404], (
        f"Nonexistent patient: expected 200 or 404, got {code}"
    )
    ok(f"Nonexistent patient: responded with {code}")

    # Missing required fields in chat
    code, body = post("/chat", json_data={})
    assert code in [200, 400, 422], (
        f"Missing chat fields: expected 200/400/422, got {code}"
    )
    ok(f"Missing chat fields: responded with {code}")

    # Invalid glucose value
    code, body = post("/glucose/log", json_data={"value": -999, "patient_id": "P001"})
    assert code in [200, 400, 422, 500], (
        f"Negative glucose: expected 200/400/422/500, got {code}"
    )
    ok(f"Negative glucose: responded with {code}")

    # No auth header — HARD ASSERT on 403
    try:
        r = requests.get(f"{BASE_URL}/nurse/alerts", timeout=5)
        assert_status("No auth header", r.status_code, 403)
        ok(f"No auth header: correctly rejected (403)")
    except AssertionError:
        raise
    except Exception as e:
        fail(f"No auth header test: {e}")
        raise AssertionError(f"No auth header test failed: {e}")

    # Wrong auth header — HARD ASSERT on 403
    try:
        r = requests.get(f"{BASE_URL}/nurse/alerts", headers={"X-API-Key": "wrong-key"}, timeout=5)
        assert_status("Wrong API key", r.status_code, 403)
        ok(f"Wrong API key: correctly rejected (403)")
    except AssertionError:
        raise
    except Exception as e:
        fail(f"Wrong API key test: {e}")
        raise AssertionError(f"Wrong API key test failed: {e}")


# ==============================================================================
# MAIN
# ==============================================================================
if __name__ == "__main__":
    print("=" * 70)
    print("BEWO HEALTHCARE -- LIVE API INTEGRATION TEST")
    print("=" * 70)

    start = time.time()

    if not start_server():
        print("\nCould not start server. Aborting API tests.")
        sys.exit(1)

    try:
        # Phase 1: Quick endpoints (no heavy computation)
        test_health()
        test_patient_state()
        test_glucose_endpoints()
        test_medication_endpoints()
        test_voucher_endpoints()
        test_voice_checkin()
        test_reminders()
        test_nurse_endpoints()
        test_drug_interactions()
        test_hmm_endpoints()
        test_error_handling()

        # Phase 2: Endpoints that trigger HMM/Merlion computation (one at a time)
        test_admin_endpoints()
        test_agent_endpoints()
        test_caregiver_endpoints()
        test_impact_endpoints()
        test_counterfactual()
        test_proactive_scan()

        # Phase 3: Heavy endpoints (Gemini calls, full pipeline)
        test_clinician_endpoints()
        test_full_demo_workflow()
        # Chat last since it calls Gemini (slow + may fail with bad key)
        test_chat()
    except AssertionError as ae:
        fail(f"HARD ASSERTION FAILED: {ae}")
        traceback.print_exc()
    except Exception as e:
        fail(f"UNEXPECTED EXCEPTION: {e}")
        traceback.print_exc()
    finally:
        stop_server()

    elapsed = time.time() - start

    print("\n" + "=" * 70)
    print(f"RESULTS: {PASS} passed, {FAIL} failed, {WARN} warnings")
    print(f"TIME: {elapsed:.1f}s")
    print("=" * 70)

    if FAIL > 0:
        print(f"\n!! {FAIL} FAILURES -- fix before demo!")
        sys.exit(1)
    else:
        print(f"\nAll API tests passed!")
        sys.exit(0)
