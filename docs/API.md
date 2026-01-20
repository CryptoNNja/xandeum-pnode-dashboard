# 🌐 API Reference

Complete documentation for all 16 REST endpoints in the Xandeum pNode Analytics Dashboard.

---

## Base URL

```
Development: http://localhost:3000/api
Production:  https://xandeum-dashboard.vercel.app/api
```

---

## Authentication

Most endpoints are **public** and don't require authentication. Protected endpoints (cron jobs, admin) require a bearer token.

### Protected Endpoints

```http
Authorization: Bearer YOUR_CRON_SECRET
```

Set `CRON_SECRET` in your `.env.local` file.

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-20T12:00:00Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-20T12:00:00Z"
}
```

---

## Endpoints

### 1. Network & Statistics

#### `GET /api/network-stats`

Get comprehensive network statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 300,
    "mainnet": 32,
    "devnet": 268,
    "active": 280,
    "gossip": 20,
    "totalStorage": 15000000000000,
    "avgHealth": 78.5,
    "avgUptime": 604800,
    "topVersion": "v0.7.3"
  }
}
```

---

#### `GET /api/network-metadata`

Get network-level metadata and aggregates.

**Response:**
```json
{
  "success": true,
  "data": {
    "mainnet": {
      "totalNodes": 32,
      "activeNodes": 30,
      "totalStorage": 5000000000000,
      "avgHealth": 85.2
    },
    "devnet": {
      "totalNodes": 268,
      "activeNodes": 250,
      "totalStorage": 10000000000000,
      "avgHealth": 75.8
    },
    "timestamp": "2025-01-20T12:00:00Z"
  }
}
```

---

#### `GET /api/network-history`

Get 7-day network history.

**Query Parameters:**
- `network` (optional): `MAINNET` | `DEVNET` | `ALL`
- `days` (optional): Number of days (default: 7)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-20",
      "totalNodes": 300,
      "activeNodes": 280,
      "avgHealth": 78.5,
      "totalStorage": 15000000000000
    },
    ...
  ]
}
```

---

#### `GET /api/network-health/yesterday`

Get network health snapshot from yesterday.

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-19",
    "totalNodes": 298,
    "activeNodes": 278,
    "avgHealth": 77.8,
    "healthDistribution": {
      "excellent": 45,
      "good": 180,
      "warning": 50,
      "critical": 3,
      "private": 20
    }
  }
}
```

---

#### `GET /api/network-health/last-week`

Get network health snapshot from last week.

---

#### `GET /api/growth-metrics`

Get network growth metrics (7-day comparison).

**Response:**
```json
{
  "success": true,
  "data": {
    "nodeGrowth": {
      "current": 300,
      "lastWeek": 285,
      "change": +15,
      "percentChange": 5.26
    },
    "storageGrowth": {
      "current": 15000000000000,
      "lastWeek": 14000000000000,
      "change": +1000000000000,
      "percentChange": 7.14
    },
    "healthImprovement": {
      "current": 78.5,
      "lastWeek": 76.2,
      "change": +2.3
    }
  }
}
```

---

### 2. Nodes (pNodes)

#### `GET /api/pnodes`

Get list of all pNodes with optional filtering.

**Query Parameters:**
- `network` (optional): `MAINNET` | `DEVNET`
- `status` (optional): `active` | `gossip_only`
- `health` (optional): `excellent` | `good` | `warning` | `critical`
- `minStorage` (optional): Minimum storage in bytes
- `country` (optional): ISO country code

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ip": "1.2.3.4",
      "pubkey": "ABC123...",
      "version": "v0.7.3",
      "network": "MAINNET",
      "status": "active",
      "city": "New York",
      "country": "US",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "stats": {
        "cpu_percent": 45.2,
        "ram_used": 8000000000,
        "ram_total": 16000000000,
        "storage_committed": 1000000000000,
        "storage_used": 500000000000,
        "uptime": 2592000,
        "packets_sent": 1000000,
        "packets_received": 950000
      },
      "confidence_score": 95,
      "health_score": 85,
      "performance_score": 88,
      "last_seen": "2025-01-20T12:00:00Z"
    },
    ...
  ],
  "total": 300
}
```

---

#### `GET /api/pnodes/summary`

Get summary statistics for pNodes (lightweight).

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 300,
    "mainnet": 32,
    "devnet": 268,
    "mainnetPublic": 30,
    "mainnetPrivate": 2,
    "devnetPublic": 250,
    "devnetPrivate": 18
  }
}
```

---

#### `GET /api/pnodes/[ip]`

Get detailed information for a specific pNode.

**URL Parameters:**
- `ip`: IP address of the node

**Response:**
```json
{
  "success": true,
  "data": {
    "ip": "1.2.3.4",
    "pubkey": "ABC123...",
    "version": "v0.7.3",
    "network": "MAINNET",
    "status": "active",
    "city": "New York",
    "country": "US",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "stats": { ... },
    "confidence_score": 95,
    "health_score": 85,
    "performance_score": 88,
    "last_seen": "2025-01-20T12:00:00Z",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

#### `GET /api/pnodes/[ip]/history`

Get 7-day history for a specific pNode.

**URL Parameters:**
- `ip`: IP address of the node

**Query Parameters:**
- `days` (optional): Number of days (default: 7, max: 30)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2025-01-20T12:00:00Z",
      "health_score": 85,
      "storage_committed": 1000000000000,
      "storage_used": 500000000000,
      "cpu_percent": 45.2,
      "ram_used": 8000000000,
      "uptime": 2592000
    },
    ...
  ]
}
```

---

### 3. Geographic Data

#### `GET /api/geographic-distribution`

Get nodes distribution by country.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "country": "United States",
      "countryCode": "US",
      "count": 120,
      "percentage": 40,
      "cities": ["New York", "San Francisco", "Chicago"]
    },
    {
      "country": "Germany",
      "countryCode": "DE",
      "count": 45,
      "percentage": 15,
      "cities": ["Berlin", "Frankfurt", "Munich"]
    },
    ...
  ],
  "totalCountries": 15
}
```

---

#### `GET /api/geolocate/[ip]`

Geolocate a specific IP address.

**URL Parameters:**
- `ip`: IP address to geolocate

**Response:**
```json
{
  "success": true,
  "data": {
    "ip": "1.2.3.4",
    "city": "New York",
    "region": "New York",
    "country": "United States",
    "countryCode": "US",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "timezone": "America/New_York",
    "isp": "Example ISP"
  }
}
```

---

### 4. Credits & Rewards

#### `GET /api/pods-credits`

Get credits information for pNodes (from official Xandeum API).

**Query Parameters:**
- `network` (optional): `MAINNET` | `DEVNET`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "pubkey": "ABC123...",
      "credits": 12500000,
      "network": "MAINNET"
    },
    ...
  ]
}
```

---

### 5. AI Chat

#### `POST /api/chat`

Chat with Ronin AI (Groq-powered).

**Request Body:**
```json
{
  "message": "How many nodes are running?",
  "context": {
    "currentView": "dashboard",
    "filters": {
      "network": "MAINNET"
    }
  }
}
```

**Response (Streaming):**
```json
{
  "success": true,
  "response": "Currently, there are 32 MAINNET nodes running...",
  "timestamp": "2025-01-20T12:00:00Z"
}
```

**Note:** This endpoint supports streaming responses via Server-Sent Events (SSE).

---

### 6. Cron Jobs (Protected)

#### `POST /api/cron/crawl`

Trigger the crawler to discover and update pNodes.

**Headers:**
```http
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nodesDiscovered": 305,
    "nodesUpdated": 300,
    "newNodes": 5,
    "duration": "45s"
  }
}
```

**Automated Schedule:** Every 5 minutes via Vercel Cron

---

### 7. Admin (Protected)

#### `POST /api/admin/backfill`

Backfill geolocation data for nodes missing location.

**Headers:**
```http
Authorization: Bearer YOUR_BACKFILL_SECRET
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nodesProcessed": 50,
    "nodesUpdated": 48,
    "nodesFailed": 2
  }
}
```

---

## Rate Limiting

### Current Limits

- **100 requests / minute / IP** for public endpoints
- **1000 requests / hour / IP** for public endpoints
- **No rate limit** for authenticated endpoints

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1674216000
```

### 429 Response

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_PARAM` | Invalid query parameter |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Missing or invalid auth token |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |
| `DATABASE_ERROR` | Database connection issue |
| `EXTERNAL_API_ERROR` | External service failure |

---

## Caching

### Client-Side Caching

Recommended cache durations:
- `/api/network-stats`: 1 minute
- `/api/pnodes`: 1 minute
- `/api/pnodes/[ip]`: 5 minutes
- `/api/pnodes/[ip]/history`: 5 minutes
- `/api/geographic-distribution`: 1 hour

### Server-Side Caching

All endpoints have server-side caching:
- Network stats: 1 minute
- Node lists: 1 minute
- Individual nodes: 5 minutes
- Geographic data: 1 hour

---

## Examples

### Fetch All MAINNET Nodes with Good Health

```javascript
const response = await fetch('/api/pnodes?network=MAINNET&health=good');
const { data } = await response.json();
console.log(`Found ${data.length} healthy MAINNET nodes`);
```

### Get Node Details with Error Handling

```javascript
try {
  const response = await fetch('/api/pnodes/1.2.3.4');
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const { data } = await response.json();
  console.log('Node:', data);
} catch (error) {
  console.error('Failed to fetch node:', error);
}
```

### Stream Chat Responses

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'How many nodes are running?',
    context: { currentView: 'dashboard' }
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log('AI:', chunk);
}
```

---

## WebSocket Support (Planned)

Real-time updates via WebSocket will be added in a future version:

```javascript
const ws = new WebSocket('wss://xandeum-dashboard.vercel.app/ws');

ws.on('node:updated', (node) => {
  console.log('Node updated:', node);
});

ws.on('network:stats', (stats) => {
  console.log('Network stats:', stats);
});
```

---

## Related Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [Database Schema](DATABASE.md)
- [Deployment Guide](DEPLOYMENT.md)
