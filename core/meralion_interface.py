"""
Bewo 2026 - MERaLiON Interface (A*STAR Speech AI)
file: core/meralion_interface.py

Integrates A*STAR MERaLiON speech AI models via the Hugging Face Inference API.
No local GPU required -- HTTP calls to HF hosted inference endpoints.

Models used:
1. MERaLiON-AudioLLM-Whisper-SEA-LION  -- Singlish-aware ASR (speech-to-text)
2. MERaLiON-SER-v1                     -- Speech Emotion Recognition (7 emotions)

Backend priority:
1. Hugging Face Inference API (real MERaLiON)
2. None -- returns None on failure, caller handles fallback
"""

import json
import logging
import os
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv():
        pass

logger = logging.getLogger(__name__)

MERALION_ASR_MODEL = "MERaLiON/MERaLiON-AudioLLM-Whisper-SEA-LION"
MERALION_SER_MODEL = "MERaLiON/MERaLiON-SER-v1"

HF_API_BASE = "https://api-inference.huggingface.co/models"
HF_ASR_URL = f"{HF_API_BASE}/{MERALION_ASR_MODEL}"
HF_SER_URL = f"{HF_API_BASE}/{MERALION_SER_MODEL}"

MERALION_EMOTIONS = ["angry", "disgusted", "fearful", "happy", "neutral", "sad", "surprised"]

EMOTION_SENTIMENT_MAP = {
    "happy": 0.9,
    "neutral": 0.6,
    "surprised": 0.5,
    "sad": -0.3,
    "fearful": -0.5,
    "angry": -0.6,
    "disgusted": -0.7,
}

EMOTION_URGENCY_MAP = {
    "happy": "low",
    "neutral": "low",
    "surprised": "low",
    "sad": "medium",
    "fearful": "medium",
    "angry": "medium",
    "disgusted": "medium",
}


class MeralionInterface:
    """Interface to A*STAR MERaLiON speech AI models via Hugging Face Inference API."""

    def __init__(self):
        load_dotenv()
        self.hf_token = os.getenv("HUGGINGFACE_TOKEN")
        self.available = bool(REQUESTS_AVAILABLE and self.hf_token)

        if self.available:
            logger.info(f"MERaLiON: Initialized with HuggingFace token (ASR: {MERALION_ASR_MODEL}, SER: {MERALION_SER_MODEL})")
        elif not REQUESTS_AVAILABLE:
            logger.warning("MERaLiON: requests library not available -- running offline")
        else:
            logger.warning("MERaLiON: HUGGINGFACE_TOKEN not set -- MERaLiON disabled")

    def _get_headers(self):
        """Build authorization headers for HF Inference API."""
        return {"Authorization": f"Bearer {self.hf_token}"}

    def transcribe_speech(self, audio_bytes):
        """
        Transcribe speech audio to text using MERaLiON ASR.
        Optimized for Singlish and Southeast Asian English.

        Args:
            audio_bytes: Raw audio file bytes (wav, mp3, flac, etc.)

        Returns:
            Transcribed text string, or None if unavailable/failed.
        """
        if not self.available:
            logger.debug("MERaLiON ASR: Not available, skipping")
            return None

        if not audio_bytes:
            return None

        try:
            response = requests.post(
                HF_ASR_URL,
                headers=self._get_headers(),
                data=audio_bytes,
                timeout=30,
            )

            if response.status_code == 503:
                logger.info("MERaLiON ASR: Model is loading (cold start), falling back")
                return None

            response.raise_for_status()
            result = response.json()

            if isinstance(result, dict) and "text" in result:
                text = result["text"].strip()
                logger.info(f"MERaLiON ASR: Transcribed {len(audio_bytes)} bytes")
                return text

            if isinstance(result, list) and len(result) > 0:
                first = result[0]
                if isinstance(first, dict) and "text" in first:
                    text = first["text"].strip()
                    logger.info(f"MERaLiON ASR: Transcribed {len(audio_bytes)} bytes")
                    return text

            logger.warning(f"MERaLiON ASR: Unexpected response format: {json.dumps(result)[:200]}")
            return None

        except requests.exceptions.Timeout:
            logger.warning("MERaLiON ASR: Request timed out (30s)")
            return None
        except requests.exceptions.RequestException as e:
            logger.warning(f"MERaLiON ASR: Request failed: {e}")
            return None
        except (KeyError, ValueError, json.JSONDecodeError) as e:
            logger.warning(f"MERaLiON ASR: Parse error: {e}")
            return None

    def detect_speech_emotion(self, audio_bytes):
        """
        Detect emotion from speech audio using MERaLiON-SER-v1.
        Recognizes 7 emotions: angry, disgusted, fearful, happy, neutral, sad, surprised.

        Args:
            audio_bytes: Raw audio file bytes (wav, mp3, flac, etc.)

        Returns:
            Dict with emotion results, or None if unavailable/failed.
        """
        if not self.available:
            logger.debug("MERaLiON SER: Not available, skipping")
            return None

        if not audio_bytes:
            return None

        try:
            response = requests.post(
                HF_SER_URL,
                headers=self._get_headers(),
                data=audio_bytes,
                timeout=30,
            )

            if response.status_code == 503:
                logger.info("MERaLiON SER: Model is loading (cold start), falling back")
                return None

            response.raise_for_status()
            result = response.json()

            # HF Inference API may return [[{label, score}, ...]] or [{label, score}, ...]
            if isinstance(result, list) and len(result) > 0:
                items = result
                if isinstance(result[0], list):
                    items = result[0]

                all_scores = {}
                for item in items:
                    if isinstance(item, dict) and "label" in item and "score" in item:
                        label = item["label"].lower()
                        all_scores[label] = item["score"]

                if not all_scores:
                    logger.warning(f"MERaLiON SER: No valid scores in response: {json.dumps(result)[:200]}")
                    return None

                dominant_emotion = max(all_scores, key=all_scores.get)
                confidence = all_scores[dominant_emotion]

                emotion_result = {
                    "emotion": dominant_emotion,
                    "confidence": round(confidence, 3),
                    "all_scores": {k: round(v, 3) for k, v in all_scores.items()},
                    "sentiment_score": EMOTION_SENTIMENT_MAP.get(dominant_emotion, 0.5),
                    "urgency": EMOTION_URGENCY_MAP.get(dominant_emotion, "low"),
                }

                logger.info(f"MERaLiON SER: Detected emotion (confidence={confidence:.2f})")
                return emotion_result

            logger.warning(f"MERaLiON SER: Unexpected response format: {json.dumps(result)[:200]}")
            return None

        except requests.exceptions.Timeout:
            logger.warning("MERaLiON SER: Request timed out (30s)")
            return None
        except requests.exceptions.RequestException as e:
            logger.warning(f"MERaLiON SER: Request failed: {e}")
            return None
        except (KeyError, ValueError, json.JSONDecodeError) as e:
            logger.warning(f"MERaLiON SER: Parse error: {e}")
            return None

    def get_backend_info(self):
        """Returns MERaLiON backend status -- useful for debugging and demo."""
        if self.available:
            return {
                "backend": "huggingface_inference_api",
                "asr_model": MERALION_ASR_MODEL,
                "ser_model": MERALION_SER_MODEL,
                "status": "active",
                "provider": "A*STAR",
            }
        else:
            return {
                "backend": "unavailable",
                "asr_model": MERALION_ASR_MODEL,
                "ser_model": MERALION_SER_MODEL,
                "status": "inactive",
                "reason": "HUGGINGFACE_TOKEN not set" if REQUESTS_AVAILABLE else "requests library missing",
                "provider": "A*STAR",
            }


if __name__ == "__main__":
    ml = MeralionInterface()
    print(f"MERaLiON Backend: {json.dumps(ml.get_backend_info(), indent=2)}")

    import sys
    if len(sys.argv) > 1:
        audio_path = sys.argv[1]
        with open(audio_path, "rb") as f:
            audio_data = f.read()

        print(f"Testing with: {audio_path} ({len(audio_data)} bytes)")

        print("--- ASR (Speech-to-Text) ---")
        transcript = ml.transcribe_speech(audio_data)
        print(f"Transcript: {transcript}")

        print("--- SER (Emotion Detection) ---")
        emotion = ml.detect_speech_emotion(audio_data)
        if emotion:
            print(f"Emotion: {emotion}")
        else:
            print("(unavailable)")
