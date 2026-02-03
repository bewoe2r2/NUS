"""
NEXUS 2026 - Node 3B: SEA-LION Interface (The Cultural Translator)
file: sealion_interface.py
author: Lead Architect

This module represents the 'Cultural Layer' of the Diamond Architecture.
It wraps the SEA-LION (Southeast Asian Languages In One Network) logic.

OBJECTIVE:
Reduce 'Social Distance' between AI and Patient.
Translation is not just linguistic; it is SEMIOTIC (Cultural Symbols).

NOTE: In this prototype, we simulate SEA-LION's capabilities using 
highly specific prompt engineering on our available LLM backend, 
enforcing strict dialect rules (Singlish, Hokkien-Loanwords).
"""

import json
import os
from dotenv import load_dotenv

# Try to import google.generativeai (may not be installed or may be offline)
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    print("WARNING: 'google.generativeai' not found. SeaLion running in MOCK mode.")

class SeaLionInterface:
    def __init__(self, api_key=None):
        load_dotenv()
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        self.model = None
        if GENAI_AVAILABLE and self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
    def translate_message(self, core_message, target_dialect="singlish_elder", mood="concerned"):
        """
        Translates a clinical message into a specific Cultural Register.
        
        Args:
            core_message (str): The medical strategy (e.g., "Glucose is high, eat carbs")
            target_dialect (str): "singlish_elder", "malay_formal", "mandarin_mix"
            mood (str): "celebratory", "concerned", "urgent_command"
            
        Returns:
            str: The culturally aligned message (e.g., "Uncle, numbers no good lah!")
        """
        if not GENAI_AVAILABLE or not self.api_key:
            return f"[Offline Mock] {core_message} (lah)"

        # === LEVEL 10 PROMPT ENGINEERING ===
        # We don't just say "speak Singlish". We define the LINGUISTIC SCHEMA.
        
        system_prompt = f"""
        You are SEA-LION (Southeast Asian Languages In One Network).
        Your goal is NOT to translate meaning, but to MAXIMIZE TRUST via "Linguistic Isomorphism".
        
        TARGET REGISTER: {target_dialect.upper()}
        MOOD: {mood.upper()}
        
        RULES FOR 'SINGLISH_ELDER':
        1.  **Syntax:** Use topic-comment structure ("Medicine take already?"). 
        2.  **Particles:** Use 'lah' (softener), 'lor' (resignation), 'meh' (skepticism), 'leh' (persuasion).
        3.  **Loanwords:** Use 'Kopitiam' (Coffee shop), 'Sweets' (Diabetes), 'Makan' (Eat).
        4.  **Tone:** AVOID "Corporate Speak". Be authoritative yet familial ("Uncle-style").
        5.  **Pragmatics:** Frame health in terms of FUNCTION ("Can walk or not") rather than abstract metrics ("HbA1c").
        
        RULES FOR 'URGENT_COMMAND':
        1. Short sentences.
        2. Imperative verbs first.
        3. No politeness markers ("Please"). Direct instruction.
        
        INPUT MESSAGE (Medical Truth):
        "{core_message}"
        
        TASK:
        Rewrite the input into the Target Register. 
        Do not add medical advice not in the input. 
        Just re-encode the signal.
        """
        
        try:
            response = self.model.generate_content(system_prompt)
            return response.text.strip()
        except Exception as e:
            print(f"SeaLion Error: {e}")
            return core_message # Fail safe

    def generate_cultural_sbar(self, sbar_data):
        """
        Translates a clinical SBAR into a 'Family Update' for the caregiver.
        Removes jargon, emphasizes 'Actionable Care'.
        """
        # (Implementation placeholder for future expansion)
        pass

if __name__ == "__main__":
    # Test Bench
    sl = SeaLionInterface()
    
    msg = "Your glucose is dropping rapidly. You need to eat 15 grams of carbohydrates immediately to prevent hypoglycemia."
    
    print("--- Medical Truth ---")
    print(msg)
    
    print("\n--- SEA-LION: Singlish Elder (Urgent) ---")
    print(sl.translate_message(msg, "singlish_elder", "urgent_command"))
    
    msg2 = "Great job keeping your sugar stable for 3 days. Keep it up."
    print("\n--- SEA-LION: Singlish Elder (Celebratory) ---")
    print(sl.translate_message(msg2, "singlish_elder", "celebratory"))
