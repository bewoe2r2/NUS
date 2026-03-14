"""
Bewo 2026 - Node 3B: SEA-LION Interface (The Cultural Translator)
file: sealion_interface.py

This module represents the 'Cultural Layer' of the Diamond Architecture.
It calls the REAL SEA-LION v4 27B model via Cloudflare Workers AI,
with fallback to Gemini-powered simulation if Cloudflare creds are missing.

OBJECTIVE:
Reduce 'Social Distance' between AI and Patient.
Translation is not just linguistic; it is SEMIOTIC (Cultural Symbols).

Backend priority:
1. Cloudflare Workers AI → SEA-LION v4 27B (real model)
2. Gemini mock (prompt-engineered Singlish)
3. Offline string append
"""

import json
import os
import requests
from dotenv import load_dotenv

# Try to import google.generativeai (fallback backend)
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# SEA-LION model on Cloudflare Workers AI
SEALION_MODEL = "@cf/aisingapore/gemma-sea-lion-v4-27b-it"

# The linguistic schema prompt — shared across backends
SINGLISH_SYSTEM_PROMPT = """You are SEA-LION (Southeast Asian Languages In One Network).
Your goal is NOT to translate meaning, but to MAXIMIZE TRUST via "Linguistic Isomorphism".

TARGET REGISTER: {dialect}
MOOD: {mood}

RULES FOR 'SINGLISH_ELDER':
1.  Syntax: Use topic-comment structure ("Medicine take already?").
2.  Particles: Use 'lah' (softener), 'lor' (resignation), 'meh' (skepticism), 'leh' (persuasion).
3.  Loanwords: Use 'Kopitiam' (Coffee shop), 'Sweets' (Diabetes), 'Makan' (Eat).
4.  Tone: AVOID "Corporate Speak". Be authoritative yet familial ("Uncle-style").
5.  Pragmatics: Frame health in terms of FUNCTION ("Can walk or not") rather than abstract metrics ("HbA1c").

RULES FOR 'URGENT_COMMAND':
1. Short sentences.
2. Imperative verbs first.
3. No politeness markers ("Please"). Direct instruction.

RULES FOR 'CELEBRATORY':
1. Warm, encouraging tone.
2. Use exclamations ("Wah!", "Steady!").
3. Reinforce positive behavior.

TASK:
Rewrite the input into the Target Register.
Do not add medical advice not in the input.
Just re-encode the signal. Return ONLY the rewritten message."""


class SeaLionInterface:
    def __init__(self, api_key=None):
        load_dotenv()

        # Cloudflare Workers AI credentials (primary backend)
        self.cf_account_id = os.getenv('CLOUDFLARE_ACCOUNT_ID')
        self.cf_auth_token = os.getenv('CLOUDFLARE_AUTH_TOKEN')
        self.use_cloudflare = bool(self.cf_account_id and self.cf_auth_token)

        # Gemini fallback
        self.gemini_key = api_key or os.getenv('GEMINI_API_KEY')
        self.gemini_model = None
        if GENAI_AVAILABLE and self.gemini_key and not self.use_cloudflare:
            genai.configure(api_key=self.gemini_key)
            self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')

        if self.use_cloudflare:
            print("SEA-LION: Using REAL SEA-LION v4 27B via Cloudflare Workers AI")
        elif self.gemini_model:
            print("SEA-LION: Using Gemini mock (Cloudflare creds not set)")
        else:
            print("SEA-LION: Running in OFFLINE mode")

    def translate_message(self, core_message, target_dialect="singlish_elder", mood="concerned"):
        """
        Translates a clinical message into a specific Cultural Register.

        Backend priority: Cloudflare SEA-LION → Gemini mock → offline mock.

        Args:
            core_message (str): The medical strategy (e.g., "Glucose is high, eat carbs")
            target_dialect (str): "singlish_elder", "malay_formal", "mandarin_mix"
            mood (str): "celebratory", "concerned", "urgent_command"

        Returns:
            str: The culturally aligned message (e.g., "Uncle, numbers no good lah!")
        """
        system_prompt = SINGLISH_SYSTEM_PROMPT.format(
            dialect=target_dialect.upper(),
            mood=mood.upper()
        )

        # Try Cloudflare Workers AI (real SEA-LION)
        if self.use_cloudflare:
            result = self._call_cloudflare(system_prompt, core_message)
            if result:
                return result

        # Fallback: Gemini mock
        if self.gemini_model:
            result = self._call_gemini(system_prompt, core_message)
            if result:
                return result

        # Final fallback: offline mock
        return self._offline_mock(core_message, mood)

    def _call_cloudflare(self, system_prompt, user_message):
        """Call real SEA-LION v4 27B via Cloudflare Workers AI REST API."""
        url = f"https://api.cloudflare.com/client/v4/accounts/{self.cf_account_id}/ai/run/{SEALION_MODEL}"
        headers = {"Authorization": f"Bearer {self.cf_auth_token}"}
        payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()

            if data.get("success") and data.get("result"):
                result = data["result"]

                # OpenAI chat completion format (choices[].message.content)
                if isinstance(result, dict) and "choices" in result:
                    content = result["choices"][0]["message"]["content"]
                    return content.strip()

                # Simple response format (result.response)
                if isinstance(result, dict) and "response" in result:
                    return result["response"].strip()

                # Raw string
                if isinstance(result, str):
                    return result.strip()

            print(f"SEA-LION CF: Unexpected response: {json.dumps(data)[:200]}")
            return None

        except requests.exceptions.Timeout:
            print("SEA-LION CF: Request timed out (30s)")
            return None
        except requests.exceptions.RequestException as e:
            print(f"SEA-LION CF: Request failed: {e}")
            return None
        except (KeyError, ValueError) as e:
            print(f"SEA-LION CF: Parse error: {e}")
            return None

    def _call_gemini(self, system_prompt, user_message):
        """Fallback: Use Gemini to simulate SEA-LION style translation."""
        full_prompt = f"{system_prompt}\n\nINPUT MESSAGE (Medical Truth):\n\"{user_message}\""
        try:
            response = self.gemini_model.generate_content(full_prompt)
            return response.text.strip()
        except Exception as e:
            print(f"SEA-LION Gemini fallback error: {e}")
            return None

    def _offline_mock(self, core_message, mood):
        """Last resort: basic string transformation for offline/testing."""
        if mood == "urgent_command":
            return f"Oi! {core_message} Now, quick!"
        elif mood == "celebratory":
            return f"Wah, steady lah! {core_message} Keep it up!"
        else:
            return f"Uncle/Auntie ah, {core_message} Take care lah."

    def generate_cultural_sbar(self, sbar_data):
        """
        Translates a clinical SBAR into a 'Family Update' for the caregiver.
        Removes jargon, emphasizes 'Actionable Care'.
        """
        if not sbar_data:
            return None

        user_message = f"""Convert this clinical SBAR report into a simple family-friendly update.
Remove all medical jargon. Focus on what the caregiver can DO.

SBAR:
Situation: {sbar_data.get('situation', 'N/A')}
Background: {sbar_data.get('background', 'N/A')}
Assessment: {sbar_data.get('assessment', 'N/A')}
Recommendation: {sbar_data.get('recommendation', 'N/A')}

Write it as a warm, clear message to a family member in Singlish. 2-3 sentences max."""

        system_prompt = SINGLISH_SYSTEM_PROMPT.format(
            dialect="SINGLISH_ELDER",
            mood="CONCERNED"
        )

        if self.use_cloudflare:
            result = self._call_cloudflare(system_prompt, user_message)
            if result:
                return result

        if self.gemini_model:
            result = self._call_gemini(system_prompt, user_message)
            if result:
                return result

        return f"Family update: {sbar_data.get('situation', 'Patient needs attention')}. Please check in lah."

    def get_backend_info(self):
        """Returns which backend is active — useful for debugging and demo."""
        if self.use_cloudflare:
            return {"backend": "cloudflare_sealion_v4_27b", "model": SEALION_MODEL, "status": "real"}
        elif self.gemini_model:
            return {"backend": "gemini_mock", "model": "gemini-2.0-flash-exp", "status": "simulated"}
        else:
            return {"backend": "offline_mock", "model": None, "status": "offline"}


if __name__ == "__main__":
    sl = SeaLionInterface()

    print(f"Backend: {sl.get_backend_info()}")

    msg = "Your glucose is dropping rapidly. You need to eat 15 grams of carbohydrates immediately to prevent hypoglycemia."

    print("\n--- Medical Truth ---")
    print(msg)

    print("\n--- SEA-LION: Singlish Elder (Urgent) ---")
    print(sl.translate_message(msg, "singlish_elder", "urgent_command"))

    msg2 = "Great job keeping your sugar stable for 3 days. Keep it up."
    print("\n--- SEA-LION: Singlish Elder (Celebratory) ---")
    print(sl.translate_message(msg2, "singlish_elder", "celebratory"))

    print("\n--- SEA-LION: Singlish Elder (Concerned) ---")
    print(sl.translate_message("You missed your morning medication today.", "singlish_elder", "concerned"))
