"""
Groq Rate Limiter Utility.

Enforces free-tier rate limits for Groq API calls:
- 30 Requests Per Minute (RPM)
- 30,000 Tokens Per Minute (TPM)
- 14,400 Requests Per Day (RPD)
"""

import asyncio
import logging
import time
from collections import deque

logger = logging.getLogger(__name__)


class GroqRateLimiter:
    """
    In-memory rate limiter using sliding time windows for RPM, TPM, and RPD.
    """

    def __init__(
        self,
        max_rpm: int = 30,
        max_tpm: int = 30000,
        max_rpd: int = 14400,
    ):
        self.max_rpm = max_rpm
        self.max_tpm = max_tpm
        self.max_rpd = max_rpd

        self.minute_requests = deque()  # timestamps (float) within last 60s
        self.minute_tokens = deque()    # tuples of (timestamp, token_count) within last 60s
        self.day_requests = deque()     # timestamps (float) within last 86400s

        self._lock = asyncio.Lock()

    def _clean_old_records(self, now: float):
        # 60s window
        while self.minute_requests and (now - self.minute_requests[0] > 60.0):
            self.minute_requests.popleft()

        while self.minute_tokens and (now - self.minute_tokens[0][0] > 60.0):
            self.minute_tokens.popleft()

        # 86400s (24h) window
        while self.day_requests and (now - self.day_requests[0] > 86400.0):
            self.day_requests.popleft()

    async def acquire(self, estimated_tokens: int = 500, timeout: float = 30.0) -> bool:
        """
        Wait if necessary until capacity is available under RPM, TPM, and RPD limits.
        Returns True if acquired, False if timeout reached.
        """
        start_wait = time.time()
        while True:
            async with self._lock:
                now = time.time()
                self._clean_old_records(now)

                current_rpm = len(self.minute_requests)
                current_tpm = sum(t_count for _, t_count in self.minute_tokens)
                current_rpd = len(self.day_requests)

                if (
                    current_rpm < self.max_rpm
                    and (current_tpm + estimated_tokens) <= self.max_tpm
                    and current_rpd < self.max_rpd
                ):
                    # Record request
                    self.minute_requests.append(now)
                    self.minute_tokens.append((now, estimated_tokens))
                    self.day_requests.append(now)
                    return True

                # Determine sleep delay needed
                if current_rpm >= self.max_rpm and self.minute_requests:
                    sleep_needed = 60.0 - (now - self.minute_requests[0]) + 0.1
                elif (current_tpm + estimated_tokens) > self.max_tpm and self.minute_tokens:
                    sleep_needed = 60.0 - (now - self.minute_tokens[0][0]) + 0.1
                elif current_rpd >= self.max_rpd and self.day_requests:
                    sleep_needed = 86400.0 - (now - self.day_requests[0]) + 1.0
                else:
                    sleep_needed = 1.0

            if time.time() - start_wait + sleep_needed > timeout:
                logger.warning(
                    "[GroqLimiter] Timed out waiting for rate limit capacity. "
                    "RPM: %d/%d, TPM: %d/%d, RPD: %d/%d",
                    current_rpm, self.max_rpm, current_tpm, self.max_tpm, current_rpd, self.max_rpd
                )
                return False

            await asyncio.sleep(min(sleep_needed, 2.0))


# Global singleton instance for Groq API calls across backend
groq_rate_limiter = GroqRateLimiter()
