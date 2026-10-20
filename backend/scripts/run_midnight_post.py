#!/usr/bin/env python3
"""
Midnight Runner: Waits until 00:01 IST (14 Oct 2026) and then executes post_kushmanda.py.
"""
import time
import subprocess
import logging
from datetime import datetime
from pathlib import Path
import zoneinfo

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("midnight_runner")

IST = zoneinfo.ZoneInfo("Asia/Kolkata")
TARGET_YEAR = 2026
TARGET_MONTH = 10
TARGET_DAY = 14
TARGET_HOUR = 0
TARGET_MINUTE = 1

def main():
    target_dt = datetime(TARGET_YEAR, TARGET_MONTH, TARGET_DAY, TARGET_HOUR, TARGET_MINUTE, 0, tzinfo=IST)
    now = datetime.now(IST)
    logger.info(f"Runner started. Current IST: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Target scheduled time: {target_dt.strftime('%Y-%m-%d %H:%M:%S')}")

    diff = (target_dt - now).total_seconds()
    if diff <= 0:
        logger.info("Target time already reached or passed! Executing publish immediately...")
    else:
        logger.info(f"Waiting {diff:.1f} seconds (~{diff/3600:.2f} hours) until target time...")
        # Sleep in chunks of up to 60 seconds so log can show progress or system time drift is handled
        while True:
            remaining = (target_dt - datetime.now(IST)).total_seconds()
            if remaining <= 0:
                break
            sleep_time = min(remaining, 60.0)
            time.sleep(sleep_time)

    logger.info("Target reached! Executing post_kushmanda.py now...")
    backend_dir = Path(__file__).resolve().parent.parent
    python_bin = backend_dir / ".venv" / "bin" / "python"
    script_path = backend_dir / "scripts" / "post_kushmanda.py"

    res = subprocess.run([str(python_bin), str(script_path)], cwd=str(backend_dir))
    if res.returncode == 0:
        logger.info("Post published successfully!")
    else:
        logger.error(f"Post failed with return code {res.returncode}")

if __name__ == "__main__":
    main()
