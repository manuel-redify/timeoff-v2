#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

SUBDOMAIN=${SERVEO_SUBDOMAIN:-"timeoff-v2-dev"}
PORT=3000

# Detect if we are in WSL and get the host IP
if grep -qi "microsoft" /proc/version 2>/dev/null; then
    # Try to get Windows host IP via route
    TARGET_HOST=$(ip route show default | awk '{print $3}' | head -n1)
    if [ -z "$TARGET_HOST" ]; then
        # Fallback to resolv.conf
        TARGET_HOST=$(grep nameserver /etc/resolv.conf | awk '{print $2}' | head -n1)
    fi
    echo "WSL detected. Windows Host IP: $TARGET_HOST"
else
    TARGET_HOST="127.0.0.1"
    echo "Standard environment detected. Using $TARGET_HOST"
fi

echo "Tunneling https://$SUBDOMAIN.serveo.net to http://$TARGET_HOST:$PORT"

# Run SSH tunnel
ssh -o ExitOnForwardFailure=yes -o ServerAliveInterval=60 -R "$SUBDOMAIN:80:$TARGET_HOST:$PORT" serveo.net
