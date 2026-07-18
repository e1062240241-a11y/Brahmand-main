#!/bin/bash

# Default values
HOST="https://brahmand-backend-hi4rz6fdrq-uc.a.run.app/api"
USERS=500
SPAWN_RATE=50
DURATION="2m"
PHONE="+911234567890"
OTP="123456"
HEADLESS=true

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --host) HOST="$2"; shift ;;
        --users) USERS="$2"; shift ;;
        --spawn-rate) SPAWN_RATE="$2"; shift ;;
        --duration) DURATION="$2"; shift ;;
        --phone) PHONE="$2"; shift ;;
        --otp) OTP="$2"; shift ;;
        --ui) HEADLESS=false ;;
        -h|--help)
            echo "Usage: ./run_load_test.sh [options]"
            echo "Options:"
            echo "  --host <url>         Target host URL (default: https://brahmand-backend-hi4rz6fdrq-uc.a.run.app/api)"
            echo "  --users <num>        Peak number of concurrent users (default: 500)"
            echo "  --spawn-rate <num>   Rate to spawn users at (users per second) (default: 50)"
            echo "  --duration <time>    Stop after the specified amount of time, e.g. (300s, 20m, 3h, 1h30m, etc.) (default: 2m)"
            echo "  --phone <phone>      Test phone number (default: +911234567890)"
            echo "  --otp <otp>          Test OTP (default: 123456)"
            echo "  --ui                 Run in UI mode instead of headless mode"
            return 0
            ;;
        *) echo "Unknown parameter passed: $1"; return 1 ;;
    esac
    shift
done

echo "Starting Locust Load Test..."
echo "Target: $HOST"
echo "Users: $USERS"
echo "Spawn Rate: $SPAWN_RATE"
echo "Duration: $DURATION"
echo "Test Phone: $PHONE"
echo "Mode: $(if [ "$HEADLESS" = true ]; then echo "Headless"; else echo "UI"; fi)"
echo "----------------------------------------"

# Set environment variables for the locustfile
export TEST_PHONE_NUMBER="$PHONE"
export TEST_OTP="$OTP"

if [ "$HEADLESS" = true ]; then
    locust -f locustfile.py --headless -u "$USERS" -r "$SPAWN_RATE" --run-time "$DURATION" --host "$HOST"
else
    echo "Starting Locust UI... Access it at http://localhost:8089"
    locust -f locustfile.py --host "$HOST"
fi
