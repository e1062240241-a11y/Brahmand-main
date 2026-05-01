Realtime TURN Setup

The Jaap live audio room uses WebRTC. STUN is enough on open networks, but production deployments should configure TURN so calls still connect behind strict NATs, corporate Wi-Fi, and carrier networks.

Backend environment variables:

```bash
STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
TURN_URLS=turn:turn.example.com:3478?transport=udp,turn:turn.example.com:3478?transport=tcp,turns:turn.example.com:5349?transport=tcp
```

Preferred production mode with coturn REST credentials:

```bash
TURN_SHARED_SECRET=your_coturn_static_auth_secret
TURN_TTL_SECONDS=3600
```

Static credential fallback:

```bash
TURN_USERNAME=your_turn_username
TURN_CREDENTIAL=your_turn_password
```

The app fetches `/api/realtime/ice-servers` after login. When `TURN_SHARED_SECRET` is set, the backend returns short-lived HMAC credentials in the format expected by coturn `use-auth-secret`.

Recommended coturn settings are also available in `backend/coturn.conf.example`:

```text
listening-port=3478
tls-listening-port=5349
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=your_coturn_static_auth_secret
realm=brahmand.app
total-quota=1000
bps-capacity=0
stale-nonce=600
no-multicast-peers
no-loopback-peers
```

Also open UDP/TCP `3478`, TCP `5349`, and your TURN relay port range on the TURN host firewall.
