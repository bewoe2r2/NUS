"""
Bewo 2026 - Loss Aversion Voucher System
file: voucher_system.py
author: Lead Architect
version: 1.0.0

Implements the "Loss Aversion" gamification logic:
- Users start with $5.00/week
- Money is lost for missing key health actions
- Balance can be redeemed via QR code on Sundays
"""

import sqlite3
import time
import logging
from datetime import datetime, timedelta
import io
try:
    import qrcode
    QRCODE_AVAILABLE = True
except ImportError:
    QRCODE_AVAILABLE = False
import base64
import json

import os as _os
_DEFAULT_DB = _os.path.join(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))), "database", "nexus_health.db")

class VoucherSystem:
    def __init__(self, db_path=_DEFAULT_DB, user_id='demo_user'):
        self.db_path = db_path
        self.user_id = user_id
        self.WEEKLY_START = 5.00  # Start with $5

    def _get_db(self):
        """Get database connection with WAL mode, foreign keys, and row_factory."""
        conn = sqlite3.connect(self.db_path, timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA busy_timeout=5000")
        return conn

    def get_current_voucher(self, user_id=None):
        """Get this week's voucher status"""
        user_id = user_id or self.user_id
        # Compute datetime values outside try block so they're always available
        now = datetime.now()
        days_since_monday = now.weekday()
        week_start = now - timedelta(days=days_since_monday)
        # Normalize to start of day
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start_ts = int(week_start.timestamp())
        conn = None
        try:
            conn = self._get_db()

            # Check if voucher exists for this week
            row = conn.execute("""
                SELECT current_value, penalties_json
                FROM voucher_tracker
                WHERE user_id = ? AND week_start_utc >= ?
                ORDER BY week_start_utc DESC LIMIT 1
            """, (user_id, week_start_ts)).fetchone()

            if row:
                value, penalties = row
            else:
                # Create new week's voucher
                conn.execute("""
                    INSERT INTO voucher_tracker (user_id, week_start_utc, current_value, penalties_json)
                    VALUES (?, ?, ?, ?)
                """, (user_id, week_start_ts, self.WEEKLY_START, "[]"))
                conn.commit()
                value = self.WEEKLY_START
                penalties = "[]"
        except Exception as e:
            logging.getLogger(__name__).warning(f"Voucher lookup error: {e}")
            value = self.WEEKLY_START
            penalties = "[]"
        finally:
            if conn:
                conn.close()

        # Days until Sunday
        days_until_sunday = 6 - now.weekday()
        
        return {
            'current_value': value,
            'week_start': week_start.isoformat(),
            'week_start_ts': week_start_ts,
            'days_until_redemption': days_until_sunday,
            'can_redeem': now.weekday() == 6,  # Sunday
            'penalties': json.loads(penalties) if isinstance(penalties, str) else penalties
        }
    
    def apply_penalty(self, amount, reason, user_id=None):
        """Deduct money for missed actions"""
        user_id = user_id or self.user_id
        voucher = self.get_current_voucher(user_id)
        current_val = voucher['current_value']

        if current_val <= 0:
            return 0.0

        new_value = max(0.0, current_val - amount)
        week_start_ts = voucher['week_start_ts']

        # Append penalty to penalties log
        existing_penalties = voucher['penalties'] if isinstance(voucher['penalties'], list) else []
        existing_penalties.append({
            'reason': reason,
            'amount': amount,
            'timestamp': int(time.time())
        })
        penalties_json = json.dumps(existing_penalties)

        # Update DB
        conn = None
        try:
            conn = self._get_db()
            conn.execute("""
                UPDATE voucher_tracker
                SET current_value = ?, penalties_json = ?
                WHERE user_id = ? AND week_start_utc = ?
            """, (new_value, penalties_json, user_id, week_start_ts))
            conn.commit()
        except Exception as e:
            logging.getLogger(__name__).warning(f"Penalty update error: {e}")
        finally:
            if conn:
                conn.close()

        return new_value
    
    def check_and_apply_daily_penalties(self):
        """Check for missed actions today and apply penalties (lazy evaluation)."""
        conn = None
        try:
            conn = self._get_db()
            now = int(time.time())
            today_start = now - ((now + 28800) % 86400)  # SGT midnight
            sgt_hour = ((now + 28800) % 86400) // 3600

            if sgt_hour < 21:
                return  # Too early to penalize

            # Check if penalty already applied today to avoid duplicates
            voucher = self.get_current_voucher()
            penalties = voucher.get('penalties', [])
            today_penalties = [p for p in penalties if p.get('timestamp', 0) > today_start]
            already_penalized = {p.get('reason') for p in today_penalties}

            # Check medication adherence today
            med_row = conn.execute(
                "SELECT COUNT(*) FROM medication_logs WHERE user_id = ? AND taken_timestamp_utc > ?",
                (self.user_id, today_start)
            ).fetchone()
            med_count = med_row[0] if med_row else 0

            if med_count == 0 and "Missed medication today" not in already_penalized:
                self.apply_penalty(1.0, "Missed medication today")

            # Check glucose logging
            glucose_row = conn.execute(
                "SELECT COUNT(*) FROM glucose_readings WHERE user_id = ? AND reading_timestamp_utc > ?",
                (self.user_id, today_start)
            ).fetchone()
            glucose_count = glucose_row[0] if glucose_row else 0

            if glucose_count == 0 and "No glucose reading today" not in already_penalized:
                self.apply_penalty(0.5, "No glucose reading today")

        except Exception as e:
            logging.getLogger(__name__).warning(f"Penalty check error: {e}")
        finally:
            if conn:
                conn.close()

    def get_voucher_narrative(self, user_id=None, patient_name=None):
        """
        Build a human-readable loss narrative for the current week.
        Returns a string that makes the loss FELT, not just displayed.
        E.g. "Mr. Tan started this week with $5.00. Lost $1.00 for missing
        medication Monday. Current balance: $3.50."
        """
        user_id = user_id or self.user_id
        voucher = self.get_current_voucher(user_id)
        value = voucher['current_value']
        penalties = voucher.get('penalties', [])
        name = patient_name or "You"

        if not penalties:
            return f"{name} started this week with ${self.WEEKLY_START:.2f} and haven't lost anything yet. Keep it up!"

        total_lost = sum(p.get('amount', 0) for p in penalties)
        perfect_value = self.WEEKLY_START
        days_left = voucher.get('days_until_redemption', 0)

        # Build penalty breakdown lines
        lines = []
        for p in penalties:
            reason = p.get('reason', 'Missed action')
            amt = p.get('amount', 0)
            ts = p.get('timestamp', 0)
            if ts:
                day_name = datetime.fromtimestamp(ts).strftime('%A')
                lines.append(f"Lost ${amt:.2f} — {reason} ({day_name})")
            else:
                lines.append(f"Lost ${amt:.2f} — {reason}")

        breakdown = ". ".join(lines)

        # Project end-of-week loss if current rate continues
        days_since_monday = datetime.now().weekday()
        if days_since_monday > 0:
            daily_loss_rate = total_lost / days_since_monday
            projected_additional = daily_loss_rate * days_left
            projected_final = max(0, value - projected_additional)
            projection = f"At this rate, you'll redeem ${projected_final:.2f} — that's ${perfect_value - projected_final:.2f} less than perfect adherence."
        else:
            projection = ""

        narrative = f"{name} started this week with ${self.WEEKLY_START:.2f}. {breakdown}. Current balance: ${value:.2f}."
        if projection:
            narrative += f" {projection}"

        return narrative

    def generate_qr_code(self, amount):
        """Generate QR code for redemption"""
        if not QRCODE_AVAILABLE:
            return None
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(f"BEWO_VOUCHER:${amount:.2f}")
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        return base64.b64encode(buf.getvalue()).decode()

if __name__ == "__main__":
    vs = VoucherSystem()
    v = vs.get_current_voucher()
    print(f"Current Voucher: ${v['current_value']}")
