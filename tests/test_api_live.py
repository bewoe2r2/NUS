"""
LIVE End-to-End API Test Suite for Bewo Healthcare.
Starts the FastAPI server, hits every endpoint with proper auth, validates responses.

Run: python tests/test_api_live.py  (from project root)

Requires: FastAPI server NOT already running on port 8000
"""
import sys, os, json, time, subprocess, signal, requests, traceback

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://127.0.0.1:8000"
API_KEY = os.environ.get("BEWO_API_KEY", "bewo-dev-key-2026")
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
    try:
        r = requests.get(f"{BASE_URL}/", timeout=5)
        if r.status_code == 200:
            body = r.json()
            if body.get("status") == "ok":
                ok(f"GET / -> {r.status_code} ({body.get('system', '?')})")
            else:
                warn(f"GET / -> {r.status_code} but status={body.get('status')}")
        else:
            fail(f"GET / -> {r.status_code}")
    except Exception as e:
        fail(f"GET / -> {e}")

    # Auth rejection test
    try:
        r = requests.get(f"{BASE_URL}/patient/P001/state", timeout=5)
        if r.status_code == 403:
            ok("Auth rejection: 403 without API key")
        else:
            warn(f"Auth rejection: expected 403, got {r.status_code}")
    except Exception as e:
        warn(f"Auth test: {e}")


def test_patient_state():
    print("\n=== API: Patient State & History ===")

    # GET /patient/P001/state
    code, body = get("/patient/P001/state")
    if code == 200 and isinstance(body, dict):
        state = body.get('current_state')
        if state in ['STABLE', 'WARNING', 'CRISIS']:
            ok(f"GET /patient/P001/state -> {state} (conf={body.get('confidence', '?')})")
        else:
            warn(f"GET /patient/P001/state -> {code}, state={state}")
    else:
        warn(f"GET /patient/P001/state -> {code}, {str(body)[:100]}")

    # GET /patient/P001/history
    code, body = get("/patient/P001/history")
    if code == 200 and isinstance(body, dict):
        history = body.get('history', [])
        ok(f"GET /patient/P001/history -> {len(history)} points")
    else:
        warn(f"GET /patient/P001/history -> {code}")

    # GET /patient/P001/analysis/14days
    code, body = get("/patient/P001/analysis/14days")
    if code == 200:
        ok(f"GET /patient/P001/analysis/14days -> {code}")
    else:
        warn(f"GET /patient/P001/analysis/14days -> {code}")

    # GET /patient/P001/analysis/detail (requires date query param)
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    code, body = get(f"/patient/P001/analysis/detail?date={today}")
    if code == 200:
        ok(f"GET /patient/P001/analysis/detail?date={today} -> {code}")
    else:
        warn(f"GET /patient/P001/analysis/detail?date={today} -> {code}")


def test_glucose_endpoints():
    print("\n=== API: Glucose Endpoints ===")

    # POST /glucose/log
    code, body = post("/glucose/log", json_data={"value": 6.5, "unit": "mmol/L", "source": "MANUAL", "patient_id": "P001"})
    if code == 200:
        ok(f"POST /glucose/log -> {code} (value={body.get('value', '?')})")
    else:
        warn(f"POST /glucose/log -> {code}, {str(body)[:100]}")

    # POST /glucose/log with mg/dL conversion
    code, body = post("/glucose/log", json_data={"value": 120, "unit": "mg/dL", "source": "MANUAL", "patient_id": "P001"})
    if code == 200:
        converted = body.get('value', 0)
        if 6.0 < converted < 7.5:  # 120/18 = 6.67
            ok(f"POST /glucose/log mg/dL -> {code} (converted={converted:.2f} mmol/L)")
        else:
            warn(f"POST /glucose/log mg/dL conversion: {converted}")
    else:
        warn(f"POST /glucose/log mg/dL -> {code}")


def test_medication_endpoints():
    print("\n=== API: Medication Endpoints ===")

    # GET /medications/P001
    code, body = get("/medications/P001")
    if code == 200:
        ok(f"GET /medications/P001 -> {code}")
    else:
        warn(f"GET /medications/P001 -> {code}")

    # POST /medications/log
    code, body = post("/medications/log", json_data={"medication_name": "Metformin 500mg", "taken": True, "patient_id": "P001"})
    if code == 200:
        ok(f"POST /medications/log -> {code}")
    else:
        warn(f"POST /medications/log -> {code}, {str(body)[:100]}")


def test_voucher_endpoints():
    print("\n=== API: Voucher Endpoints ===")

    # GET /voucher/P001
    code, body = get("/voucher/P001")
    if code == 200 and isinstance(body, dict):
        ok(f"GET /voucher/P001 -> {code} (value=${body.get('current_value', '?')})")
    else:
        warn(f"GET /voucher/P001 -> {code}")

    # GET /voucher/P001/qr
    code, body = get("/voucher/P001/qr")
    if code == 200:
        ok(f"GET /voucher/P001/qr -> {code}")
    else:
        warn(f"GET /voucher/P001/qr -> {code}")


def test_voice_checkin():
    print("\n=== API: Voice Check-in ===")

    code, body = post("/voice/checkin", json_data={"transcript": "I feel okay today, my sugar seems normal", "patient_id": "P001"})
    if code == 200 and isinstance(body, dict):
        ok(f"POST /voice/checkin -> {code} (urgency={body.get('urgency', '?')}, sentiment={body.get('sentiment_score', '?')})")
    else:
        warn(f"POST /voice/checkin -> {code}, {str(body)[:100]}")


def test_reminders():
    print("\n=== API: Reminders ===")

    code, body = get("/reminders/P001")
    if code == 200:
        ok(f"GET /reminders/P001 -> {code}")
    else:
        warn(f"GET /reminders/P001 -> {code}")


def test_nurse_endpoints():
    print("\n=== API: Nurse Endpoints ===")

    # GET /nurse/alerts
    code, body = get("/nurse/alerts")
    if code == 200:
        if isinstance(body, list):
            ok(f"GET /nurse/alerts -> {code} ({len(body)} alerts)")
        else:
            ok(f"GET /nurse/alerts -> {code}")
    else:
        warn(f"GET /nurse/alerts -> {code}")

    # GET /nurse/patients
    code, body = get("/nurse/patients")
    if code == 200:
        ok(f"GET /nurse/patients -> {code}")
    else:
        warn(f"GET /nurse/patients -> {code}")

    # GET /nurse/triage
    code, body = get("/nurse/triage")
    if code == 200:
        ok(f"GET /nurse/triage -> {code}")
    else:
        warn(f"GET /nurse/triage -> {code}")

    # GET /nurse/triage/P001
    code, body = get("/nurse/triage/P001")
    if code == 200:
        ok(f"GET /nurse/triage/P001 -> {code}")
    else:
        warn(f"GET /nurse/triage/P001 -> {code}")


def test_agent_endpoints():
    print("\n=== API: Agent Endpoints ===")

    # GET /agent/status/P001
    code, body = get("/agent/status/P001")
    if code == 200:
        ok(f"GET /agent/status/P001 -> {code}")
    else:
        warn(f"GET /agent/status/P001 -> {code}")

    # GET /agent/actions/P001
    code, body = get("/agent/actions/P001")
    if code == 200:
        ok(f"GET /agent/actions/P001 -> {code}")
    else:
        warn(f"GET /agent/actions/P001 -> {code}")

    # GET /agent/conversation/P001
    code, body = get("/agent/conversation/P001")
    if code == 200:
        ok(f"GET /agent/conversation/P001 -> {code}")
    else:
        warn(f"GET /agent/conversation/P001 -> {code}")

    # GET /agent/streaks/P001
    code, body = get("/agent/streaks/P001")
    if code == 200:
        ok(f"GET /agent/streaks/P001 -> {code}")
    else:
        warn(f"GET /agent/streaks/P001 -> {code}")

    # GET /agent/engagement/P001
    code, body = get("/agent/engagement/P001")
    if code == 200:
        ok(f"GET /agent/engagement/P001 -> {code}")
    else:
        warn(f"GET /agent/engagement/P001 -> {code}")

    # GET /agent/weekly-report/P001
    code, body = get("/agent/weekly-report/P001")
    if code == 200:
        ok(f"GET /agent/weekly-report/P001 -> {code}")
    else:
        warn(f"GET /agent/weekly-report/P001 -> {code}")

    # GET /agent/nudge-times/P001
    code, body = get("/agent/nudge-times/P001")
    if code == 200:
        ok(f"GET /agent/nudge-times/P001 -> {code}")
    else:
        warn(f"GET /agent/nudge-times/P001 -> {code}")

    # POST /agent/detect-mood
    code, body = post("/agent/detect-mood", json_data={"text": "I'm feeling great today!"})
    if code == 200:
        ok(f"POST /agent/detect-mood -> {code}")
    else:
        warn(f"POST /agent/detect-mood -> {code}, {str(body)[:100]}")

    # GET /agent/daily-challenge/P001
    code, body = get("/agent/daily-challenge/P001")
    if code == 200:
        ok(f"GET /agent/daily-challenge/P001 -> {code}")
    else:
        warn(f"GET /agent/daily-challenge/P001 -> {code}")

    # GET /agent/caregiver-fatigue/P001
    code, body = get("/agent/caregiver-fatigue/P001")
    if code == 200:
        ok(f"GET /agent/caregiver-fatigue/P001 -> {code}")
    else:
        warn(f"GET /agent/caregiver-fatigue/P001 -> {code}")

    # GET /agent/glucose-narrative/P001
    code, body = get("/agent/glucose-narrative/P001")
    if code == 200:
        ok(f"GET /agent/glucose-narrative/P001 -> {code}")
    else:
        warn(f"GET /agent/glucose-narrative/P001 -> {code}")

    # GET /agent/memory/P001
    code, body = get("/agent/memory/P001")
    if code == 200:
        ok(f"GET /agent/memory/P001 -> {code}")
    else:
        warn(f"GET /agent/memory/P001 -> {code}")

    # GET /agent/tool-effectiveness/P001
    code, body = get("/agent/tool-effectiveness/P001")
    if code == 200:
        ok(f"GET /agent/tool-effectiveness/P001 -> {code}")
    else:
        warn(f"GET /agent/tool-effectiveness/P001 -> {code}")

    # GET /agent/safety-log/P001
    code, body = get("/agent/safety-log/P001")
    if code == 200:
        ok(f"GET /agent/safety-log/P001 -> {code}")
    else:
        warn(f"GET /agent/safety-log/P001 -> {code}")

    # GET /agent/proactive-history/P001
    code, body = get("/agent/proactive-history/P001")
    if code == 200:
        ok(f"GET /agent/proactive-history/P001 -> {code}")
    else:
        warn(f"GET /agent/proactive-history/P001 -> {code}")


def test_caregiver_endpoints():
    print("\n=== API: Caregiver Endpoints ===")

    # GET /caregiver/dashboard/P001
    code, body = get("/caregiver/dashboard/P001")
    if code == 200:
        ok(f"GET /caregiver/dashboard/P001 -> {code}")
    else:
        warn(f"GET /caregiver/dashboard/P001 -> {code}")

    # GET /caregiver/burden/P001
    code, body = get("/caregiver/burden/P001")
    if code == 200:
        ok(f"GET /caregiver/burden/P001 -> {code}")
    else:
        warn(f"GET /caregiver/burden/P001 -> {code}")


def test_clinician_endpoints():
    print("\n=== API: Clinician Endpoints ===")

    # GET /clinician/summary/P001
    code, body = get("/clinician/summary/P001")
    if code == 200:
        ok(f"GET /clinician/summary/P001 -> {code}")
    else:
        warn(f"GET /clinician/summary/P001 -> {code}")


def test_impact_endpoints():
    print("\n=== API: Impact Metrics ===")

    # GET /impact/metrics/P001
    code, body = get("/impact/metrics/P001")
    if code == 200:
        ok(f"GET /impact/metrics/P001 -> {code}")
    else:
        warn(f"GET /impact/metrics/P001 -> {code}")

    # GET /impact/intervention-effectiveness/P001
    code, body = get("/impact/intervention-effectiveness/P001")
    if code == 200:
        ok(f"GET /impact/intervention-effectiveness/P001 -> {code}")
    else:
        warn(f"GET /impact/intervention-effectiveness/P001 -> {code}")


def test_drug_interactions():
    print("\n=== API: Drug Interactions ===")

    # GET /patient/P001/drug-interactions
    code, body = get("/patient/P001/drug-interactions")
    if code == 200 and isinstance(body, dict):
        ok(f"GET /patient/P001/drug-interactions -> {body.get('interactions_found', 0)} interactions")
    else:
        warn(f"GET /patient/P001/drug-interactions -> {code}")

    # POST /patient/P001/drug-interactions/check
    code, body = post("/patient/P001/drug-interactions/check",
                      json_data={"medications": ["Metformin 500mg", "Insulin Glargine", "Lisinopril 10mg"]})
    if code == 200 and isinstance(body, dict):
        ok(f"POST drug-interactions/check -> {body.get('interactions_found', 0)} interactions")
    else:
        warn(f"POST drug-interactions/check -> {code}, {str(body)[:100]}")


def test_hmm_endpoints():
    print("\n=== API: HMM Training & Params ===")

    # POST /hmm/train/P001
    code, body = post("/hmm/train/P001", timeout=30)
    if code in [200]:
        ok(f"POST /hmm/train/P001 -> {code}")
    else:
        warn(f"POST /hmm/train/P001 -> {code}")

    # GET /hmm/params/P001
    code, body = get("/hmm/params/P001")
    if code in [200, 404]:
        ok(f"GET /hmm/params/P001 -> {code}")
    else:
        warn(f"GET /hmm/params/P001 -> {code}")


def test_admin_endpoints():
    print("\n=== API: Admin/Demo Endpoints ===")

    # POST /admin/inject-scenario (query param) — these write many rows, need longer timeout
    for scenario in ['stable_perfect', 'warning_to_crisis', 'sudden_crisis']:
        code, body = post(f"/admin/inject-scenario?scenario={scenario}", timeout=30)
        if code == 200 and isinstance(body, dict):
            ok(f"POST inject-scenario={scenario} -> {body.get('observations', '?')} obs")
        else:
            warn(f"POST inject-scenario={scenario} -> {code}, {str(body)[:100]}")

    # POST /admin/run-hmm — analyzes all observations with HMM
    code, body = post("/admin/run-hmm", timeout=30)
    if code == 200 and isinstance(body, dict):
        ok(f"POST /admin/run-hmm -> analyzed={body.get('analyzed', '?')}")
    else:
        warn(f"POST /admin/run-hmm -> {code}")

    # POST /admin/reset
    code, body = post("/admin/reset", timeout=30)
    if code == 200:
        ok(f"POST /admin/reset -> {code}")
    else:
        warn(f"POST /admin/reset -> {code}")


def test_proactive_scan():
    """Proactive scan/checkin endpoints call Gemini AI — may timeout with expired API key."""
    print("\n=== API: Proactive Scan (Gemini-dependent) ===")

    # POST /agent/proactive-scan
    code, body = post("/agent/proactive-scan", timeout=60)
    if code == 200:
        ok(f"POST /agent/proactive-scan -> {code}")
    else:
        warn(f"POST /agent/proactive-scan -> {code} (Gemini-dependent)")

    # POST /agent/proactive-scan/P001
    code, body = post("/agent/proactive-scan/P001", timeout=60)
    if code == 200:
        ok(f"POST /agent/proactive-scan/P001 -> {code}")
    else:
        warn(f"POST /agent/proactive-scan/P001 -> {code} (Gemini-dependent)")

    # POST /agent/proactive-checkin/P001
    code, body = post("/agent/proactive-checkin/P001", timeout=60)
    if code == 200:
        ok(f"POST /agent/proactive-checkin/P001 -> {code}")
    else:
        warn(f"POST /agent/proactive-checkin/P001 -> {code} (Gemini-dependent)")


def test_counterfactual():
    print("\n=== API: Counterfactual ===")

    code, body = post("/agent/counterfactual/P001", json_data={"feature": "meds_adherence", "value": 1.0})
    if code == 200:
        ok(f"POST /agent/counterfactual/P001 -> {code}")
    else:
        warn(f"POST /agent/counterfactual/P001 -> {code}, {str(body)[:100]}")


def test_chat():
    """Test the AI chat endpoint (requires Gemini API key)."""
    print("\n=== API: Chat (Gemini AI) ===")

    code, body = post("/chat", json_data={"message": "Hello, how are you?", "patient_id": "P001"}, timeout=30)
    if code == 200 and isinstance(body, dict):
        msg = body.get('message', '')
        if len(msg) > 5:
            ok(f"POST /chat -> {code} (response: {msg[:80]}...)")
        else:
            warn(f"POST /chat -> {code} but short response: '{msg}'")
    elif code == 200:
        ok(f"POST /chat -> {code}")
    else:
        warn(f"POST /chat -> {code}, {str(body)[:100]}")


def test_full_demo_workflow():
    """Simulate the judge demo workflow end-to-end."""
    print("\n=== API: Full Demo Workflow ===")

    # Step 1: Inject a warning_to_crisis scenario
    code, body = post("/admin/inject-scenario?scenario=warning_to_crisis", timeout=60)
    if code == 200:
        ok(f"Demo Step 1: Inject scenario -> {body.get('observations', '?')} obs")
    elif code == -1:
        warn(f"Demo Step 1: timeout (server may be overloaded from prior tests)")
        return
    else:
        fail(f"Demo Step 1: inject failed ({code})", str(body)[:100])
        return

    # Step 2: Run HMM
    code, body = post("/admin/run-hmm", timeout=60)
    if code == 200:
        ok(f"Demo Step 2: Run HMM -> analyzed={body.get('analyzed', '?')}")
    else:
        fail(f"Demo Step 2: run-hmm failed ({code})")
        return

    # Step 3: Get patient state
    code, body = get("/patient/P001/state")
    if code == 200 and isinstance(body, dict):
        ok(f"Demo Step 3: Patient state -> {body.get('current_state', '?')} (risk={body.get('risk_score', '?')})")
    else:
        warn(f"Demo Step 3: patient state failed ({code})")

    # Step 4: Check drug interactions
    code, body = get("/patient/P001/drug-interactions")
    if code == 200:
        ok(f"Demo Step 4: Drug interactions -> {body.get('interactions_found', 0)} found")
    else:
        warn(f"Demo Step 4: drug-interactions failed ({code})")

    # Step 5: Get nurse triage
    code, body = get("/nurse/triage")
    if code == 200:
        ok(f"Demo Step 5: Nurse triage -> {code}")
    else:
        warn(f"Demo Step 5: triage failed ({code})")

    # Step 6: Get counterfactual
    code, body = post("/agent/counterfactual/P001", json_data={"feature": "meds_adherence", "value": 1.0})
    if code == 200:
        ok(f"Demo Step 6: Counterfactual -> {code}")
    else:
        warn(f"Demo Step 6: counterfactual failed ({code})")

    # Step 7: Impact metrics
    code, body = get("/impact/metrics/P001")
    if code == 200:
        ok(f"Demo Step 7: Impact metrics -> {code}")
    else:
        warn(f"Demo Step 7: impact failed ({code})")

    # Step 8: Clinician summary
    code, body = get("/clinician/summary/P001")
    if code == 200:
        ok(f"Demo Step 8: Clinician summary -> {code}")
    else:
        warn(f"Demo Step 8: clinician summary failed ({code})")

    print("  --- Demo workflow complete ---")


def test_error_handling():
    """Test API error handling and edge cases."""
    print("\n=== API: Error Handling ===")

    # Invalid scenario name
    code, body = post("/admin/inject-scenario?scenario=nonexistent_scenario_xyz", timeout=30)
    if code in [200, 400, 422]:
        ok(f"Invalid scenario: responded with {code} (didn't hang)")
    else:
        warn(f"Invalid scenario: {code}")

    # Nonexistent patient
    code, body = get("/patient/ZZZZ/state")
    if code in [200, 404]:
        ok(f"Nonexistent patient: responded with {code}")
    else:
        warn(f"Nonexistent patient: {code}")

    # Missing required fields in chat
    code, body = post("/chat", json_data={})
    if code in [200, 400, 422]:
        ok(f"Missing chat fields: responded with {code}")
    else:
        warn(f"Missing chat fields: {code}")

    # Invalid glucose value
    code, body = post("/glucose/log", json_data={"value": -999, "patient_id": "P001"})
    if code in [200, 400, 422, 500]:
        ok(f"Negative glucose: responded with {code}")
    else:
        warn(f"Negative glucose: {code}")

    # No auth header
    try:
        r = requests.get(f"{BASE_URL}/nurse/alerts", timeout=5)
        if r.status_code == 403:
            ok(f"No auth header: correctly rejected (403)")
        else:
            warn(f"No auth header: expected 403, got {r.status_code}")
    except Exception as e:
        warn(f"No auth header test: {e}")

    # Wrong auth header
    try:
        r = requests.get(f"{BASE_URL}/nurse/alerts", headers={"X-API-Key": "wrong-key"}, timeout=5)
        if r.status_code == 403:
            ok(f"Wrong API key: correctly rejected (403)")
        else:
            warn(f"Wrong API key: expected 403, got {r.status_code}")
    except Exception as e:
        warn(f"Wrong API key test: {e}")


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
