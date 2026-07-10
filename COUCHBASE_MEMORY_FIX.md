# Couchbase Memory Configuration Fix

## Issue
Warning: "approaching low index resident percentage. Indexer RAM percentage on node is 0%, which is under the threshold of 10%."

## Solution
Added memory resource limits to the Couchbase container in `compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 2G
    reservations:
      memory: 1G
```

This allocates:
- **Reserved**: 1GB minimum memory
- **Limit**: 2GB maximum memory

## Apply the Fix

### Option 1: Restart the Stack (Recommended)
```bash
cd Personal/running_coach
docker compose down
docker compose up --build
```

### Option 2: Recreate Only Couchbase
```bash
cd Personal/running_coach
docker compose up -d --force-recreate couchbase
```

## Verify the Fix

1. Wait for Couchbase to fully start (check health status)
2. Open Couchbase UI: http://localhost:8091
3. Go to **Servers** tab
4. Check memory allocation - should show proper RAM allocation
5. The warning should no longer appear in logs

## Alternative: Adjust Memory Allocation

If you need different memory settings, edit `compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 4G      # Maximum memory (adjust as needed)
    reservations:
      memory: 2G      # Minimum memory (adjust as needed)
```

Then restart the stack.

## Note
The Couchbase Community Edition has some limitations compared to Enterprise. For production use, consider:
- Using Enterprise Edition
- Allocating more memory (4GB+ recommended)
- Running on dedicated hardware
- Proper cluster configuration