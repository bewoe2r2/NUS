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
    def __init__(self, db_path=_DEFAULT_DB):
        self.db_path = db_path
        self.WEEKLY_START = 5.00  # Start with $5
        
    def get_current_voucher(self, user_id='demo_user'): # Default to demo_user
        """Get this week's voucher status"""
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
            # Check if table exists (handled by schema, but ensure row exists)
            conn.execute("""
                INSERT INTO voucher_tracker (user_id, week_start_utc, current_value, penalties_json)
                VALUES (?, ?, ?, ?)
            """, (user_id, week_start_ts, self.WEEKLY_START, "[]"))
            conn.commit()
            value = self.WEEKLY_START
            penalties = "[]"
        
        conn.close()
        
        # Days until Sunday
        days_until_sunday = 6 - now.weekday()
        
        return {
            'current_value': value,
            'week_start': week_start,
            'days_until_redemption': days_until_sunday,
            'can_redeem': now.weekday() == 6,  # Sunday
            'penalties': penalties
        }
    
    def apply_penalty(self, user_id, reason, amount):
        """Deduct money for missed actions"""
        voucher = self.get_current_voucher(user_id)
        current_val = voucher['current_value']
        
        if current_val <= 0:
            return 0.0
            
        new_value = max(0.0, current_val - amount)
        
        # Update DB
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            UPDATE voucher_tracker
            SET current_value = ?
            WHERE user_id = ? AND week_start_utc = ?
        """, (new_value, user_id, int(voucher['week_start'].timestamp())))
        conn.commit()
        conn.close()
        
        return new_value
    
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
