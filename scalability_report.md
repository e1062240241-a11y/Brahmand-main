# Sanatan Lok App - Scalability Assessment (Target: 50k to 100k Users)

Based on the analysis of your cloud configuration and backend architecture, here is a detailed assessment of the system's ability to handle 50,000 to 1,00,000 concurrent users smoothly, specifically focusing on private messaging and the post feed.

## 1. Cloud Run Configuration (The "What")
- **Current Setup:** 2 vCPU, 4GB RAM, 4 Uvicorn workers per instance.
- **Concurrency Limit:** The deployment scripts (`deploy-gcp-full.sh` and `deploy-backend.sh`) omit the `--concurrency` flag. Cloud Run defaults this to **80 concurrent requests per instance**.
- **Autoscaling:** When user requests exceed the concurrency limit of a single instance, Google Cloud Run will automatically spin up additional container instances (horizontal scaling).

## 2. Real-Time Messaging & Socket.IO (Critical Blocker)
### 🚨 The Problem: Multi-Instance State Loss
You are using `python-socketio` to power a low-latency 0ms private messaging system (`handle_send_dm_socket`). However, the current code initializes a single, in-memory Socket.IO server per instance.
- If User A connects to **Instance 1** and User B connects to **Instance 2** (which happens naturally as Cloud Run scales out to handle 50k users), they **cannot send direct messages to each other**.
- Instance 1 does not know User B is connected to Instance 2. The `sio.emit(..., room=f"user_{user_id}")` will silently fail because the socket connection doesn't exist in Instance 1's memory space.

### 💡 The Solution: Redis/PubSub Adapter
To support 100k users seamlessly across multiple auto-scaling Cloud Run instances, you **must** implement a message broker.
- **Action:** Add `redis` to your backend requirements and configure the `socketio.AsyncRedisManager` (or `socketio.AsyncPubSubManager` if using Google Cloud Pub/Sub) when initializing your `socketio.AsyncServer`. This acts as a central hub so all Cloud Run instances share the same Socket.IO room states.
- **Cost Note:** As noted in your `AGENTS.md` / Memory, Redis is generally avoided for cost. However, for real-time WebSocket scaling at this magnitude, a managed Redis instance (like Google Cloud Memorystore or Upstash) is an absolute architectural requirement.

## 3. Feed Generation (Performance & Database Bottleneck)
### 🚨 The Problem: N+1 Firestore Query Scaling Trap
The `get_posts_feed` function in `backend/main.py` is well-structured for discovery (mixing random, recent, and engagement), but the subsequent hydration loop is a ticking time bomb.
- For every post returned in the feed loop (up to 50), the `fetch_post_details` function fires a separate query: `await db.query_documents('post_comments', filters=[('post_id', '==', post.get('id'))], limit=200)`.
- If a user fetches a feed of 50 posts, that single API call results in **50 separate database queries** just to grab the top 5 comments per post.
- At 50,000 concurrent users refreshing their feeds, this will result in **2.5 million read operations per second** to Firestore. This will instantly trigger Google Cloud's Quota Limits, crash the database response times, and result in 504 Timeouts.

### 💡 The Solution: Denormalization
Firestore is a NoSQL database, so it should be optimized for reads.
- **Action:** Stop querying the `post_comments` collection on the fly during feed generation. Instead, store the `top_5_comments` as a raw array directly inside the `posts` document itself.
- When a user adds a comment, append it to the main `post` document (using `firestore.ArrayUnion`). The feed API should just return the `post` document, which already contains the comments.

## 4. Google Cloud Platform (GCP) Quotas
To handle 1 Lakh (100,000) users simultaneously:
- **Cloud Run Max Instances:** You must manually increase the quota for Cloud Run "Max Instances". The default is usually 1,000. For 100k WebSockets, you'll need a much higher limit (and you should explicitly configure `--max-instances` in your deploy script).
- **Firestore Connections:** Firestore supports a maximum of 1,000,000 concurrent connections, so the database itself can handle it—but only if you fix the N+1 read amplification issue mentioned above.

## Summary Conclusion
Can the current architecture handle 50k - 100k users? **No, it will crash or fail silently.**
1. Real-time chat will break as soon as Cloud Run scales to 2+ instances.
2. The feed endpoint will bankrupt your Firestore quota and time out due to N+1 querying.

Once a Redis adapter is added for Socket.IO and the post comments are denormalized in Firestore, the Google Cloud Run autoscaling mechanism will easily and smoothly handle 1,00,000 concurrent users.
