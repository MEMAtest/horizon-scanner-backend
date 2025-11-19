#!/bin/bash

echo "=========================================="
echo "DNS Monitoring for regcanary.com"
echo "Target IP: 216.198.79.1"
echo "Started at: $(date)"
echo "=========================================="
echo ""

for i in {1..15}; do
  current_ip=$(dig +short regcanary.com A)
  ttl=$(dig regcanary.com A | grep "regcanary.com" | head -1 | awk '{print $2}')
  timestamp=$(date +"%H:%M:%S")

  echo "[$timestamp] Check #$i: IP=$current_ip | TTL=${ttl}s"

  if [ "$current_ip" = "216.198.79.1" ]; then
    echo ""
    echo "🎉 SUCCESS! DNS has propagated!"
    echo "regcanary.com now points to: 216.198.79.1"
    echo "Time: $(date)"
    echo ""
    echo "Next steps:"
    echo "1. Click 'Refresh' in Vercel dashboard"
    echo "2. Visit https://regcanary.com"
    echo "3. Check that SSL certificate is active"
    exit 0
  fi

  if [ $i -lt 15 ]; then
    sleep 30
  fi
done

echo ""
echo "Monitoring complete. Final status:"
dig regcanary.com A | grep -A 2 "ANSWER SECTION"
