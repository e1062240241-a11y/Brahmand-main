import random
from locust import HttpUser, task, between

# List of predefined anonymous numbers from the backend configuration (.env)
ANONYMOUS_PHONES = [
    "+911234567891",
    "+911234567892",
    "+911234567893",
    "+911234567894",
    "+911234567895",
    "+911234567896",
    "+911234567897",
    "+911234567898",
    "+911234567899"
]

class SanatanLokUser(HttpUser):
    # Simulated think time between tasks (1 to 2 seconds)
    wait_time = between(1, 2)

    def on_start(self):
        """Called when a user starts. We perform anonymous login to get a JWT token."""
        self.auth_headers = {}
        phone = random.choice(ANONYMOUS_PHONES)
        payload = {
            "phone": phone,
            "name": f"LocustUser_{random.randint(1000, 9999)}",
            "language": "English"
        }

        with self.client.post("/api/auth/login-anonymous", json=payload, catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                token = data.get("token")
                if token:
                    self.auth_headers = {"Authorization": f"Bearer {token}"}
                    response.success()
                else:
                    response.failure("Token not found in response")
            else:
                response.failure(f"Login failed with status {response.status_code}")

    @task(5)
    def read_gita_chapter(self):
        """Simulate reading a specific chapter of Bhagavad Gita (Public)."""
        chapter = random.randint(1, 18)
        self.client.get(f"/api/library/bhagavad-gita/chapter/{chapter}", name="/api/library/bhagavad-gita/chapter/[num]")

    @task(2)
    def read_gita_all_summary(self):
        """Simulate reading summary of all chapters (Public)."""
        self.client.get("/api/library/bhagavad-gita/all?summary=true", name="/api/library/bhagavad-gita/all?summary=true")

    @task(3)
    def list_temples(self):
        """Simulate listing all temples (Optional Auth)."""
        self.client.get("/api/temples", headers=self.auth_headers, name="/api/temples")

    @task(3)
    def list_nearby_temples(self):
        """Simulate getting nearby temples (Optional Auth)."""
        self.client.get("/api/temples/nearby?lat=19.0760&lng=72.8777", headers=self.auth_headers, name="/api/temples/nearby")

    @task(4)
    def get_user_profile(self):
        """Simulate viewing own profile page (Authenticated)."""
        if self.auth_headers:
            self.client.get("/api/user/profile", headers=self.auth_headers, name="/api/user/profile")
