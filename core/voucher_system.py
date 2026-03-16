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
from datetime import datetime, timedelta
import io
import qrcode
import base64
import json

import os as _os
_DEFAULT_DB = _os.path.join(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))), "database", "nexus_health.db")

class VoucherSystem:
    def __init__(self, db_path=_DEFAULT_DB, user_id='demo_user'):
        self.db_path = db_path
        self.user_id = user_id
        self.WEEKLY_START = 5.00  # Start with $5

    def get_current_voucher(self, user_id=None):
        """Get this week's voucher status"""
        user_id = user_id or self.user_id
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            # Get week start (Monday)
            now = datetime.now()
            days_since_monday = now.weekday()
            week_start = now - timedelta(days=days_since_monday)
            # Normalize to start of day
            week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start_ts = int(week_start.timestamp())

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
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute("""
                UPDATE voucher_tracker
                SET current_value = ?, penalties_json = ?
                WHERE user_id = ? AND week_start_utc = ?
            """, (new_value, penalties_json, user_id, week_start_ts))
            conn.commit()
        finally:
            conn.close()

        return new_value
    
    def check_and_apply_daily_penalties(self):
        """Check for missed actions today and apply penalties (lazy evaluation)."""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
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
            med_count = conn.execute(
                "SELECT COUNT(*) FROM medication_logs WHERE user_id = ? AND taken_timestamp_utc > ?",
                (self.user_id, today_start)
            ).fetchone()[0]

            if med_count == 0 and "Missed medication today" not in already_penalized:
                self.apply_penalty(1.0, "Missed medication today")

            # Check glucose logging
            glucose_count = conn.execute(
                "SELECT COUNT(*) FROM glucose_readings WHERE user_id = ? AND reading_timestamp_utc > ?",
                (self.user_id, today_start)
            ).fetchone()[0]

            if glucose_count == 0 and "No glucose reading today" not in already_penalized:
                self.apply_penalty(0.5, "No glucose reading today")

        except Exception as e:
            print(f"[Voucher] Penalty check error: {e}")
        finally:
            if conn:
                conn.close()

    def generate_qr_code(self, amount):
        """Generate QR code for redemption"""
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
