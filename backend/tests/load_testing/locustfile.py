import os
import logging
from locust import HttpUser, task, between, events


class FastAPIUser(HttpUser):
    # Wait between 1 and 5 seconds between tasks to simulate realistic behavior
    wait_time = between(1, 5)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.token = None
        self.phone = os.environ.get("TEST_PHONE_NUMBER", "+919999001111")
        self.otp = os.environ.get("TEST_OTP", "123456")

    def on_start(self):
        """Called when a user starts. Authenticate and get the JWT token."""
        # 1. Request OTP
        self.client.post("/auth/send-otp", json={
            "phone": self.phone,
            "purpose": "login"
        }, name="Login - Send OTP")

        # 2. Verify OTP and get Token
        response_verify = self.client.post("/auth/verify-otp", json={
            "phone": self.phone,
            "otp": self.otp
        }, name="Login - Verify OTP")

        if response_verify.status_code == 200:
            data = response_verify.json()
            # If the user is new, register them to get a token
            if data.get("is_new_user"):
                response_register = self.client.post("/auth/register", json={
                    "phone": self.phone,
                    "name": "Load Tester",
                    "language": "English"
                }, name="Login - Register User")

                if response_register.status_code == 200:
                    data = response_register.json()
                else:
                    logging.error(f"Register error: {response_register.text}")
                    return

            self.token = data.get("token")
            if self.token:
                # Set authorization header for all subsequent requests
                self.client.headers.update(
                    {"Authorization": f"Bearer {self.token}"}
                )
            else:
                logging.error(f"Login successful but no token found: {data}")
        else:
            logging.error(
                f"Login failed: {response_verify.status_code} "
                f"{response_verify.text}"
            )

    @task(4)
    def view_feed(self):
        """Simulate a user viewing their post feed."""
        self.client.get("/posts/feed", name="View Feed")

    @task(2)
    def view_profile(self):
        """Simulate a user viewing their own profile."""
        self.client.get("/user/profile", name="View Profile")

    @task(2)
    def check_notifications(self):
        """Simulate a user checking notifications."""
        self.client.get("/notifications", name="Check Notifications")

    @task(1)
    def discover_communities(self):
        """Simulate a user exploring communities."""
        self.client.get("/communities/discover", name="Discover Communities")

    @task(1)
    def get_my_communities(self):
        self.client.get("/communities", name="Get My Communities")

    @task(1)
    def check_unread_notifications(self):
        self.client.get(
            "/notifications/unread-count",
            name="Check Unread Notifications"
        )


@events.init_command_line_parser.add_listener
def _(parser):
    parser.add_argument(
        "--test-phone",
        type=str,
        env_var="TEST_PHONE_NUMBER",
        default="+919999001111",
        help="Phone number to use for test login"
    )
    parser.add_argument(
        "--test-otp",
        type=str,
        env_var="TEST_OTP",
        default="123456",
        help="OTP to use for test login"
    )
