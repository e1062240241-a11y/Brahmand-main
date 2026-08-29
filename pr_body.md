💡 What: Replaced sequential database fetches for sender and recipient in `send_direct_message` with concurrent fetches using `asyncio.gather`.
🎯 Why: Two independent database calls (`db.get_document` and `db.get_user_by_sl_id`) were executed sequentially, causing unnecessary IO bottlenecks.
📊 Impact: Halves the network latency for the initial validation stage of sending direct messages.
🔬 Measurement: Verify using an APM/profiler tracing the execution time of `send_direct_message`.
