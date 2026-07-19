import random
from locust import HttpUser, task, between


class LibraryCDNUser(HttpUser):
    # Short wait time between requests to simulate heavy read traffic
    wait_time = between(0.5, 2)

    @task(5)
    def fetch_bhagavad_gita(self):
        # Chapters 1-18
        chapter = random.randint(1, 18)
        self.client.get(
            f"/library/bhagavad-gita/chapter-{chapter}.json",
            name="Library CDN - Bhagavad Gita"
        )

    @task(3)
    def fetch_rigveda(self):
        # Mandalas usually 1-10 (assuming chapter format maps to 1-10)
        chapter = random.randint(1, 10)
        self.client.get(
            f"/library/rigveda/chapter-{chapter}.json",
            name="Library CDN - Rigveda"
        )

    @task(3)
    def fetch_ramayan(self):
        # 7 Kandas
        chapter = random.randint(1, 7)
        self.client.get(
            f"/library/ramayan/chapter-{chapter}.json",
            name="Library CDN - Ramayan"
        )

    @task(1)
    def fetch_mahabharata(self):
        # 18 Parvas
        chapter = random.randint(1, 18)
        self.client.get(
            f"/library/mahabharata/chapter-{chapter}.json",
            name="Library CDN - Mahabharata"
        )
