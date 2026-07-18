# FastAPI Locust Load Testing Suite

This directory contains a load testing suite for the FastAPI backend using [Locust](https://locust.io/).

## Requirements

Ensure you have `locust` installed. You can install it via pip:

```bash
pip install locust
```

## Running the Tests

A helper script `run_load_test.sh` is provided to easily run the load tests locally or in headless mode.

### Basic Usage

To run the load test with default settings (headless mode, 500 users, 2 minutes):

```bash
./run_load_test.sh
```

### Options

```bash
Usage: ./run_load_test.sh [options]
Options:
  --host <url>         Target host URL (default: https://brahmand-backend-hi4rz6fdrq-uc.a.run.app/api)
  --users <num>        Peak number of concurrent users (default: 500)
  --spawn-rate <num>   Rate to spawn users at (users per second) (default: 50)
  --duration <time>    Stop after the specified amount of time (default: 2m)
  --phone <phone>      Test phone number (default: +911234567890)
  --otp <otp>          Test OTP (default: 123456)
  --ui                 Run in UI mode instead of headless mode
```

### UI Mode

If you prefer to configure the test and view results in the Locust Web UI, run:

```bash
./run_load_test.sh --ui
```

Then open `http://localhost:8089` in your web browser.

## Scaling to 100,000 Users

Simulating 100,000 (1 Lakh) concurrent users from a single machine is not possible due to OS-level socket limitations and hardware constraints. To achieve this scale, you need to use Locust in **Distributed Mode** across multiple worker machines.

1. **Start the Master Node:**
   ```bash
   locust -f locustfile.py --master --host https://brahmand-backend-hi4rz6fdrq-uc.a.run.app/api
   ```

2. **Start Worker Nodes (on multiple machines/containers):**
   ```bash
   locust -f locustfile.py --worker --master-host=<master_ip_address>
   ```

For 100,000 users, you will likely need tens or hundreds of worker nodes depending on the CPU/RAM of each worker.
