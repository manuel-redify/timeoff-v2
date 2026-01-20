#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

SUBDOMAIN=${SERVEO_SUBDOMAIN:-"timeoff-v2-dev"}
PORT=3000

echo "Starting Serveo tunnel: https://$SUBDOMAIN.serveo.net -> http://localhost:$PORT"
echo "Note: If this is your first time, you might need to confirm the SSH fingerprint."

# Run SSH tunnel
# -R: remote port forwarding
# $SUBDOMAIN:80:localhost:$PORT: map sub.serveo.net:80 to local:3000
# serveo.net: host
ssh -o ExitOnForwardFailure=yes -R $SUBDOMAIN:80:localhost:$PORT serveo.net
