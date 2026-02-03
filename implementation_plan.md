# Secure Voice & Privacy Architecture Implementation Plan

## Goal
Enable a **Voice-Capable** conversational agent for elderly users using **SeaLion/MERaLiON** models, while ensuring **Zero-Leakage** of Personally Identifiable Information (PII) to the cloud.

## The Problem
Elderly users may accidentally reveal secrets (e.g., "My NRIC is S1234567A", "My daughter's number is 9123 4567") during voice chats. Sending this raw audio/text to the SeaLion Cloud API violates strict privacy requirements.

## The Solution: "The Middleware Firewall"
We will implement a **Server-Side PII Firewall** that sits between the User and the AI.
1.  **Input:** User speaks (Voice -> Text via Whisper/Browser).
2.  **Firewall:** `pii_monitor.py` scans text for Singapore-specific PII (NRIC, SG Phone, Singlish Names) and REDACTS it.
3.  **AI:** Receive sanitized text (e.g., "My daughter's number is <PHONE_NUMBER>").
4.  **Output:** AI responds safely.

## User Review Required
> [!IMPORTANT]
> **API Access:** You must sign up at the **SeaLion Playground** (sealion.ai) to get your API Key.
> **MERaLiON:** If you have access to MERaLiON (Multimodal), we can switch to it later. For now, we assume **SeaLion (Text)** + **Local Voice Processing** for maximum control.

## Proposed Changes

### 1. Security Layer (The Firewall)
#### [NEW] [pii_monitor.py](file:///c:/Users/brigh/.gemini/antigravity/Healthcare/pii_monitor.py)
- **Library:** `presidio-analyzer`, `presidio-anonymizer`
- **Logic:**
    - Custom PII Recognizer for **Singapore NRIC** (`[S|T|F|G]\d{7}[A-Z]`).
    - Custom PII Recognizer for **SG Phone Numbers** (`6|8|9\d{7}`).
    - Context-aware filtering for "Singlish" names if possible.

### 2. AI Interface Layer
#### [MODIFY] [sealion_interface.py](file:///c:/Users/brigh/.gemini/antigravity/Healthcare/sealion_interface.py)
- **Integration:** Import `PIIMonitor`.
- **Flow:** Update `translate_message` and `chat` methods to pass input through `PIIMonitor.scrub()` *before* calling the API.
- **Config:** Add support for valid `SEALION_API_KEY` (replacing the Google Gemini mock if the key is present).

### 3. Dependencies
#### [MODIFY] [requirements.txt](file:///c:/Users/brigh/.gemini/antigravity/Healthcare/requirements.txt)
- Add `presidio-analyzer`, `presidio-anonymizer`, `spacy`.
- Add `https://github.com/explosion/spacy-models/releases/download/en_core_web_lg-3.7.1/en_core_web_lg-3.7.1.tar.gz` (Spacy Model).

### 4. Application Layer (MVP)
#### [MODIFY] [streamlit_app.py](file:///c:/Users/brigh/.gemini/antigravity/Healthcare/streamlit_app.py)
- **UI:** Add a "Voice Chat" tab.
- **Input:** Use `st.audio_input` (Native) or `st.text_input` (Fallback) for testing the pipeline.
- **Feedback:** Show the "Sanitized Output" to the user (e.g., "We heard: My NRIC is <REDACTED>") to build trust.

## Verification Plan

### Automated Tests
1.  **Unit Test (`tests/test_pii_security.py`):**
    - Input: "My NRIC is S1234567A and phone is 91234567."
    - Assert Output: "My NRIC is <NRIC> and phone is <PHONE_NUMBER>."
    - **Critical:** Ensure NRIC is *never* leaked.

2.  **Integration Test:**
    - Mock SeaLion API.
    - Run full pipeline: Input -> PII Scrub -> Mock API -> Response.

### Manual Verification
1.  **Streamlit Demo:**
    - Open `streamlit_app.py`.
    - Type/Speak a message with a fake NRIC.
    - Verify the "Debug View" shows the redacted text being sent to the "Cloud".
