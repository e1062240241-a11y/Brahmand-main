import requests

urls = [
    "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.appspot.com/o/posts%2F29PXIs7epVdwrnN7eFeS%2F5771e07bfe954f6a89265cb224b35c52.jpg?alt=media&token=e937517c-658f-43b9-a417-be24c7f077ed",
    "https://firebasestorage.googleapis.com/v0/b/sanatan-lok.firebasestorage.app/o/posts%2F29PXIs7epVdwrnN7eFeS%2F5771e07bfe954f6a89265cb224b35c52.jpg?alt=media&token=e937517c-658f-43b9-a417-be24c7f077ed"
]

for url in urls:
    try:
        r = requests.head(url, timeout=5)
        print(f"URL: {url[:80]}...")
        print(f"Status: {r.status_code}")
    except Exception as e:
        print(f"Error for {url[:50]}: {e}")
