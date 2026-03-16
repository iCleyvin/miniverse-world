#!/bin/sh
# Start miniverse server in background
cd /app && node node_modules/.bin/miniverse --no-browser --port 4321 &
# Wait for server to be ready
sleep 3
# Start nginx in foreground
nginx -g 'daemon off;'
